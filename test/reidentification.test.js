import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { recallFragment, rememberFragment, reidentifySource } from '../src/services/reidentification.js'
import { readGuestHistory, saveGuestSearch, GUEST_HISTORY_KEY } from '../src/services/search-history.js'
import { toSongInput } from '../src/services/playlists.js'
import { es } from '../src/translations/es.js'
import { en } from '../src/translations/en.js'

const store = new Map()
globalThis.window = new EventTarget()
window.localStorage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) }
const originalFetch = globalThis.fetch
afterEach(() => { store.clear(); globalThis.fetch = originalFetch })
const old = { title: 'Wrong title', artist: 'Fixture', songId: 'a'.repeat(24) }
const song = { title: 'Verified title', artist: 'Fixture', songId: 'b'.repeat(24), catalogVerified: true }
const lyrics = 'Synthetic distinctive original fragment'
test('fragment memory is bounded, isolated across sessions and never stored', () => {
  const id = randomUUID()
  rememberFragment(id, { lyrics, artist: 'Fixture' })
  assert.equal(recallFragment(id).lyrics, lyrics); assert.equal(store.size, 0)
  store.set('me:token', 'account-A'); assert.equal(recallFragment(id), undefined)
  rememberFragment(id, { lyrics }); store.set('me:token', 'account-B'); assert.equal(recallFragment(id), undefined)
  for (let i = 0; i < 21; i++) rememberFragment(String(i), { lyrics })
  assert.equal(recallFragment('0'), undefined); assert.equal(recallFragment('20').lyrics, lyrics)
})
test('guest correction persists a metadata-only replacement and playlist payload uses the corrected ID', async () => {
  const id = randomUUID()
  saveGuestSearch({ requestId: id, result: { found: true, song: old, recommendations: [{ title: 'Recommendation', artist: 'Other' }] } })
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/reidentify-song'))
    const body = JSON.parse(options.body)
    assert.equal(body.lyrics, lyrics); assert.equal(body.historyId, undefined); assert.equal(body.previous.songId, undefined)
    return Response.json({ success: true, data: { found: true, song: { ...song, lyrics }, verification: 'lyrics_match' } })
  }
  const data = await reidentifySource({ song: old, lyrics, local: true, historyId: id })
  assert.equal(data.history.status, 'local_saved')
  const entry = readGuestHistory()[0]
  assert.equal(entry.result.song.songId, song.songId); assert.equal(entry.song.title, song.title)
  assert.equal(entry.result.recommendations.length, 1); assert.equal(entry.song.catalogVerified, true)
  assert.ok(!store.get(GUEST_HISTORY_KEY).includes(lyrics))
  assert.equal(toSongInput(entry.song, 'identified').songId, song.songId)
  assert.equal(toSongInput(entry.song, 'identified').lyrics, undefined)
})
test('misses and malformed corrections preserve history; account requests send owned history reference', async () => {
  const id = randomUUID()
  saveGuestSearch({ requestId: id, result: { found: true, song: old, recommendations: [] } })
  globalThis.fetch = async () => Response.json({ success: true, data: { found: false, song: null, reason: 'unconfirmed' } })
  assert.equal((await reidentifySource({ song: old, lyrics, local: true, historyId: id })).found, false)
  assert.equal(readGuestHistory()[0].song.title, old.title)
  globalThis.fetch = async () => Response.json({ success: true, data: { found: true, song } })
  await assert.rejects(reidentifySource({ song: old, lyrics, local: true, historyId: id }), { code: 'INVALID_RESPONSE' })
  store.set('me:token', 'account-token')
  globalThis.fetch = async (_url, options) => {
    assert.equal(JSON.parse(options.body).historyId, 'c'.repeat(24)); assert.equal(options.headers.Authorization, 'Bearer account-token')
    return Response.json({ success: true, data: { found: true, song, verification: 'lyrics_match', history: { status: 'saved' } } })
  }
  assert.equal((await reidentifySource({ song: old, lyrics, historyId: 'c'.repeat(24) })).history.status, 'saved')
  assert.deepEqual(Object.keys(es.reidentify).sort(), Object.keys(en.reidentify).sort())
  assert.deepEqual(Object.keys(es.historySongs).sort(), Object.keys(en.historySongs).sort())
})
