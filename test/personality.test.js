import { test } from 'node:test'
import assert from 'node:assert/strict'
import { localPersonalityHistory } from '../src/services/personality-history.js'
import { parseSongs, reviewSongs } from '../src/utils/playlist-input.js'
import { es } from '../src/translations/es.js'
import { en } from '../src/translations/en.js'
const songs = parseSongs('First — Artist\nSecond — Artist\nFirst — Artist')
const input = { sourceMode: 'manual', language: 'es', title: 'Selection', songs }
const entry = i => ({ id: String(i), title: 'Selection', songs: songs.map(s => ({ ...s, lyrics: 'FORBIDDEN', token: 'FORBIDDEN' })), status: 'completed', sourceMode: 'manual', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), report: { analysisVersion: '1.0.0', lyrics: 'FORBIDDEN', token: 'FORBIDDEN', narrative: { headline: 'Synthetic' } } })
test('manual editor: duplicates, invalid/malicious text, missing artist, ES/EN parity', () => {
  assert.equal(reviewSongs(songs)[2].duplicate, true)
  assert.equal(reviewSongs(parseSongs('Incomplete'))[0].valid, false)
  assert.equal(reviewSongs(parseSongs('<img> — Artist'))[0].valid, false)
  assert.deepEqual(Object.keys(es.personality).sort(), Object.keys(en.personality).sort())
})
test('local history: allowlist, exact cache, mode isolation, cap, expiration, delete, quota and corrupt data', () => {
  const values = new Map(), storage = { getItem: k => values.get(k), setItem: (k, v) => values.set(k, v) }
  const guest = localPersonalityHistory('guest', storage), demo = localPersonalityHistory('demo', storage)
  guest.save(entry(1), input); assert.equal(guest.find(input).id, '1'); assert.equal(demo.list().entries.length, 0)
  assert.ok(![...values.values()].join('').includes('FORBIDDEN'))
  assert.equal(guest.find({ ...input, songs: [...songs].reverse() })?.id, '1') // Palindromic exact snapshot.
  assert.equal(guest.find({ ...input, title: 'Changed' }), undefined)
  for (let i = 0; i < 55; i++) guest.save(entry(i), { ...input, title: String(i) })
  assert.equal(guest.list().entries.length, 50)
  guest.remove('54'); assert.equal(guest.list().entries.length, 49)
  guest.save({ ...entry('old'), expiresAt: new Date(0).toISOString() }, input)
  assert.equal(guest.find(input), undefined)
  assert.throws(() => localPersonalityHistory('guest', { getItem: () => null, setItem: () => { throw new Error('quota') } }).save(entry(1), input), /LOCAL_HISTORY_UNAVAILABLE/)
  assert.throws(() => localPersonalityHistory('guest', { getItem: () => '{' }).list(), /LOCAL_HISTORY_UNAVAILABLE/)
  assert.throws(() => guest.save({ ...entry('big'), report: { analysisVersion: '1.0.0', narrative: { headline: 'x'.repeat(1000001) } } }, input), /LOCAL_HISTORY_UNAVAILABLE/)
})
