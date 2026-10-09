import { request } from './api.js'

const call = async (path = '', options = {}) => (await request(`/playlists${path}`, { ...options, auth: true })).data
export const playlistsApi = {
  list: options => call('', options),
  get: (id, options) => call(`/${id}`, options),
  create: body => call('', { method: 'POST', body }),
  edit: (id, body) => call(`/${id}`, { method: 'PATCH', body }),
  remove: id => call(`/${id}`, { method: 'DELETE' }),
  add: (id, songs) => call(`/${id}/songs`, { method: 'POST', body: { songs } }),
  removeSong: (id, songId) => call(`/${id}/songs/${songId}`, { method: 'DELETE' }),
  order: (id, songIds) => call(`/${id}/songs/order`, { method: 'PATCH', body: { songIds } }),
}
export function toSongInput(song, originType) {
  const value = { title: song.title, artist: song.artist, originType, catalogVerified: false }
  for (const key of ['genre', 'album', 'releaseYear', 'reason', 'songId', 'edition']) if (song[key] != null) value[key] = song[key]
  return value
}
