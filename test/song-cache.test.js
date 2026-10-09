import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { loadSongLyrics, clearLyricsMemory, peekLyrics } from '../src/services/lyrics.js'
import { historySnapshot } from '../src/services/search-history.js'
import { toSongInput } from '../src/services/playlists.js'
const original = globalThis.fetch
const originalWindow = globalThis.window
const input = { songId: '123456789012345678901234', title: 'Own A', artist: 'Fixture' }
const data = { ...input, status: 'available', lyrics: 'Own synthetic fixture', emotions: [], emotionAnalysis: { status: 'insufficient_evidence' } }
afterEach(() => { globalThis.fetch = original; globalThis.window = originalWindow; clearLyricsMemory() })
test('20 subscribers, aborted viewer and reopening use one backend request; ID and legacy aliases share memory', async () => {
  let calls = 0
  globalThis.fetch = async (_url, options) => { calls++; assert.equal(options.headers.Authorization, undefined); await new Promise(r => setTimeout(r, 20)); return Response.json({ data }) }
  const controller = new AbortController()
  const cancelled = loadSongLyrics(input, { signal: controller.signal }); controller.abort()
  await assert.rejects(cancelled, { name: 'AbortError' })
  const results = await Promise.all(Array.from({ length: 20 }, () => loadSongLyrics(input)))
  assert.ok(results.every(r => r.lyrics === data.lyrics))
  await loadSongLyrics(input); await loadSongLyrics({ title: input.title, artist: input.artist })
  assert.equal(calls, 1)
  assert.equal(peekLyrics(input).songId, input.songId)
})
test('different artist is never served from A; malformed ID/content fails without poisoning cache', async () => {
  globalThis.fetch = async () => Response.json({ data })
  await loadSongLyrics(input)
  await assert.rejects(loadSongLyrics({ title: input.title, artist: 'Another' }), { code: 'INVALID_RESPONSE' })
  assert.equal(peekLyrics({ title: input.title, artist: 'Another' }), undefined)
})
test('retry is explicitly analysis-only and metadata snapshots retain references, never text', async () => {
  const queries = []
  globalThis.fetch = async url => { queries.push(new URL(url)); return Response.json({ data }) }
  await loadSongLyrics(input); await loadSongLyrics(input, { analysisOnly: true })
  assert.equal(queries.length, 2); assert.equal(queries[1].searchParams.get('analysisOnly'), 'true')
  const snapshot = historySnapshot({ id: 'fixture', result: { found: true, song: data, recommendations: [] } })
  assert.equal(snapshot.song.songId, input.songId)
  assert.equal(toSongInput(data, 'identified').songId, input.songId)
  assert.ok(!JSON.stringify(snapshot).includes(data.lyrics))
})
test('already hydrated Song detail and restricted/negative states reuse memory', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls++; return Response.json({ data: { ...input, status: 'rights_restricted', lyrics: null } }) }
  assert.equal((await loadSongLyrics(data)).lyrics, data.lyrics); assert.equal(calls, 0)
  clearLyricsMemory()
  assert.equal((await loadSongLyrics(input)).status, 'rights_restricted')
  await loadSongLyrics(input); assert.equal(calls, 1)
})
test('late public response cannot populate a changed session, even when transport ignores abort', async () => {
  let token = 'session-A', release
  globalThis.window = { localStorage: { getItem: () => token } }
  globalThis.fetch = () => new Promise(resolve => { release = () => resolve(Response.json({ data })) })
  const pending = loadSongLyrics(input)
  token = 'session-B'; release()
  await assert.rejects(pending, { name: 'AbortError' })
})
test('202 is polled to completion with shared requests and no automatic retry for transient failures', async () => {
  let calls = 0
  globalThis.fetch = async () => Response.json({ data: ++calls === 1 ? { ...input, status: 'in_progress', retryAfter: 1 } : data }, { status: calls === 1 ? 202 : 200 })
  const values = await Promise.all([loadSongLyrics(input), loadSongLyrics(input)])
  assert.equal(calls, 2); assert.equal(values[0].lyrics, data.lyrics)
  clearLyricsMemory(); calls = 0
  globalThis.fetch = async () => { calls++; return Response.json({ data: { ...input, status: 'temporary_error', retryAfter: 90 } }) }
  assert.equal((await loadSongLyrics(input)).status, 'temporary_error'); assert.equal(calls, 1)
})
test('manual refetch bypasses a cached miss once, shares work, then refreshes ID and metadata aliases', async () => {
  const queries = []
  globalThis.fetch = async url => {
    queries.push(new URL(url)); await new Promise(r => setTimeout(r, 15))
    return Response.json({ data: queries.length === 1 ? { ...input, status: 'not_found', lyrics: null } : data })
  }
  await loadSongLyrics(input); await loadSongLyrics(input); assert.equal(queries.length, 1)
  const responses = await Promise.all(Array.from({ length: 20 }, () => loadSongLyrics(input, { refetchLyrics: true })))
  assert.ok(responses.every(d => d.status === 'available'))
  assert.equal(queries.length, 2); assert.equal(queries[1].searchParams.get('refetchLyrics'), 'true')
  assert.equal(queries[1].searchParams.get('analysisOnly'), null)
  assert.equal((await loadSongLyrics({ title: input.title, artist: input.artist })).status, 'available')
  assert.equal(queries.length, 2)
})
test('refetch polling never repeats the manual command and a transient failure removes stale negative aliases', async () => {
  const queries = []
  globalThis.fetch = async url => {
    queries.push(new URL(url))
    return Response.json({ data: queries.length === 1 ? { ...input, status: 'rights_restricted', lyrics: null } :
      queries.length === 2 ? { ...input, status: 'in_progress', retryAfter: 1 } : { ...input, status: 'temporary_error' } })
  }
  await loadSongLyrics(input)
  assert.equal((await loadSongLyrics(input, { refetchLyrics: true })).status, 'temporary_error')
  assert.equal(queries[1].searchParams.get('refetchLyrics'), 'true')
  assert.equal(queries[2].searchParams.get('refetchLyrics'), null)
  assert.equal(peekLyrics(input), undefined)
  assert.equal(peekLyrics({ title: input.title, artist: input.artist }), undefined)
})
test('transient lyrics wait for pending analysis, reuse memory and stay out of snapshots', async () => {
  let calls = 0
  globalThis.fetch = async () => Response.json({ data: { ...data, lyricsStorage: 'transient', cacheState: 'transient',
    emotionAnalysis: ++calls === 1 ? { status: 'not_started' } : data.emotionAnalysis } })
  const loaded = await loadSongLyrics(input)
  assert.equal(calls, 2); assert.equal(loaded.lyricsStorage, 'transient'); assert.equal(loaded.lyrics, data.lyrics)
  await loadSongLyrics(input); assert.equal(calls, 2)
  assert.ok(!JSON.stringify(toSongInput(loaded, 'identified')).includes(data.lyrics))
  assert.ok(!JSON.stringify(historySnapshot({ id: 'fixture', result: { found: true, song: loaded, recommendations: [] } })).includes(data.lyrics))
})
