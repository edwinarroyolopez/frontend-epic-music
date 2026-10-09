import { useState } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { useSearchHistory } from '../hooks/useSearchHistory.js'
import { describeError } from '../services/api.js'
import { InputResolution } from '../components/InputResolution.jsx'
import { SongCard } from '../components/SongCard.jsx'
import { DataTable } from '../components/DataTable.jsx'
import { Modal } from '../components/Modal.jsx'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal.jsx'
import { guestHistoryApi, historyApi } from '../services/search-history.js'
import { toSongInput } from '../services/playlists.js'
import { SelectedSong } from '../components/SelectedSong.jsx'
import { SongSelectionToolbar } from '../components/SongSelectionToolbar.jsx'
import { SavePlaylistModal } from '../components/SavePlaylistModal.jsx'

export function SearchHistory({ path, onNavigate }) {
  const { canUsePlaylists: account, user, sessionChecking } = useUser()
  const { t } = usePreferences()
  if (sessionChecking) return <p role="status">{t('states.loading')}</p>
  const id = path.split('/')[2] || null
  return <HistoryView key={`${account ? user.id : 'guest'}:${id || 'list'}`} local={!account} id={id} onNavigate={onNavigate} />
}
function HistoryView({ local, id, onNavigate }) {
  const { t, language } = usePreferences()
  const query = useSearchHistory({ local, id })
  const [preview, setPreview] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const entry = query.entry
  const api = local ? guestHistoryApi : historyApi
  const label = value => value.song ? `${value.song.title} — ${value.song.artist}` : t(`history.${value.status}`)
  const date = value => new Date(value).toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' })
  return <section className="page stack stack--4 history-page">
    <header className="page__header"><h1 className="page__title">{t('history.title')}</h1>
      <div className="row row--wrap">
      <button className="btn btn--secondary" disabled={query.loading} onClick={query.reload}>{t('history.refresh')}</button>
      {id && <button className="btn btn--secondary" onClick={() => onNavigate('/historial')}>{t('common.back')}</button>}
      </div></header>
    <p className="notice">{t(local ? 'history.local' : 'history.synced')}</p>
    <details className="resource-privacy"><summary>{t('history.privacyTitle')}</summary><p className="text-muted text-sm">{t('history.privacy')}</p></details>
    <HistoryFeedback query={query} />
    {!id && !query.error && <DataTable className="history-table" caption={t('history.title')} rows={query.entries} loading={query.loading}
      emptyMessage={t('history.empty')} rowLabel={label} hasMore={Boolean(query.nextCursor)}
      searchText={value => `${label(value)} ${value.input?.original?.artist || ''} ${value.input?.original?.genre || ''} ${value.input?.resolved?.artist || ''} ${value.input?.resolved?.genre || ''}`}
      onView={setPreview} onDelete={setDeleteTarget} deleteDisabled={value => value.status === 'pending'} columns={[
        { key: 'song', label: t('table.song'), sortValue: label, render: value => <a href={`#/historial/${value.id}`}>{label(value)}</a> },
        { key: 'status', label: t('table.status'), sortValue: value => t(`history.${value.status}`), render: value => <span className="resource-badge">{t(`history.${value.status}`)}</span> },
        { key: 'date', label: t('table.date'), sortValue: value => Date.parse(value.createdAt), render: value => <time dateTime={value.createdAt}>{date(value.createdAt)}</time> },
        { key: 'hints', label: t('table.hints'), render: value => <span className="text-sm">{[value.input?.resolved?.artist, value.input?.resolved?.genre].filter(Boolean).join(' · ') || t('history.noHints')}</span> },
      ]} />}
    {!id && query.nextCursor && <button className="btn btn--secondary" disabled={query.loading} onClick={query.more}>{t('history.more')}</button>}
    {entry && <>
      <button className="btn btn--secondary" disabled={entry.status === 'pending'} onClick={() => setDeleteTarget(entry)}>{t('history.delete')}</button>
      <HistoryEntry key={entry.id} entry={entry} local={local} onNavigate={onNavigate} />
    </>}
    {preview && <HistoryPreview key={preview.id} id={preview.id} title={label(preview)} local={local} onClose={() => setPreview(null)} onNavigate={onNavigate} />}
    {deleteTarget && <ConfirmDeleteModal key={deleteTarget.id} title={t('history.delete')} description={t('history.confirmDelete', { name: label(deleteTarget) })}
      onClose={() => setDeleteTarget(null)} onConfirm={() => api.remove(deleteTarget.id)} onDeleted={() => {
        setDeleteTarget(null)
        if (id) onNavigate('/historial')
        else query.reload()
      }} />}
  </section>
}

