import { Music2 } from 'lucide-react'
import { useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { SongLinks } from './SongLinks.jsx'
import { LyricsPanel } from './LyricsPanel.jsx'
import { SongLyricsModal } from './SongLyricsModal.jsx'

export function SongCard({ song, isSelected = false, onSelect, showLyrics = false, lyricsOnClick = false, context, children }) {
  const { t } = usePreferences()
  const [lyricsOpen, setLyricsOpen] = useState(false)
  return <><article className={`song-card${showLyrics ? ' song-card--source' : ''}${isSelected ? ' is-selected' : ''}${lyricsOnClick ? ' song-card--clickable' : ''}`}>
    <div className="song-card__body">
      {context && <p className="song-card__context">{context}</p>}
      <div className="song-card__heading">
      <Music2 className="song-card__mark" size={22} aria-hidden="true" />
      <div className="song-card__identity"><h3 className="song-card__title">{lyricsOnClick ? <button type="button" className="song-card__open" aria-haspopup="dialog"
        aria-label={t('lyrics.openSong', { title: song.title, artist: song.artist })} onClick={() => setLyricsOpen(true)}>
        {song.title}<span className="song-card__lyrics-hint">{t('lyrics.show')}</span>
      </button> : song.title}</h3>
      <p className="song-card__artist">{song.artist}</p></div>
      {onSelect && <label className="song-selection"><input type="checkbox" checked={isSelected} onChange={onSelect}
        aria-label={t('discovery.selectSong', { title: song.title, artist: song.artist })} /><span>{t('discovery.select')}</span></label>}
      </div>
      {song.reason ? <details className="song-card__details"><summary>{t('discovery.details')}</summary>
        <p className="text-muted text-sm">{[song.genre, song.album, song.releaseYear].filter(Boolean).join(' · ')}</p>
        <p className="song-reason">{song.reason}</p>
      </details> : <p className="song-card__metadata text-muted text-sm">{[song.genre, song.album, song.releaseYear].filter(Boolean).join(' · ')}</p>}
      <SongLinks song={song} />
      {showLyrics && <LyricsPanel song={song} />}
      {children}
    </div>
  </article>{lyricsOnClick && lyricsOpen && <SongLyricsModal song={song} onClose={() => setLyricsOpen(false)} />}</>
}
