import { useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { ArtistCombobox } from './ArtistCombobox.jsx'
import { InputResolution } from './InputResolution.jsx'

export function SearchBar({ onSearch, status, onCancel, input }) {
  const { t } = usePreferences()
  const [lyrics, setLyrics] = useState('')
  const [artist, setArtist] = useState('')
  const [genre, setGenre] = useState('')
  const loading = status === 'loading'
  return <form className="discovery-form card card--padded" onSubmit={event => {
    event.preventDefault()
    if (!loading) onSearch({ lyrics, ...(artist.trim() && { artist }), ...(genre.trim() && { genre }) })
  }}>
    <label htmlFor="lyrics">{t('discovery.lyrics')}</label>
    <textarea id="lyrics" rows={3} minLength={15} maxLength={12000} required value={lyrics}
      onChange={e => setLyrics(e.target.value)} aria-describedby="lyrics-hint" />
    <p id="lyrics-hint" className="text-muted text-sm">{t('discovery.hint')}</p>
    <details className="discovery-hints">
      <summary>{t('discovery.optionalHints')}<span>{[artist.trim(), genre.trim()].filter(Boolean).join(' · ') || t('discovery.hintsSummary')}</span></summary>
      <div className="discovery-fields">
        <ArtistCombobox value={artist} onChange={setArtist} />
        <label>{t('discovery.genre')}<input maxLength={200} value={genre} onChange={e => setGenre(e.target.value)} /></label>
      </div>
    </details>
    <InputResolution input={input} onChoose={(field, value) => {
      if (field === 'artist') setArtist(value)
      else setGenre(value)
    }} />
    <div className="row row--wrap">
      <button className="btn btn--primary" disabled={loading || lyrics.trim().length < 15}>{t(loading ? 'states.loadingRecommendations' : 'discovery.submit')}</button>
      {loading && <button type="button" className="btn btn--secondary" onClick={onCancel}>{t('common.cancel')}</button>}
    </div>
  </form>
}
