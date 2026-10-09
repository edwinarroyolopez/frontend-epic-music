import { useEffect, useState } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { personalityHistoryApi, localPersonalityHistory } from '../services/personality-history.js'
import { PersonalityReport } from '../components/PersonalityReport.jsx'
import { DataTable } from '../components/DataTable.jsx'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal.jsx'

export function PlaylistAnalysisHistory({ path, onNavigate }) {
  const { user, canUsePlaylists, sessionChecking } = useUser()
  const { t } = usePreferences()
  if (sessionChecking) return <p role="status">{t('states.loading')}</p>
  const id = path.split('/')[2]
  return <History key={`${canUsePlaylists ? user.id : user?.provider || 'guest'}:${id || ''}`} id={id} mode={canUsePlaylists ? 'account' : user?.provider === 'demo' ? 'demo' : 'guest'} onNavigate={onNavigate} />
}
function History({ id, mode, onNavigate }) {
  const { t, language } = usePreferences()
  const [entries, setEntries] = useState([]), [entry, setEntry] = useState(null), [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [revision, setRevision] = useState(0), [target, setTarget] = useState(null)
  const [api] = useState(() => mode === 'account' ? personalityHistoryApi : localPersonalityHistory(mode))
  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => id ? api.get(id, { signal: controller.signal }) : api.list(null, { signal: controller.signal })).then(data => {
      if (controller.signal.aborted) return
      if (id) setEntry(data.entry)
      else { setEntries(data.entries); setCursor(data.nextCursor) }
    }).catch(e => { if (!controller.signal.aborted) setError(e.code || 'error') }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [id, api, revision])
  return <section className="page stack stack--4">
    <h1 className="page__title">{t('personality.history')}</h1>
    <p className="notice">{t(mode === 'account' ? 'personality.private' : 'personality.local')}</p>
    <div className="row row--wrap"><button className="btn btn--secondary" disabled={loading} onClick={() => { setLoading(true); setError(''); setRevision(n => n + 1) }}>{t('history.refresh')}</button>{id ? <a className="btn btn--secondary" href="#/analisis">{t('common.back')}</a> : <button className="btn btn--secondary" disabled>{t('personality.tab')} · {t('personality.comingSoon')}</button>}</div>
    {loading && <p role="status">{t('states.loading')}</p>}
    {error && <p role="alert">{t(error === 'LOCAL_HISTORY_UNAVAILABLE' ? 'history.local_unavailable' : 'personality.error')}</p>}
    {!id && <DataTable caption={t('personality.history')} rows={entries} loading={loading} emptyMessage={t('personality.empty')} rowLabel={e => e.title} searchText={e => `${e.title} ${e.sourceMode} ${e.status}`} hasMore={Boolean(cursor)}
      onView={e => onNavigate(`/analisis/${e.id}`)} onDelete={setTarget} deleteDisabled={e => e.status === 'pending'} columns={[
        { key: 'title', label: t('personality.title'), render: e => <a href={`#/analisis/${e.id}`}>{e.title}</a>, sortValue: e => e.title },
        { key: 'date', label: t('table.date'), render: e => new Date(e.createdAt).toLocaleString(language), sortValue: e => Date.parse(e.createdAt) },
        { key: 'source', label: t('personality.inputMode'), render: e => t(`personality.${e.sourceMode}`) },
        { key: 'songs', label: t('table.songs'), render: e => e.totalSongCount, sortValue: e => e.totalSongCount },
        { key: 'status', label: t('table.status'), render: e => t(`personality.${e.status}`) },
      ]} />}
    {!id && cursor && <button className="btn btn--secondary" disabled={loading} onClick={async () => {
      setLoading(true)
      try { const data = await api.list(cursor); setEntries(items => [...items, ...data.entries]); setCursor(data.nextCursor) } catch { setError('error') } finally { setLoading(false) }
    }}>{t('history.more')}</button>}
    {entry && <><button className="btn btn--secondary" disabled={entry.status === 'pending'} onClick={() => setTarget(entry)}>{t('history.delete')}</button>
      {entry.report ? <PersonalityReport entry={entry} /> : <p role="status">{t(`personality.${entry.status}`)}</p>}
    </>}
    {target && <ConfirmDeleteModal title={t('history.delete')} description={t('history.confirmDelete', { name: target.title })} onClose={() => setTarget(null)} onConfirm={() => api.remove(target.id)} onDeleted={() => { setTarget(null); if (id) onNavigate('/analisis'); else setRevision(n => n + 1) }} />}
  </section>
}