function HistoryFeedback({ query }) {
  const { t } = usePreferences()
  if (query.loading) return <p role="status">{t('states.loading')}</p>
  if (!query.error) return null
  return <div role="alert"><p>{query.error.code === 'LOCAL_HISTORY_UNAVAILABLE' ? t('history.local_unavailable') : describeError(query.error, t).description}</p>
    <button className="btn btn--secondary" onClick={query.reload}>{t('states.retry')}</button></div>
}

function HistoryEntry({ entry, local, onNavigate }) {
  const { t, language } = usePreferences()
  const { canUsePlaylists } = useUser()
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(null)
  const [corrected, setCorrected] = useState(null)
  const origin = corrected || entry.result?.song
  const songs = entry.result?.found ? [toSongInput(origin, 'identified'), ...entry.result.recommendations.map(song => toSongInput(song, 'recommendation'))] : []
  const toggle = index => setSelected(values => values.includes(index) ? values.filter(value => value !== index) : [...values, index])
  const save = songs => canUsePlaylists ? setSaving(songs) : onNavigate('/login')
  return <div className="stack stack--3">
    <div className="card card--padded stack stack--2">
      <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' })}</time>
      <p>{t(`history.${entry.status}`)}</p>
      <p className="text-sm">{t('history.written')}: {[entry.input?.original?.artist, entry.input?.original?.genre].filter(Boolean).join(' · ') || t('history.noHints')}</p>
      <p className="text-sm">{t('history.resolved')}: {[entry.input?.resolved?.artist, entry.input?.resolved?.genre].filter(Boolean).join(' · ') || t('history.noHints')}</p>
    </div>
    <InputResolution input={entry.input} />
    {entry.errorCode && <p>{t(`history.${entry.errorCode === 'INTERRUPTED' ? 'interrupted' : ['TIMEOUT', 'NETWORK_ERROR'].includes(entry.errorCode) ? 'clientError' : 'providerError'}`)}</p>}
    {entry.result?.found && <>
      <p className="notice">{t(origin.catalogVerified ? 'reidentify.recommendationsNotice' : 'discovery.notice')}</p>
      <SongSelectionToolbar count={selected.length} onAll={() => setSelected(songs.map((_, index) => index))}
        onClear={() => setSelected([])} onSave={() => save(songs.filter((_, index) => selected.includes(index)))} />
      <SelectedSong song={origin} historyId={entry.id} local={local} onResolved={setCorrected}
        isSelected={selected.includes(0)} onSelect={() => toggle(0)} onAdd={() => save([songs[0]])} />
      <h2>{t('recommendations.title')} ({entry.result.recommendations.length})</h2>
      <ul className="recommendations__grid">{entry.result.recommendations.map((song, index) => <li key={index}><SongCard song={song} lyricsOnClick
        isSelected={selected.includes(index + 1)} onSelect={() => toggle(index + 1)} onAdd={() => save([songs[index + 1]])} /></li>)}</ul>
    </>}
    {saving && canUsePlaylists && <SavePlaylistModal songs={saving} onClose={() => setSaving(null)} />}
  </div>
}

function HistoryPreview({ id, title, local, onClose, onNavigate }) {
  const { t } = usePreferences()
  const query = useSearchHistory({ local, id })
  return <Modal open title={title} onClose={onClose} size="wide" initialFocus="dialog"
    footer={<button className="btn btn--secondary" onClick={() => { onClose(); onNavigate(`/historial/${id}`) }}>{t('table.openDetail')}</button>}>
    <HistoryFeedback query={query} />
    {query.entry && <HistoryEntry entry={query.entry} local={local} onNavigate={onNavigate} />}
  </Modal>
}
