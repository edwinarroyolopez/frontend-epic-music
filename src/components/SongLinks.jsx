import { ExternalLink } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { songLinks } from '../utils/song-links.js'

export function SongLinks({ song }) {
  const { t } = usePreferences()
  const links = songLinks(song)
  return <nav className="song-links" aria-label={t('musicLinks.label', { title: song.title })}>
    {Object.entries({ youtube: 'YouTube', spotify: 'Spotify', appleMusic: 'Apple Music' }).map(([key, platform]) =>
      <a key={key} href={links[key]} target="_blank" rel="noopener noreferrer" aria-label={t('musicLinks.search', { platform, title: song.title, artist: song.artist })}>
        <ExternalLink size={14} aria-hidden="true" />{platform}
      </a>)}
    <small>{t('musicLinks.hint')}</small>
  </nav>
}
