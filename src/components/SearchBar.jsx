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
    <div className="discovery-field">
      <label htmlFor="lyrics">{t('discovery.lyrics')}</label>
      <textarea id="lyrics" rows={3} minLength={15} maxLength={12000} required value={lyrics}
        onChange={e => setLyrics(e.target.value)} aria-describedby="lyrics-hint" />
      <p id="lyrics-hint" className="text-muted text-sm">{t('discovery.hint')}</p>
    </div>
    <div className="discovery-fields">
      <ArtistCombobox value={artist} onChange={setArtist} />
      <div className="discovery-field">
        <label htmlFor="genre">{t('discovery.genre')}</label>
        <input id="genre" maxLength={200} value={genre} onChange={e => setGenre(e.target.value)} />
      </div>
    </div>
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
