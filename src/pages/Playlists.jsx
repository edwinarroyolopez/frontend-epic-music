import { useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { useUser } from '../context/UserContext.jsx'
import { useSnackbar } from '../context/SnackbarContext.jsx'
import { usePlaylists, usePlaylistAction } from '../hooks/usePlaylists.js'
import { playlistsApi } from '../services/playlists.js'
import { Modal } from '../components/Modal.jsx'
import { PlaylistForm } from '../components/PlaylistForm.jsx'
import { PlaylistFeedback } from '../components/PlaylistFeedback.jsx'
import { SongCard } from '../components/SongCard.jsx'
import { DataTable } from '../components/DataTable.jsx'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal.jsx'

export function Playlists({ path, onNavigate }) {
  const { t } = usePreferences()
  const { canUsePlaylists, sessionChecking, user } = useUser()
  if (sessionChecking) return <p role="status">{t('states.loading')}</p>
  if (!canUsePlaylists) return <section className="page"><h1>{t('playlists.title')}</h1><p>{t('playlists.signIn')}</p>
    <button className="btn btn--primary" onClick={() => onNavigate('/login')}>{t('nav.login')}</button></section>
  const id = path.split('/')[2] || null
  return <PlaylistView key={`${user.id}:${id ?? 'list'}`} id={id} onNavigate={onNavigate} />
}

function PlaylistView({ id, onNavigate }) {
  const { t, language } = usePreferences()
  const snackbar = useSnackbar()
  const query = usePlaylists(id)
  const action = usePlaylistAction()
  const [modal, setModal] = useState(null)
  const [previewId, setPreviewId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const playlist = query.data?.playlist
  const done = () => { setModal(null); query.reload(); snackbar.success(t('playlists.updated')) }
  const reorder = (index, delta) => {
    const ids = playlist.songs.map(song => song.id)
    ;[ids[index], ids[index + delta]] = [ids[index + delta], ids[index]]
    action.run(() => playlistsApi.order(id, ids), done)
  }
  return <div className="page playlist-page stack stack--4">
    <header className="page__header row row--wrap">
      <h1 className="page__title">{playlist?.name ?? t('playlists.title')}</h1>
      {id ? <button className="btn btn--secondary" onClick={() => onNavigate('/playlists')}>{t('common.back')}</button> :
        <button className="btn btn--primary" disabled={action.busy} onClick={() => setModal('create')}>{t('playlists.create')}</button>}
    </header>
    <PlaylistFeedback {...query} onRetry={query.reload} />
    <PlaylistFeedback error={action.error} onRetry={query.reload} />
    {!id && !query.error && <DataTable className="playlists-table" caption={t('playlists.title')} rows={query.data?.playlists || []} loading={query.loading}
      emptyMessage={t('playlists.empty')} rowLabel={item => item.name} searchText={item => `${item.name} ${item.description}`}
      onView={item => setPreviewId(item.id)} onDelete={item => setDeleteTarget({ kind: 'playlist', id: item.id, name: item.name })}
      columns={[
        { key: 'name', label: t('playlists.name'), sortValue: item => item.name, render: item => <><a href={`#/playlists/${item.id}`}>{item.name}</a><p className="text-muted text-sm">{item.description}</p></> },
        { key: 'count', label: t('table.songs'), sortValue: item => item.songCount, render: item => <span className="resource-badge">{item.songCount}</span> },
        { key: 'updated', label: t('table.updated'), sortValue: item => Date.parse(item.updatedAt), render: item => <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' })}</time> },
      ]} />}
    {playlist && <>
      <div className="playlist-summary">
        {playlist.description && <p>{playlist.description}</p>}
        <p className="text-muted text-sm">{t('playlists.songCount', { count: playlist.songCount })}</p>
      </div>
      <div className="row row--wrap resource-toolbar">
        <button className="btn btn--secondary" disabled={action.busy} onClick={() => setModal('edit')}>{t('playlists.edit')}</button>
        <button className="btn btn--danger" disabled={action.busy} onClick={() => setDeleteTarget({ kind: 'playlist', id, name: playlist.name })}>{t('playlists.delete')}</button>
        <button className="btn btn--primary" onClick={() => onNavigate('/')}>{t('playlists.discover')}</button>
      </div>
      <p className="text-muted">{t('discovery.notice')}</p>
      <PlaylistSongs playlist={playlist} actions={(song, index) => <div className="row row--wrap">
            <button className="btn btn--secondary" disabled={action.busy || index === 0} aria-label={t('playlists.upSong', { title: song.title })} onClick={() => reorder(index, -1)}>↑ {t('playlists.up')}</button>
            <button className="btn btn--secondary" disabled={action.busy || index === playlist.songs.length - 1} aria-label={t('playlists.downSong', { title: song.title })} onClick={() => reorder(index, 1)}>↓ {t('playlists.down')}</button>
            <button className="btn btn--secondary" disabled={action.busy} aria-label={t('playlists.removeSong', { title: song.title })} onClick={() => setDeleteTarget({ kind: 'song', id: song.id, name: song.title })}>{t('playlists.remove')}</button>
          </div>} />
    </>}
    <Modal open={modal !== null} title={t(`playlists.${modal === 'edit' ? 'edit' : 'create'}`)} onClose={() => { if (!action.busy) setModal(null) }} closeDisabled={action.busy}>
      {modal && <PlaylistForm key={modal} playlist={modal === 'edit' ? playlist : null} busy={action.busy} submitLabel={t(modal === 'edit' ? 'playlists.save' : 'playlists.create')}
        onSubmit={body => action.run(() => modal === 'edit' ? playlistsApi.edit(id, body) : playlistsApi.create(body), done)} />}
      <PlaylistFeedback error={action.error} />
    </Modal>
    {previewId && <PlaylistPreview id={previewId} onClose={() => setPreviewId(null)} onNavigate={onNavigate} />}
    {deleteTarget && <ConfirmDeleteModal key={`${deleteTarget.kind}:${deleteTarget.id}`} title={t(deleteTarget.kind === 'song' ? 'playlists.remove' : 'playlists.delete')}
      description={t(deleteTarget.kind === 'song' ? 'playlists.confirmRemoveSong' : 'playlists.confirmDelete', { name: deleteTarget.name })}
      onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget.kind === 'song' ? playlistsApi.removeSong(id, deleteTarget.id) : playlistsApi.remove(deleteTarget.id)}
      onDeleted={() => {
        const deletedPlaylist = deleteTarget.kind === 'playlist'
        setDeleteTarget(null)
        snackbar.success(t(deletedPlaylist ? 'playlists.deleted' : 'playlists.updated'))
        if (deletedPlaylist && id) onNavigate('/playlists')
        else query.reload()
      }} />}
  </div>
}

function PlaylistSongs({ playlist, actions }) {
  const { t } = usePreferences()
  return <>
    {!playlist.songs.length && <p>{t('playlists.noSongs')}</p>}
    <ol className="playlist-songs">{playlist.songs.map((song, index) => <li key={song.id}>
      <SongCard song={song} showLyrics={song.originType === 'identified'} lyricsOnClick={song.originType === 'recommendation'}
        context={`${String(index + 1).padStart(2, '0')} · ${t(song.originType === 'identified' ? 'discovery.origin' : 'recommendations.title')}`}>
        {actions?.(song, index)}
      </SongCard>
    </li>)}</ol>
  </>
}

function PlaylistPreview({ id, onClose, onNavigate }) {
  const { t } = usePreferences()
  const query = usePlaylists(id)
  const playlist = query.data?.playlist
  return <Modal open title={playlist?.name || t('table.preview')} size="wide" initialFocus="dialog" onClose={onClose}
    footer={<button className="btn btn--secondary" onClick={() => { onClose(); onNavigate(`/playlists/${id}`) }}>{t('table.openDetail')}</button>}>
    <PlaylistFeedback {...query} onRetry={query.reload} />
    {playlist && <div className="stack stack--3">
      <p>{playlist.description}</p><p>{t('playlists.songCount', { count: playlist.songCount })}</p>
      <p className="text-muted">{t('discovery.notice')}</p>
      <PlaylistSongs playlist={playlist} />
    </div>}
  </Modal>
}
