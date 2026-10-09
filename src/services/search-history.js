import { request, ApiError } from './api.js'
import { getToken } from './auth.js'

export const GUEST_HISTORY_KEY = 'me:guest-search-history:v1'
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000
const text = (value, max = 200) => typeof value === 'string' ? value.slice(0, max) : null
const hints = value => ({ artist: text(value?.artist), genre: text(value?.genre) })
const safeInput = value => ({
  original: hints(value?.original), resolved: hints(value?.resolved),
  corrections: (Array.isArray(value?.corrections) ? value.corrections : []).slice(0, 10).filter(c => ['artist', 'genre'].includes(c?.field)).map(c => ({
    field: c.field, original: text(c.original), suggested: text(c.suggested), applied: c.applied === true,
    source: text(c.source, 40), confidenceBand: c.confidenceBand === 'high' ? 'high' : 'uncertain',
  })), needsConfirmation: value?.needsConfirmation === true, directoryStatus: value?.directoryStatus === 'available' ? 'available' : 'unavailable',
})
const safeSong = value => value?.title && value?.artist ? {
  ...(typeof value.songId === 'string' && /^[a-f\d]{24}$/i.test(value.songId) && { songId: value.songId }),
  ...(typeof value.edition === 'string' && { edition: text(value.edition) }),
  title: text(value.title), artist: text(value.artist), genre: text(value.genre), album: text(value.album),
  reason: text(value.reason, 2000), releaseYear: Number.isInteger(value.releaseYear) ? value.releaseYear : null,
  catalogVerified: value.catalogVerified === true,
} : null
export function historySnapshot({ id, createdAt = new Date().toISOString(), body, result, error }) {
  const input = safeInput(result?.input || error?.input || { original: body, resolved: body })
  const found = result?.found === true && Boolean(safeSong(result.song))
  return {
    id, createdAt, status: error ? 'error' : found ? 'found' : 'not_found', input,
    song: found ? safeSong(result.song) : null,
    errorCode: error ? (['PROVIDER_ERROR', 'TIMEOUT', 'NETWORK_ERROR', 'INVALID_RESPONSE'].includes(error.code) ? error.code : 'UNKNOWN') : null,
    result: error ? null : { found, song: found ? safeSong(result.song) : null,
      recommendations: found && Array.isArray(result.recommendations) ? result.recommendations.slice(0, 11).map(safeSong).filter(Boolean) : [],
      count: found && Array.isArray(result.recommendations) ? Math.min(result.recommendations.length, 11) : 0, input },
  }
}
const storageError = () => new ApiError('Local history unavailable', { code: 'LOCAL_HISTORY_UNAVAILABLE' })
export function readGuestHistory() {
  try {
    const raw = window.localStorage.getItem(GUEST_HISTORY_KEY)
    if (!raw) return []
    if (raw.length > 2000000) throw storageError()
    const values = JSON.parse(raw)
    if (!Array.isArray(values)) throw storageError()
    return [...new Map(values.filter(v => typeof v?.id === 'string' && /^[a-f\d-]{36}$/i.test(v.id) && Number.isFinite(Date.parse(v.createdAt)) &&
      Date.now() - Date.parse(v.createdAt) < RETENTION_MS && Date.parse(v.createdAt) <= Date.now()).map(v => [v.id,
      historySnapshot({ id: v.id, createdAt: v.createdAt, result: v.result, error: v.status === 'error' ? { code: v.errorCode, input: v.input } : null }),
    ])).values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)).slice(0, 50)
  } catch { throw storageError() }
}
function writeGuestHistory(entries) {
  try { window.localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(entries)); window.dispatchEvent(new Event('history:updated')) }
  catch { throw storageError() }
}
export function saveGuestSearch({ requestId, ...value }) {
  // Never copy an authenticated result into the shared device's guest history.
  if (getToken()) throw storageError()
  const entry = historySnapshot({ ...value, id: requestId })
  const entries = readGuestHistory().filter(e => e.id !== requestId)
  writeGuestHistory([entry, ...entries].slice(0, 50))
  return { status: 'local_saved', id: requestId, requestId }
}
export function replaceGuestHistorySong(id, song) {
  if (getToken()) throw storageError()
  const entries = readGuestHistory()
  const entry = entries.find(value => value.id === id)
  if (!entry?.result?.found || !safeSong(song)) throw storageError()
  entry.song = safeSong(song)
  entry.result.song = entry.song
  writeGuestHistory(entries)
}
export const historyApi = {
  async list(cursor, options = {}) { return (await request(`/search-history?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { ...options, auth: true })).data },
  async detail(id, options = {}) { return (await request(`/search-history/${encodeURIComponent(id)}`, { ...options, auth: true })).data },
  async remove(id) { return (await request(`/search-history/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true })).data },
}
export const guestHistoryApi = {
  async list(cursor) {
    const all = readGuestHistory(), start = Number(cursor || 0)
    return { entries: all.slice(start, start + 20), nextCursor: all.length > start + 20 ? String(start + 20) : null }
  },
  async detail(id) {
    const entry = readGuestHistory().find(e => e.id === id)
    if (!entry) throw new ApiError('Not found', { code: 'NOT_FOUND' })
    return { entry }
  },
  async remove(id) { writeGuestHistory(readGuestHistory().filter(e => e.id !== id)); return { deleted: true } },
}
