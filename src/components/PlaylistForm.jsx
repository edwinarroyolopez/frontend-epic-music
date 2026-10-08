import { useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'

export function PlaylistForm({ playlist, busy, onSubmit, submitLabel }) {
  const { t } = usePreferences()
  const [name, setName] = useState(playlist?.name ?? '')
  const [description, setDescription] = useState(playlist?.description ?? '')
  return <form className="discovery-form" onSubmit={e => { e.preventDefault(); if (!busy && name.trim()) onSubmit({ name: name.trim(), description }) }}>
    <label>{t('playlists.name')}<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
    <label>{t('playlists.description')}<textarea rows={3} maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} /></label>
    <button className="btn btn--primary" disabled={busy || !name.trim()}>{busy ? t('states.loading') : submitLabel}</button>
  </form>
}
