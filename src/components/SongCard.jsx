import { Music2 } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext.jsx'

export function SongCard({ song, isSelected = false, onSelect, children }) {
  const { t } = usePreferences()
  return <article className={`song-card${isSelected ? ' is-selected' : ''}`}>
    <div className="song-card__body">
      <Music2 size={24} aria-hidden="true" />
      <h3 className="song-card__title">{song.title}</h3>
      <p className="song-card__artist">{song.artist}</p>
      {song.genre && <span className="chip chip--genre">{song.genre}</span>}
      {song.album && <p>{song.album}</p>}
      {song.releaseYear && <p>{song.releaseYear}</p>}
      {song.reason && <p className="song-reason">{song.reason}</p>}
      <p className="text-muted text-sm">{t('discovery.unverified')}</p>
      {onSelect && <label className="song-selection"><input type="checkbox" checked={isSelected} onChange={onSelect}
        aria-label={t('discovery.selectSong', { title: song.title, artist: song.artist })} />{t('discovery.select')}</label>}
      {children}
    </div>
  </article>
}
