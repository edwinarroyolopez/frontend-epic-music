import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { GUEST_HISTORY_KEY, readGuestHistory, saveGuestSearch, guestHistoryApi, historySnapshot } from '../src/services/search-history.js'
import { es } from '../src/translations/es.js'
import { en } from '../src/translations/en.js'
const store = new Map()
globalThis.window = new EventTarget()
window.localStorage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) }
afterEach(() => store.clear())
const result = { found: true, song: { title: 'Fixture', artist: 'Fixture Artist', lyrics: 'must not persist' }, recommendations: Array.from({ length: 11 }, (_, i) => ({ title: `Fixture ${i}`, artist: 'Artist', reason: 'Fixture reason', token: 'must not persist' })), lyrics: 'must not persist' }
test('guest snapshots allowlist, reload, unique request IDs, details and delete', async () => {
  const requestId = randomUUID()
  for (let i = 0; i < 2; i++) saveGuestSearch({ requestId, body: { lyrics: 'must not persist', artist: 'Hint', jwt: 'must not persist' }, result })
  assert.equal(readGuestHistory().length, 1)
  assert.ok(!store.get(GUEST_HISTORY_KEY).includes('must not persist'))
  const detail = (await guestHistoryApi.detail(requestId)).entry
  assert.equal(detail.result.recommendations.length, 11)
  assert.equal(detail.input.original.artist, 'Hint')
  assert.equal(detail.song.catalogVerified, false)
  await guestHistoryApi.remove(requestId)
  assert.equal(readGuestHistory().length, 0)
})
test('guest cap 50, time retention, pagination, account isolation and unavailable/corrupt storage', async () => {
  for (let i = 0; i < 53; i++) saveGuestSearch({ requestId: randomUUID(), result })
  assert.equal(readGuestHistory().length, 50)
  const first = await guestHistoryApi.list(), next = await guestHistoryApi.list(first.nextCursor)
  assert.equal(first.entries.length, 20)
  assert.equal(next.entries.length, 20)
  assert.ok(next.entries.every(e => !first.entries.some(p => p.id === e.id)))
  const before = store.get(GUEST_HISTORY_KEY)
  store.set('me:token', 'fixture-token')
  assert.throws(() => saveGuestSearch({ requestId: randomUUID(), result }), { code: 'LOCAL_HISTORY_UNAVAILABLE' })
  assert.equal(store.get(GUEST_HISTORY_KEY), before)
  store.delete('me:token')
  store.set(GUEST_HISTORY_KEY, JSON.stringify([{ ...historySnapshot({ id: randomUUID(), result }), createdAt: '2020-01-01T00:00:00.000Z' }]))
  assert.deepEqual(readGuestHistory(), [])
  store.set(GUEST_HISTORY_KEY, '{bad')
  assert.throws(readGuestHistory, { code: 'LOCAL_HISTORY_UNAVAILABLE' })
  store.delete(GUEST_HISTORY_KEY)
  const previous = window.localStorage.setItem
  window.localStorage.setItem = () => { throw new DOMException('fixture quota', 'QuotaExceededError') }
  try { assert.throws(() => saveGuestSearch({ requestId: randomUUID(), result }), { code: 'LOCAL_HISTORY_UNAVAILABLE' }) }
  finally { window.localStorage.setItem = previous }
})
test('not_found and client/provider errors never invent saved songs or preserve raw errors', () => {
  const miss = historySnapshot({ id: randomUUID(), result: { ...result, found: false } })
  assert.equal(miss.song, null); assert.deepEqual(miss.result.recommendations, [])
  const failure = historySnapshot({ id: randomUUID(), error: { code: 'TIMEOUT', message: 'must not persist', token: 'must not persist' } })
  assert.equal(failure.status, 'error'); assert.equal(failure.errorCode, 'TIMEOUT'); assert.equal(failure.result, null)
  assert.ok(!JSON.stringify(failure).includes('must not persist'))
  assert.deepEqual(Object.keys(es.history).sort(), Object.keys(en.history).sort())
})
