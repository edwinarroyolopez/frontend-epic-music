import { useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'

export function SearchBar({ onSearch, status, onCancel }) {
  const { t } = usePreferences()
  const [lyrics, setLyrics] = useState('')
  const [artist, setArtist] = useState('')
  const [genre, setGenre] = useState('')
  const loading = status === 'loading'
  return <form className="discovery-form card card--padded" onSubmit={event => {
    event.preventDefault()
    if (!loading) onSearch({ lyrics, ...(artist.trim() && { artist: artist.trim() }), ...(genre.trim() && { genre: genre.trim() }) })
  }}>
    <label htmlFor="lyrics">{t('discovery.lyrics')}</label>
    <textarea id="lyrics" rows={5} minLength={15} maxLength={12000} required value={lyrics}
      onChange={e => setLyrics(e.target.value)} aria-describedby="lyrics-hint" />
    <p id="lyrics-hint" className="text-muted text-sm">{t('discovery.hint')}</p>
    <div className="discovery-fields">
      <label>{t('discovery.artist')}<input maxLength={200} value={artist} onChange={e => setArtist(e.target.value)} /></label>
      <label>{t('discovery.genre')}<input maxLength={200} value={genre} onChange={e => setGenre(e.target.value)} /></label>
    </div>
    <div className="row row--wrap">
      <button className="btn btn--primary" disabled={loading || lyrics.trim().length < 15}>{t(loading ? 'states.loadingRecommendations' : 'discovery.submit')}</button>
      {loading && <button type="button" className="btn btn--secondary" onClick={onCancel}>{t('common.cancel')}</button>}
    </div>
  </form>
}
