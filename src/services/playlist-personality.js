import { request } from './api.js'
import { playlistsApi, toSongInput } from './playlists.js'

export const personalityApi = {
  providers: (options = {}) => request('/playlist-personality/providers', options).then(r => r.data),
  analyze: (body, options = {}) => request('/playlist-personality/analyze', { method: 'POST', body, auth: 'optional', timeout: 30000, ...options }).then(r => r.data),
  preview: (body, options = {}) => request('/playlist-personality/preview', { method: 'POST', body, auth: 'optional', ...options }).then(r => r.data),
}

// Existing playlist API limits batches to 100. Partial writes are explicit on failure.
export async function savePersonalitySongs({ id, name, songs }) {
  let addedCount = 0, skippedCount = 0
  const inputs = songs.map(song => toSongInput(song, 'identified'))
  try {
    if (!id) {
      const data = await playlistsApi.create({ name, songs: inputs.splice(0, 100) })
      id = data.playlist.id; addedCount += data.addedCount; skippedCount += data.skippedCount
    }
    for (let i = 0; i < inputs.length; i += 100) {
      const data = await playlistsApi.add(id, inputs.slice(i, i + 100))
      addedCount += data.addedCount; skippedCount += data.skippedCount
    }
    return { id, addedCount, skippedCount }
  } catch (error) { error.partialSave = { id, addedCount, skippedCount }; throw error }
}
