import { request, ApiError } from './api.js'
import { API_CONFIG } from './config.js'
import { getToken } from './auth.js'
import { replaceGuestHistorySong } from './search-history.js'

// In-memory only: old searches ask for the fragment again after a reload.
const fragments = new Map()
let fragmentScope
function currentFragments() {
  const scope = getToken()
  if (fragmentScope !== scope) { fragments.clear(); fragmentScope = scope }
  return fragments
}
export function rememberFragment(id, input) {
  if (!id || typeof input?.lyrics !== 'string') return
  const values = currentFragments()
  values.delete(id)
  values.set(id, { lyrics: input.lyrics, artist: input.artist || '' })
  if (values.size > 20) values.delete(values.keys().next().value)
}
export const recallFragment = id => currentFragments().get(id)

export async function reidentifySource({ song, lyrics, artist, historyId, local }, options = {}) {
  const { data } = await request('/reidentify-song', {
    ...options, method: 'POST', auth: 'optional', timeout: API_CONFIG.aiTimeout,
    body: { lyrics, artist, previous: { title: song.title, artist: song.artist }, ...(!local && historyId && { historyId }) },
  })
  if (typeof data?.found !== 'boolean' || (data.found && (!data.song?.title || !data.song?.artist || data.verification !== 'lyrics_match'))) {
    throw new ApiError('Invalid identification', { code: 'INVALID_RESPONSE' })
  }
  if (data.found && local && historyId) {
    try { replaceGuestHistorySong(historyId, data.song); data.history = { status: 'local_saved', id: historyId } }
    catch { data.history = { status: 'local_unavailable', id: historyId } }
  }
  rememberFragment(historyId, { lyrics, artist })
  if (data.found && historyId) window.dispatchEvent(new CustomEvent('song:reidentified', {
    detail: { historyId, song: data.song, saved: ['saved', 'local_saved'].includes(data.history?.status) },
  }))
  return data
}
