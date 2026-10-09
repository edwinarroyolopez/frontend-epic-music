import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { request, searchSongs, suggestArtists, ARTISTS_UPDATED_EVENT } from '../src/services/api.js'
import { playlistsApi, toSongInput } from '../src/services/playlists.js'
import { es } from '../src/translations/es.js'
import { en } from '../src/translations/en.js'
import { getProviders, loginWithEmail, describeAuthError } from '../src/services/auth.js'

const originalFetch = globalThis.fetch
const store = new Map()
globalThis.window = new EventTarget()
window.localStorage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) }
afterEach(() => { globalThis.fetch = originalFetch; store.clear() })

test('public providers GET avoids JSON preflight; login still sends JSON and handles unavailable backend', async () => {
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/auth/providers'))
    assert.equal(options.method, 'GET')
    assert.deepEqual(options.headers, {})
    assert.equal(options.body, undefined)
    return Response.json({ email: true, apple: false, google: false, spotify: false })
  }
  assert.equal((await getProviders()).email, true)
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/auth/login'))
    assert.equal(options.method, 'POST')
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(options.body), { email: 'test@example.test', password: 'synthetic-test' })
    return Response.json({ success: false, message: 'Database unavailable' }, { status: 503 })
  }
  await assert.rejects(loginWithEmail({ email: 'test@example.test', password: 'synthetic-test' }), { code: 'SERVER_ERROR', status: 503 })
})

test('auth configuration failures retain a translatable code and provider availability', async () => {
  globalThis.fetch = async () => Response.json({ email: false, emailUnavailableReason: 'JWT_SECRET_MISSING' })
  const providers = await getProviders()
  assert.equal(providers.email, false)
  assert.equal(providers.emailUnavailableReason, 'JWT_SECRET_MISSING')
  globalThis.fetch = async () => Response.json({ success: false, code: 'AUTH_UNAVAILABLE', message: 'Unavailable' }, { status: 503 })
  await assert.rejects(loginWithEmail({ email: 'test@example.test', password: 'synthetic-test' }), error => {
    assert.equal(error.code, 'AUTH_UNAVAILABLE')
    assert.equal(error.status, 503)
    assert.equal(describeAuthError(error, key => key), 'login.errors.unavailable')
    return true
  })
})

