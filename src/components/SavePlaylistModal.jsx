import { useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { useSnackbar } from '../context/SnackbarContext.jsx'
import { usePlaylists, usePlaylistAction } from '../hooks/usePlaylists.js'
import { playlistsApi } from '../services/playlists.js'
import { Modal } from './Modal.jsx'
import { PlaylistForm } from './PlaylistForm.jsx'
import { PlaylistFeedback } from './PlaylistFeedback.jsx'

export function SavePlaylistModal({ songs, onClose }) {
  const { t } = usePreferences()
  const snackbar = useSnackbar()
  const query = usePlaylists()
  const action = usePlaylistAction()
  const [mode, setMode] = useState('new')
  const [id, setId] = useState('')
  const saved = data => {
    snackbar.success(t('playlists.savedCounts', { added: data.addedCount, skipped: data.skippedCount }))
    onClose()
  }
  return <Modal open title={t('playlists.saveSelection')} description={t('discovery.count', { count: songs.length })} onClose={() => { if (!action.busy) onClose() }}>
    <div className="row row--wrap">
      <button className="btn btn--secondary" aria-pressed={mode === 'new'} disabled={action.busy} onClick={() => setMode('new')}>{t('playlists.create')}</button>
      <button className="btn btn--secondary" aria-pressed={mode === 'existing'} disabled={action.busy} onClick={() => setMode('existing')}>{t('playlists.existing')}</button>
    </div>
    {mode === 'new' ? <PlaylistForm busy={action.busy} submitLabel={t('playlists.createWithSelection')} onSubmit={body => action.run(() => playlistsApi.create({ ...body, songs }), saved)} /> : <>
      <PlaylistFeedback {...query} onRetry={query.reload} />
      {query.data && (query.data.playlists.length ? <form className="discovery-form" onSubmit={e => { e.preventDefault(); if (id) action.run(() => playlistsApi.add(id, songs), saved) }}>
        <label>{t('playlists.choose')}<select value={id} required onChange={e => setId(e.target.value)}>
          <option value="">{t('playlists.choose')}</option>
          {query.data.playlists.map(playlist => <option key={playlist.id} value={playlist.id}>{playlist.name} ({playlist.songCount})</option>)}
        </select></label>
        <button className="btn btn--primary" disabled={action.busy || !id}>{t('playlists.add')}</button>
      </form> : <p>{t('playlists.empty')}</p>)}
    </>}
    <PlaylistFeedback error={action.error} />
  </Modal>
}
