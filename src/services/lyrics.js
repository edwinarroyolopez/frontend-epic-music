import { request, ApiError } from './api.js'
import { API_CONFIG } from './config.js'
import { getToken } from './auth.js'

const EMOTIONS = ['joy', 'sadness', 'anger', 'fear', 'love', 'hope', 'nostalgia', 'calm']

export async function getLyrics({ title, artist, songId, edition }, { analysisOnly = false, refetchLyrics = false, ...options } = {}) {
  const query = { ...(title && { title }), ...(artist && { artist }), ...(songId && { songId }), ...(edition && { edition }), ...(analysisOnly && { analysisOnly: 'true' }), ...(refetchLyrics && { refetchLyrics: 'true' }) }
  const { data } = await request(`/songs/lyrics?${new URLSearchParams(query)}`, { timeout: API_CONFIG.lyricsTimeout, ...options, auth: false })
  return validateLyrics(data, { title, artist, songId, edition })
}
function validateLyrics(data, input) {
  if (!data || !['available', 'not_found', 'instrumental', 'rights_restricted', 'temporary_error', 'in_progress', 'never_attempted'].includes(data.status) ||
    (input.songId && data.songId && input.songId !== data.songId) ||
    (input.title && data.title && normalize(input.title) !== normalize(data.title)) ||
    (input.artist && data.artist && normalize(input.artist) !== normalize(data.artist)) ||
    (input.edition && normalize(input.edition) !== normalize(data.edition)) ||
    (data.status === 'available' && (typeof data.lyrics !== 'string' || !data.lyrics.trim() || data.lyrics.length > 60000))) {
    throw new ApiError('Invalid lyrics response', { code: 'INVALID_RESPONSE' })
  }
  const metrics = data.emotions
  const validMetrics = data.status === 'available' && data.emotionAnalysis?.status === 'estimated' &&
    Array.isArray(metrics) && metrics.length === 3 && new Set(metrics.map(value => value?.code)).size === 3 &&
    metrics.every(value => EMOTIONS.includes(value?.code) && Number.isInteger(value.score) && value.score >= 1 && value.score <= 100) &&
    metrics.reduce((sum, value) => sum + value.score, 0) === 100
  const fallbackStatus = data.status !== 'available' ? 'not_applicable' : ['insufficient_evidence', 'in_progress', 'not_started'].includes(data.emotionAnalysis?.status) ? data.emotionAnalysis.status : 'unavailable'
  return { ...data,
    emotions: validMetrics ? metrics.map(({ code, score }) => ({ code, score })).sort((a, b) => b.score - a.score || a.code.localeCompare(b.code)) : [],
    emotionAnalysis: { ...data.emotionAnalysis, status: validMetrics ? 'estimated' : fallbackStatus },
  }
}

const normalize = value => (value || '').normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()
const metadataKey = song => JSON.stringify([song.title, song.artist, song.edition].map(normalize))
export const lyricsIdentity = song => song.songId || metadataKey(song)
const cache = new Map(), inFlight = new Map()
const MAX_ENTRIES = 100
let generation = 0
export function clearLyricsMemory() { cache.clear(); inFlight.clear(); generation++ }
function forgetLyrics(song) {
  const known = cache.get(lyricsIdentity(song))
  for (const [key, value] of cache) {
    if (key === lyricsIdentity(song) || value === known || (song.songId && value.songId === song.songId) ||
      (song.title && song.artist && metadataKey(value) === metadataKey(song))) cache.delete(key)
  }
}
const terminal = data => ['available', 'not_found', 'instrumental', 'rights_restricted'].includes(data.status) && !['in_progress', 'not_started'].includes(data.emotionAnalysis?.status)
function remember(song, data) {
  if (!terminal(data)) return
  for (const key of new Set([lyricsIdentity(song), ...(song.title && song.artist ? [metadataKey(song)] : []), ...(data.songId ? [data.songId] : [])])) {
    cache.delete(key); cache.set(key, data)
  }
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value)
}
export function peekLyrics(song) {
  if (song.status === 'available' && typeof song.lyrics === 'string') {
    const data = validateLyrics(song, song)
    if (terminal(data)) { remember(song, data); return data }
  }
  const cached = cache.get(lyricsIdentity(song)) || (!song.songId ? cache.get(metadataKey(song)) : undefined)
  return cached ? validateLyrics(cached, song) : undefined
}
function watch(promise, signal, session) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Cancelled', 'AbortError'))
    if (signal?.aborted) return abort()
    signal?.addEventListener('abort', abort, { once: true })
    promise.then(value => {
      if (signal?.aborted || getToken() !== session) abort()
      else resolve(value)
    }, reject).finally(() => signal?.removeEventListener('abort', abort))
  })
}
// Global work outlives an individual viewer (including StrictMode remounts).
// Memory only: no localStorage, browser history, or private user content.
export function loadSongLyrics(song, { signal, analysisOnly = false, refetchLyrics = false } = {}) {
  const session = getToken(), ready = peekLyrics(song)
  if (ready && !analysisOnly && !refetchLyrics) return watch(Promise.resolve(ready), signal, session)
  const key = lyricsIdentity(song)
  if (!inFlight.has(key)) {
    if (refetchLyrics) forgetLyrics(song)
    const started = generation
    const promise = (async () => {
      let data
      for (let attempt = 0; attempt < 6; attempt++) {
        data = await getLyrics(song, { analysisOnly, refetchLyrics: refetchLyrics && attempt === 0 })
        if (data.status !== 'in_progress' && data.emotionAnalysis?.status !== 'in_progress' &&
          !(data.status === 'available' && data.emotionAnalysis?.status === 'not_started')) break
        if (attempt < 5) await new Promise(resolve => setTimeout(resolve, Math.max(1, Math.min(5, data.retryAfter || 1)) * 1000))
      }
      if (generation === started) remember(song, data)
      return data
    })()
    inFlight.set(key, promise)
    promise.finally(() => { if (inFlight.get(key) === promise) inFlight.delete(key) }).catch(() => {})
  }
  return watch(inFlight.get(key), signal, session)
}
