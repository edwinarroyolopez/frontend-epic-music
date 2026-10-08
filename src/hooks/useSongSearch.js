import { useCallback, useEffect, useRef, useState } from 'react'
import { searchSongs } from '../services/api.js'
import { toSongInput } from '../services/playlists.js'

/** Event-driven only. App owns this hook to preserve results/selection during login. */
export function useSongSearch() {
  const [state, setState] = useState({ status: 'idle', result: null, error: null, selected: [] })
  const active = useRef(null)
  useEffect(() => () => active.current?.abort(), [])
  const run = useCallback(async body => {
    if (active.current) return
    const controller = new AbortController()
    active.current = controller
    setState({ status: 'loading', result: null, error: null, selected: [] })
    try {
      const result = await searchSongs(body, { signal: controller.signal })
      if (active.current === controller) setState({ status: result.found ? 'ready' : 'empty', result, error: null, selected: [] })
    } catch (error) {
      if (active.current === controller && error.name !== 'AbortError') setState({ status: 'error', result: null, error, selected: [] })
    } finally { if (active.current === controller) active.current = null }
  }, [])
  const cancel = useCallback(() => {
    active.current?.abort()
    active.current = null
    setState({ status: 'idle', result: null, error: null, selected: [] })
  }, [])
  const toggle = index => setState(s => ({ ...s, selected: s.selected.includes(index) ? s.selected.filter(i => i !== index) : [...s.selected, index] }))
  const selectAll = () => setState(s => ({ ...s, selected: [...(s.selected.includes(0) ? [0] : []), ...s.result.recommendations.map((_, i) => i + 1)] }))
  const clear = () => setState(s => ({ ...s, selected: [] }))
  const songs = state.result?.found ? [toSongInput(state.result.song, 'identified'), ...state.result.recommendations.map(song => toSongInput(song, 'recommendation'))] : []
  return { ...state, songs, selection: songs.filter((_, i) => state.selected.includes(i)), run, cancel, toggle, selectAll, clear }
}
