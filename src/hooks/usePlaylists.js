import { useCallback, useEffect, useRef, useState } from 'react'
import { playlistsApi } from '../services/playlists.js'

export function usePlaylists(id = null) {
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState(null)
  const key = `${id ?? 'list'}:${revision}`
  useEffect(() => {
    const controller = new AbortController()
    const promise = id ? playlistsApi.get(id, { signal: controller.signal }) : playlistsApi.list({ signal: controller.signal })
    promise.then(data => { if (!controller.signal.aborted) setState({ key, data }) })
      .catch(error => { if (!controller.signal.aborted && error.name !== 'AbortError') setState({ key, error }) })
    return () => controller.abort()
  }, [id, key])
  const reload = useCallback(() => setRevision(value => value + 1), [])
  return { data: state?.key === key ? state.data : null, error: state?.key === key ? state.error : null, loading: state?.key !== key, reload }
}

export function usePlaylistAction() {
  const lock = useRef(false)
  const alive = useRef(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const run = async (operation, success) => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError(null)
    try {
      const result = await operation()
      if (alive.current) success(result)
    } catch (failure) { if (alive.current && failure.name !== 'AbortError') setError(failure) }
    finally { lock.current = false; if (alive.current) setBusy(false) }
  }
  return { busy, error, run }
}
