import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { songLinks } from '../src/utils/song-links.js'
import { getLyrics } from '../src/services/lyrics.js'
import { toSongInput } from '../src/services/playlists.js'
import { historySnapshot } from '../src/services/search-history.js'
import { es } from '../src/translations/es.js'
import { en } from '../src/translations/en.js'
import { tableRows } from '../src/utils/table.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })
test('links are generated from song metadata, including old saved songs, ignoring untrusted links', () => {
  const song = { title: 'Fixture & title / é', artist: 'Artist #1', links: { spotify: 'javascript:invalid' } }
  const links = songLinks(song)
  assert.equal(new URL(links.youtube).searchParams.get('search_query'), `${song.title} ${song.artist}`)
  assert.equal(new URL(links.spotify).hostname, 'open.spotify.com')
  assert.equal(new URL(links.appleMusic).searchParams.get('term'), `${song.title} ${song.artist}`)
})
test('lyrics requests encode metadata, never send token/input fragment, validate response and cancel', async () => {
  globalThis.fetch = async (url, options) => {
    const parsed = new URL(url)
    assert.equal(parsed.pathname, '/songs/lyrics'); assert.equal(parsed.searchParams.get('title'), 'Fixture & song')
    assert.equal(parsed.searchParams.get('lyrics'), null); assert.equal(options.headers.Authorization, undefined)
    return Response.json({ success: true, data: { status: 'available', lyrics: 'Synthetic complete fixture' } })
  }
  assert.equal((await getLyrics({ title: 'Fixture & song', artist: 'Fixture artist' })).status, 'available')
  globalThis.fetch = async () => Response.json({ success: true, data: { status: 'available', lyrics: '' } })
  await assert.rejects(getLyrics({ title: 'x', artist: 'y' }), { code: 'INVALID_RESPONSE' })
  globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('fixture', 'AbortError')), { once: true }))
  const controller = new AbortController(), pending = getLyrics({ title: 'x', artist: 'y' }, { signal: controller.signal }); controller.abort()
  await assert.rejects(pending, { name: 'AbortError' })
})
test('complete lyrics and links are never persisted in playlist payloads or history snapshots', () => {
  const song = { title: 'Fixture song', artist: 'Fixture artist', lyrics: 'synthetic-private-full-lyrics', links: songLinks({ title: 'Fixture song', artist: 'Fixture artist' }) }
  const persisted = JSON.stringify([toSongInput(song, 'identified'), historySnapshot({ id: 'fixture', result: { found: true, song, recommendations: [song] } })])
  assert.ok(!persisted.includes(song.lyrics)); assert.ok(!persisted.includes('youtube.com'))
  for (const key of ['musicLinks', 'lyrics', 'table', 'emotions']) assert.deepEqual(Object.keys(es[key]).sort(), Object.keys(en[key]).sort())
})
test('shared table filters accents and sorts numeric/date values stably without mutating API rows', () => {
  const rows = [{ id: 'a', name: 'Álbum', count: 11 }, { id: 'b', name: 'Zeta', count: 2 }, { id: 'c', name: 'Beta', count: 2 }]
  const columns = [{ key: 'name', sortValue: row => row.name }, { key: 'count', sortValue: row => row.count }]
  assert.deepEqual(tableRows(rows, columns, 'album', null, row => row.name).map(row => row.id), ['a'])
  assert.deepEqual(tableRows(rows, columns, '', { key: 'count', direction: 'asc' }, row => row.name).map(row => row.id), ['b', 'c', 'a'])
  assert.deepEqual(tableRows(rows, columns, '', { key: 'name', direction: 'desc' }, row => row.name).map(row => row.id), ['b', 'c', 'a'])
  assert.deepEqual(rows.map(row => row.id), ['a', 'b', 'c'])
})
test('same lyrics request includes three validated emotions; malformed metrics preserve the lyrics', async () => {
  let calls = 0
  const response = { status: 'available', lyrics: 'Synthetic recommendation lyrics', emotions: [{ code: 'love', score: 20 }, { code: 'sadness', score: 50 }, { code: 'nostalgia', score: 30 }], emotionAnalysis: { status: 'estimated', scope: 'lyrics' } }
  globalThis.fetch = async url => {
    calls++; assert.equal(new URL(url).searchParams.get('title'), 'Recommendation')
    return Response.json({ success: true, data: response })
  }
  const data = await getLyrics({ title: 'Recommendation', artist: 'Fixture' })
  assert.equal(calls, 1); assert.equal(data.emotions.length, 3); assert.equal(data.emotions[0].score, 50)
  response.emotions[0].score = 99
  const invalid = await getLyrics({ title: 'Recommendation', artist: 'Fixture' })
  assert.equal(invalid.lyrics, response.lyrics); assert.deepEqual(invalid.emotions, [])
  assert.equal(invalid.emotionAnalysis.status, 'unavailable')
})
