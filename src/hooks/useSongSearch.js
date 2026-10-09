import { useCallback, useEffect, useRef, useState } from 'react'
import { searchSongs } from '../services/api.js'
import { toSongInput } from '../services/playlists.js'
import { getToken } from '../services/auth.js'
import { saveGuestSearch } from '../services/search-history.js'
import { useUser } from '../context/UserContext.jsx'

const idle = { status: 'idle', result: null, error: null, selected: [], history: null }

/** Event-driven only. App owns this hook to preserve results/selection during login. */
export function useSongSearch() {
  const { user } = useUser()
  const scope = getToken() ? user?.id || 'restoring' : 'guest'
  const previousScope = useRef(scope)
  const [state, setState] = useState({ ...idle, scope })
  const active = useRef(null)
  useEffect(() => () => active.current?.abort(), [])
  useEffect(() => {
    if (previousScope.current === scope) return
    active.current?.abort(); active.current = null
    // Preserve guest selection across sign-in; private account results are
    // hidden immediately and cleared when leaving/switching that account.
    const wasGuest = previousScope.current === 'guest'
    setState(s => wasGuest && s.status !== 'loading' ? { ...s, scope, history: null } : { ...idle, scope })
    previousScope.current = scope
  }, [scope])
  const run = useCallback(async body => {
    if (active.current) return
    const controller = new AbortController()
    active.current = controller
    const token = getToken(), requestId = crypto.randomUUID()
    setState({ ...idle, status: 'loading', scope })
    const persistGuest = (result, error) => {
      if (token) return result?.history || error?.history || { status: 'unknown' }
      try { return saveGuestSearch({ requestId, body, result, error }) }
      catch { return { status: 'local_unavailable' } }
    }
    try {
      const result = await searchSongs({ ...body, searchId: requestId }, { signal: controller.signal })
      if (active.current === controller && getToken() === token) setState({ status: result.found ? 'ready' : 'empty', result, error: null, selected: [], history: persistGuest(result), scope })
    } catch (error) {
      if (active.current === controller && getToken() === token && error.name !== 'AbortError') {
        const acceptedError = ['PROVIDER_ERROR', 'TIMEOUT', 'NETWORK_ERROR', 'INVALID_RESPONSE'].includes(error.code)
        setState({ status: 'error', result: null, error, selected: [], history: acceptedError ? persistGuest(null, error) : error.history, scope })
      }
    } finally { if (active.current === controller) active.current = null }
  }, [scope])
  const cancel = useCallback(() => {
    active.current?.abort()
    active.current = null
    setState({ ...idle, status: 'cancelled', scope })
  }, [scope])
  const toggle = index => setState(s => ({ ...s, selected: s.selected.includes(index) ? s.selected.filter(i => i !== index) : [...s.selected, index] }))
  const selectAll = () => setState(s => ({ ...s, selected: [...(s.selected.includes(0) ? [0] : []), ...s.result.recommendations.map((_, i) => i + 1)] }))
  const clear = () => setState(s => ({ ...s, selected: [] }))
  const visible = state.scope !== 'guest' && state.scope !== scope ? idle : state
  const songs = visible.result?.found ? [toSongInput(visible.result.song, 'identified'), ...visible.result.recommendations.map(song => toSongInput(song, 'recommendation'))] : []
  return { ...visible, formScope: scope, songs, selection: songs.filter((_, i) => visible.selected.includes(i)), run, cancel, toggle, selectAll, clear }
}
