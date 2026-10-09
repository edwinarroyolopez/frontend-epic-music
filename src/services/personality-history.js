import { request } from './api.js'

export const personalityHistoryApi = {
  list: (cursor, options = {}) => request(`/playlist-personality/history${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, { auth: true, ...options }).then(r => r.data),
  get: (id, options = {}) => request(`/playlist-personality/history/${encodeURIComponent(id)}`, { auth: true, ...options }).then(r => r.data),
  remove: id => request(`/playlist-personality/history/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }).then(r => r.data),
}
const fields = (value, keys) => Object.fromEntries(keys.filter(k => value[k] !== undefined).map(k => [k, value[k]]))
const snapshot = entry => ({ ...fields(entry, ['id', 'title', 'sourceMode', 'sourcePlaylistId', 'status', 'createdAt', 'expiresAt', 'totalSongCount']),
  songs: entry.songs.map(s => fields(s, ['title', 'artist', 'edition', 'genre', 'index', 'duplicate', 'provenance', 'catalogVerified', 'songId'])),
  report: fields(entry.report, ['analysisVersion', 'sourceMode', 'createdAt', 'language', 'analyzedSongCount', 'totalSongCount', 'status', 'coverage', 'sourceLimitations', 'archetype', 'musicalIdentity', 'emotionalUniverse', 'tendencies', 'contradictions', 'narrative', 'representativeSongs', 'findings', 'caveats', 'ai']),
})
export function localInputKey(body) {
  return JSON.stringify({ version: '1.0.0', language: body.language, title: body.title || '', sourceMode: body.sourceMode, retryOf: body.retryOf || null,
    songs: body.songs.map(s => fields(s, ['title', 'artist', 'edition', 'genre'])) })
}
export function localPersonalityHistory(mode = 'guest', storage = globalThis.localStorage) {
  const key = `me:playlist-analysis:${mode === 'demo' ? 'demo' : 'guest'}:v1`
  const unavailable = () => { const error = new Error('LOCAL_HISTORY_UNAVAILABLE'); error.code = error.message; throw error }
  const write = entries => {
    try { const encoded = JSON.stringify(entries); if (encoded.length > 1000000) return unavailable(); storage.setItem(key, encoded) } catch { unavailable() }
  }
  const read = () => {
    try {
      const raw = storage.getItem(key), all = raw ? JSON.parse(raw) : []
      if (!Array.isArray(all)) return unavailable()
      const entries = all.filter(e => e.entry?.report?.analysisVersion === '1.0.0' && Array.isArray(e.entry?.songs) && Date.parse(e.entry.expiresAt) > Date.now()).slice(0, 50)
      if (entries.length !== all.length) write(entries)
      return entries
    } catch { return unavailable() }
  }
  return {
    list: () => ({ entries: read().map(e => e.entry), nextCursor: null }),
    get: id => { const entry = read().find(e => e.entry.id === id)?.entry; if (!entry) throw new Error('NOT_FOUND'); return { entry } },
    find: body => read().find(e => e.inputKey === localInputKey(body))?.entry,
    save: (entry, body) => { const safe = snapshot(entry); const inputKey = localInputKey(body); write([{ inputKey, entry: safe }, ...read().filter(e => e.entry.id !== safe.id && e.inputKey !== inputKey)].slice(0, 50)); return safe },
    remove: id => { write(read().filter(e => e.entry.id !== id)); return { deleted: true } },
  }
}
