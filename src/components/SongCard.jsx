import { Music2 } from 'lucide-react'
import { useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { SongLinks } from './SongLinks.jsx'
import { LyricsPanel } from './LyricsPanel.jsx'
import { SongLyricsModal } from './SongLyricsModal.jsx'

export function SongCard({ song, isSelected = false, onSelect, showLyrics = false, lyricsOnClick = false, children }) {
  const { t } = usePreferences()
  const [lyricsOpen, setLyricsOpen] = useState(false)
  return <><article className={`song-card${isSelected ? ' is-selected' : ''}${lyricsOnClick ? ' song-card--clickable' : ''}`}>
    <div className="song-card__body">
      <Music2 size={24} aria-hidden="true" />
      <h3 className="song-card__title">{lyricsOnClick ? <button type="button" className="song-card__open" aria-haspopup="dialog"
        aria-label={t('lyrics.openSong', { title: song.title, artist: song.artist })} onClick={() => setLyricsOpen(true)}>
        {song.title}<span className="song-card__lyrics-hint">{t('lyrics.show')}</span>
      </button> : song.title}</h3>
      <p className="song-card__artist">{song.artist}</p>
      {song.genre && <span className="chip chip--genre">{song.genre}</span>}
      {song.album && <p>{song.album}</p>}
      {song.releaseYear && <p>{song.releaseYear}</p>}
      {song.reason && <p className="song-reason">{song.reason}</p>}
      <p className="text-muted text-sm">{t('discovery.unverified')}</p>
      <SongLinks song={song} />
      {showLyrics && <LyricsPanel song={song} />}
      {onSelect && <label className="song-selection"><input type="checkbox" checked={isSelected} onChange={onSelect}
        aria-label={t('discovery.selectSong', { title: song.title, artist: song.artist })} />{t('discovery.select')}</label>}
      {children}
    </div>
  </article>{lyricsOnClick && lyricsOpen && <SongLyricsModal song={song} onClose={() => setLyricsOpen(false)} />}</>
}
