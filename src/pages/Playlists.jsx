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
  const playlist = query.data?.playlist
  const done = () => { setModal(null); query.reload(); snackbar.success(t('playlists.updated')) }
  const reorder = (index, delta) => {
    const ids = playlist.songs.map(song => song.id)
    ;[ids[index], ids[index + delta]] = [ids[index + delta], ids[index]]
    action.run(() => playlistsApi.order(id, ids), done)
  }
  return <div className="page stack stack--4">
    <header className="page__header row row--wrap">
      <h1 className="page__title">{playlist?.name ?? t('playlists.title')}</h1>
      {id ? <button className="btn btn--secondary" onClick={() => onNavigate('/playlists')}>{t('common.back')}</button> :
        <button className="btn btn--primary" disabled={action.busy} onClick={() => setModal('create')}>{t('playlists.create')}</button>}
    </header>
    <PlaylistFeedback {...query} onRetry={query.reload} />
    <PlaylistFeedback error={action.error} onRetry={query.reload} />
    {!id && query.data && <>
      {!query.data.playlists.length && <p>{t('playlists.empty')}</p>}
      <ul className="playlist-list">{query.data.playlists.map(item => <li className="card card--padded" key={item.id}>
        <h2><a href={`#/playlists/${item.id}`}>{item.name}</a></h2>
        <p>{item.description}</p><p>{t('playlists.songCount', { count: item.songCount })}</p>
        <p className="text-muted text-sm">{t('playlists.updatedAt')} {new Date(item.updatedAt).toLocaleDateString(language)}</p>
      </li>)}</ul>
    </>}
    {playlist && <>
      <p>{playlist.description}</p>
      <p>{t('playlists.songCount', { count: playlist.songCount })}</p>
      <div className="row row--wrap">
        <button className="btn btn--secondary" disabled={action.busy} onClick={() => setModal('edit')}>{t('playlists.edit')}</button>
        <button className="btn btn--secondary" disabled={action.busy} onClick={() => setModal('delete')}>{t('playlists.delete')}</button>
        <button className="btn btn--primary" onClick={() => onNavigate('/')}>{t('playlists.discover')}</button>
      </div>
      <p className="text-muted">{t('discovery.notice')}</p>
      {!playlist.songs.length && <p>{t('playlists.noSongs')}</p>}
      <ol className="playlist-songs">{playlist.songs.map((song, index) => <li key={song.id}>
        <SongCard song={song}>
          <p className="text-sm">{t(song.originType === 'identified' ? 'discovery.origin' : 'recommendations.title')}</p>
          <div className="row row--wrap">
            <button className="btn btn--secondary" disabled={action.busy || index === 0} aria-label={t('playlists.upSong', { title: song.title })} onClick={() => reorder(index, -1)}>↑ {t('playlists.up')}</button>
            <button className="btn btn--secondary" disabled={action.busy || index === playlist.songs.length - 1} aria-label={t('playlists.downSong', { title: song.title })} onClick={() => reorder(index, 1)}>↓ {t('playlists.down')}</button>
            <button className="btn btn--secondary" disabled={action.busy} aria-label={t('playlists.removeSong', { title: song.title })} onClick={() => action.run(() => playlistsApi.removeSong(id, song.id), done)}>{t('playlists.remove')}</button>
          </div>
        </SongCard>
      </li>)}</ol>
    </>}
    <Modal open={modal !== null} title={t(`playlists.${modal === 'edit' ? 'edit' : modal === 'delete' ? 'delete' : 'create'}`)} onClose={() => { if (!action.busy) setModal(null) }}>
      {modal === 'delete' ? <>
        <p>{t('playlists.confirmDelete', { name: playlist?.name })}</p>
        <div className="row row--wrap"><button className="btn btn--secondary" disabled={action.busy} onClick={() => setModal(null)}>{t('common.cancel')}</button>
          <button className="btn btn--primary" disabled={action.busy} onClick={() => action.run(() => playlistsApi.remove(id), () => { snackbar.success(t('playlists.deleted')); onNavigate('/playlists') })}>{t('playlists.confirm')}</button></div>
      </> : modal && <PlaylistForm key={modal} playlist={modal === 'edit' ? playlist : null} busy={action.busy} submitLabel={t(modal === 'edit' ? 'playlists.save' : 'playlists.create')}
        onSubmit={body => action.run(() => modal === 'edit' ? playlistsApi.edit(id, body) : playlistsApi.create(body), done)} />}
      <PlaylistFeedback error={action.error} />
    </Modal>
  </div>
}