test('exact POST body and actual search envelope; no fictitious metadata', async () => {
  const body = { lyrics: 'Synthetic fragment used only for tests', artist: 'Hint' }
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/search-songs'))
    assert.equal(options.method, 'POST')
    assert.deepEqual(JSON.parse(options.body), body)
    assert.equal(options.headers.Authorization, undefined)
    return Response.json({ success: true, data: { found: true, song: { title: 'Source', artist: 'Artist' } } })
  }
  const result = await searchSongs(body)
  assert.deepEqual(result.recommendations, [])
  assert.equal(result.song.duration, undefined)
  assert.deepEqual(toSongInput({ ...result.song, modelConfidence: .99, lyrics: 'must not persist', id: 'not a catalog ID' }, 'identified'), { title: 'Source', artist: 'Artist', originType: 'identified', catalogVerified: false })
})
test('found:false suppresses any songs and invalid envelopes fail', async () => {
  globalThis.fetch = async () => Response.json({ success: true, data: { found: false, song: { title: 'Wrong' }, recommendations: [{}] } })
  assert.equal((await searchSongs({})).song, null)
  assert.deepEqual((await searchSongs({})).recommendations, [])
  globalThis.fetch = async () => Response.json({ success: true })
  await assert.rejects(searchSongs({}), { code: 'INVALID_RESPONSE' })
})
test('private requests require token; expiration clears session; structured errors', async () => {
  let calls = 0, expired = false
  const onExpired = () => { expired = true }
  window.addEventListener('auth:expired', onExpired)
  globalThis.fetch = async (_url, options) => {
    calls++
    assert.equal(options.headers.Authorization, 'Bearer test-only')
    return Response.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'expired' } }, { status: 401 })
  }
  await assert.rejects(playlistsApi.list(), { status: 401 })
  assert.equal(calls, 0)
  store.set('me:token', 'test-only')
  await assert.rejects(playlistsApi.list(), { status: 401 })
  assert.equal(expired, true)
  assert.equal(store.has('me:token'), false)
  window.removeEventListener('auth:expired', onExpired)
})
test('HTTP codes, malformed JSON, network failure, timeout and caller cancellation', async () => {
  for (const [status, code] of [[400, 'VALIDATION_ERROR'], [403, 'ACCOUNT_DISABLED'], [404, 'NOT_FOUND'], [409, 'CONFLICT'], [429, 'RATE_LIMITED'], [502, 'PROVIDER_ERROR']]) {
    globalThis.fetch = async () => Response.json({ success: false, error: 'failure' }, { status })
    await assert.rejects(request('/test'), { status, code })
  }
  globalThis.fetch = async () => new Response('invalid JSON')
  await assert.rejects(request('/test'), { code: 'INVALID_RESPONSE' })
  globalThis.fetch = async () => { throw new TypeError('network') }
  await assert.rejects(request('/test'), { code: 'NETWORK_ERROR' })
  globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
    const abort = () => reject(new DOMException('aborted', 'AbortError'))
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  })
  await assert.rejects(request('/test', { timeout: 5 }), { code: 'TIMEOUT' })
  const controller = new AbortController()
  const promise = request('/test', { signal: controller.signal })
  controller.abort()
  await assert.rejects(promise, { name: 'AbortError' })
})
test('new translation namespaces have matching keys in es/en', () => {
  for (const key of ['discovery', 'playlists', 'apiErrors', 'intelligence']) assert.deepEqual(Object.keys(es[key]).sort(), Object.keys(en[key]).sort())
})
test('search optional JWT, public suggestions and persistence error metadata are distinct', async () => {
  store.set('me:token', 'test-only')
  globalThis.fetch = async (url, options) => {
    if (url.includes('/artists/suggest')) {
      assert.equal(options.headers.Authorization, undefined)
      assert.ok(url.includes('q=AC%2FDC'))
      return Response.json({ success: true, data: { artists: [] } })
    }
    assert.equal(options.headers.Authorization, 'Bearer test-only')
    return Response.json({ success: false, error: 'fixture', code: 'PROVIDER_ERROR', history: { status: 'saved', id: 'fixture' } }, { status: 502 })
  }
  assert.deepEqual(await suggestArtists('AC/DC'), [])
  await assert.rejects(searchSongs({ lyrics: 'fixture' }), error => error.code === 'PROVIDER_ERROR' && error.history.status === 'saved')
})
test('an earlier account response is discarded even if the HTTP transport ignores cancellation', async () => {
  store.set('me:token', 'account-a-fixture')
  let respond
  globalThis.fetch = () => new Promise(resolve => { respond = resolve })
  const pending = request('/search-history', { auth: true })
  store.set('me:token', 'account-b-fixture')
  respond(Response.json({ success: true, data: { entries: [{ id: 'a-private-fixture' }] } }))
  await assert.rejects(pending, { name: 'AbortError' })
})
test('only confirmed artist writes invalidate suggestions after a successful search', async () => {
  let updates = 0
  const listener = () => { updates++ }
  window.addEventListener(ARTISTS_UPDATED_EVENT, listener)
  try {
    for (const [found, status] of [[true, 'saved'], [true, 'unavailable'], [false, 'unchanged']]) {
      globalThis.fetch = async () => Response.json({ success: true, data: { found, song: found ? { title: 'Fixture', artist: 'Fixture Artist' } : null, directory: { status } } })
      await searchSongs({ lyrics: 'Synthetic fixture for directory update' })
    }
    assert.equal(updates, 1)
  } finally { window.removeEventListener(ARTISTS_UPDATED_EVENT, listener) }
})
