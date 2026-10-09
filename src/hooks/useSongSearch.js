import { useCallback, useEffect, useRef, useState } from 'react'
import { searchSongs } from '../services/api.js'
import { toSongInput } from '../services/playlists.js'
import { getToken } from '../services/auth.js'
import { useUser } from '../context/UserContext.jsx'
import { rememberFragment } from '../services/reidentification.js'

const idle = { status: 'idle', result: null, error: null, selected: [], history: null }

/** Event-driven only. App preserves results between authenticated pages. */
export function useSongSearch() {
  const { user, isAuthenticated } = useUser()
  const scope = isAuthenticated ? user.id : 'signed-out'
  const previousScope = useRef(scope)
  const [state, setState] = useState({ ...idle, scope })
  const active = useRef(null)
  useEffect(() => () => active.current?.abort(), [])
  useEffect(() => {
    const update = event => setState(s => s.result?.found && s.history?.id === event.detail?.historyId
      ? { ...s, result: { ...s.result, song: event.detail.song } } : s)
    window.addEventListener('song:reidentified', update)
    return () => window.removeEventListener('song:reidentified', update)
  }, [])
  useEffect(() => {
    if (previousScope.current === scope) return
    active.current?.abort(); active.current = null
    setState({ ...idle, scope })
    previousScope.current = scope
  }, [scope])
  const run = useCallback(async body => {
    if (!isAuthenticated || !getToken() || active.current) return
    const controller = new AbortController()
    active.current = controller
    const token = getToken(), requestId = crypto.randomUUID()
    setState({ ...idle, status: 'loading', scope })
    try {
      const result = await searchSongs({ ...body, searchId: requestId }, { signal: controller.signal })
      if (active.current === controller && getToken() === token) {
        const history = result.history || { status: 'unknown' }
        rememberFragment(history?.id, body)
        setState({ status: result.found ? 'ready' : 'empty', result, error: null, selected: [], history, scope, sourceInput: body, searchId: requestId })
      }
    } catch (error) {
      if (active.current === controller && getToken() === token && error.name !== 'AbortError') {
        setState({ status: 'error', result: null, error, selected: [], history: error.history, scope })
      }
    } finally { if (active.current === controller) active.current = null }
  }, [scope, isAuthenticated])
  const cancel = useCallback(() => {
    active.current?.abort()
    active.current = null
    setState({ ...idle, status: 'cancelled', scope })
  }, [scope])
  const toggle = index => setState(s => ({ ...s, selected: s.selected.includes(index) ? s.selected.filter(i => i !== index) : [...s.selected, index] }))
  const selectAll = () => setState(s => ({ ...s, selected: [...(s.selected.includes(0) ? [0] : []), ...s.result.recommendations.map((_, i) => i + 1)] }))
  const clear = () => setState(s => ({ ...s, selected: [] }))
  const replaceSource = song => setState(s => s.result?.found ? { ...s, result: { ...s.result, song } } : s)
  const visible = !isAuthenticated || state.scope !== scope ? idle : state
  const songs = visible.result?.found ? [toSongInput(visible.result.song, 'identified'), ...visible.result.recommendations.map(song => toSongInput(song, 'recommendation'))] : []
  return { ...visible, formScope: scope, songs, selection: songs.filter((_, i) => visible.selected.includes(i)), run, cancel, toggle, selectAll, clear, replaceSource }
}
