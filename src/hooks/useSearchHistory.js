import { useCallback, useEffect, useState } from 'react'
import { guestHistoryApi, historyApi, GUEST_HISTORY_KEY } from '../services/search-history.js'

export function useSearchHistory({ local, id }) {
  const api = local ? guestHistoryApi : historyApi
  const [query, setQuery] = useState({ cursor: null, revision: 0 })
  const [state, setState] = useState({ revision: -1, error: null, entries: [], entry: null, nextCursor: null })
  useEffect(() => {
    const controller = new AbortController()
    const promise = id ? api.detail(id, { signal: controller.signal }) : api.list(query.cursor, { signal: controller.signal })
    promise.then(data => {
      if (!controller.signal.aborted) setState(s => ({ ...s, ...data, entries: query.cursor ? [...s.entries, ...data.entries] : data.entries || [], revision: query.revision, error: null }))
    }).catch(error => {
      if (!controller.signal.aborted) setState(s => ({ ...s, revision: query.revision, error }))
    })
    return () => controller.abort()
  }, [api, id, query])
  const reload = useCallback(() => setQuery(q => ({ cursor: null, revision: q.revision + 1 })), [])
  useEffect(() => {
    const refresh = event => { if (!local && event.detail?.saved && (!id || id === event.detail.historyId)) reload() }
    window.addEventListener('song:reidentified', refresh)
    return () => window.removeEventListener('song:reidentified', refresh)
  }, [id, local, reload])
  useEffect(() => {
    if (!local) return
    const refresh = event => { if (!event.key || event.key === GUEST_HISTORY_KEY) reload() }
    window.addEventListener('history:updated', refresh); window.addEventListener('storage', refresh)
    return () => { window.removeEventListener('history:updated', refresh); window.removeEventListener('storage', refresh) }
  }, [local, reload])
  const loading = state.revision !== query.revision
  return { ...state, loading, error: loading ? null : state.error, reload, more: () => {
    if (!loading) setQuery(q => ({ cursor: state.nextCursor, revision: q.revision + 1 }))
  }, remove: () => api.remove(id) }
}
