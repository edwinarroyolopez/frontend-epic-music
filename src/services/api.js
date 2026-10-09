import { API_CONFIG } from './config.js'
import { getToken, setToken } from './auth.js'

export const ARTISTS_UPDATED_EVENT = 'artists:updated'

export class ApiError extends Error {
  constructor(message, { code = 'UNKNOWN', status = 0, history, input, retryAfter = 0 } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.history = history
    this.input = input
    this.retryAfter = retryAfter
  }
}
const statusCodes = { 400: 'VALIDATION_ERROR', 401: 'UNAUTHORIZED', 403: 'ACCOUNT_DISABLED', 404: 'NOT_FOUND', 409: 'CONFLICT', 413: 'VALIDATION_ERROR', 422: 'VALIDATION_ERROR', 429: 'RATE_LIMITED', 502: 'PROVIDER_ERROR', 503: 'UNAVAILABLE' }
export function describeError(error, t) {
  const known = ['VALIDATION_ERROR', 'UNAUTHORIZED', 'ACCOUNT_DISABLED', 'NOT_FOUND', 'CONFLICT', 'LIMIT_REACHED', 'RATE_LIMITED', 'PROVIDER_ERROR', 'UNAVAILABLE', 'TIMEOUT', 'NETWORK_ERROR', 'INVALID_RESPONSE', 'SEARCH_IN_PROGRESS', 'INTERRUPTED']
  return { title: t('states.error'), description: t(`apiErrors.${known.includes(error?.code) ? error.code : 'UNKNOWN'}`) }
}

/** HTTP común: timeout incluye lectura del body; cancelar no se confunde con timeout. */
export async function request(path, { method = 'GET', body, auth = false, signal, timeout = API_CONFIG.timeout } = {}) {
  const token = auth ? getToken() : null
  if (auth === true && !token) throw new ApiError('Sign in required', { code: 'UNAUTHORIZED', status: 401 })
  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort()
  if (signal?.aborted) abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => { timedOut = true; abort() }, timeout)
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${path}`, {
      method, signal: controller.signal,
      headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (token && [401, 403].includes(response.status) && getToken() === token) {
      setToken(null)
      window.dispatchEvent(new Event('auth:expired'))
    }
    let payload
    try { payload = await response.json() }
    catch (error) {
      if (controller.signal.aborted) throw error
      throw new ApiError('Invalid JSON', { code: 'INVALID_RESPONSE', status: response.status })
    }
    if (!response.ok || payload.success === false) {
      throw new ApiError(typeof payload.error === 'string' ? payload.error : payload.error?.message || payload.message || 'API error', {
        code: payload.error?.code || payload.code || statusCodes[response.status] || 'UNKNOWN', status: response.status,
         history: payload.history, input: payload.input,
         retryAfter: Math.min(300, Math.max(0, Number(response.headers.get('Retry-After')) || 0)),
      })
    }
    // A response from an earlier login must never populate the next account's UI.
    if (auth && getToken() !== token) throw new DOMException('Session changed', 'AbortError')
    return payload
  } catch (error) {
    if (timedOut) throw new ApiError('Timeout', { code: 'TIMEOUT' })
    if (controller.signal.aborted || error.name === 'AbortError') throw new DOMException('Cancelled', 'AbortError')
    if (error instanceof ApiError) throw error
    throw new ApiError('Network error', { code: 'NETWORK_ERROR' })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

export async function searchSongs(body, options = {}) {
  const { data } = await request('/search-songs', { method: 'POST', body, auth: 'optional', timeout: API_CONFIG.aiTimeout, ...options })
  if (!data || typeof data.found !== 'boolean' || (data.found && (!data.song?.title || !data.song?.artist))) {
    throw new ApiError('Invalid search response', { code: 'INVALID_RESPONSE' })
  }
  if (data.found && data.directory?.status === 'saved' && typeof window !== 'undefined') window.dispatchEvent(new Event(ARTISTS_UPDATED_EVENT))
  return { ...data, song: data.found ? data.song : null, recommendations: data.found && Array.isArray(data.recommendations) ? data.recommendations : [] }
}
export async function suggestArtists(q, options = {}) {
  const { data } = await request(`/artists/suggest?q=${encodeURIComponent(q)}&limit=6`, options)
  if (!Array.isArray(data?.artists)) throw new ApiError('Invalid suggestions', { code: 'INVALID_RESPONSE' })
  return data.artists
}
export async function checkApiHealth() {
  const { data } = await request('/health')
  return { conectada: data?.database === 'connected' }
}
