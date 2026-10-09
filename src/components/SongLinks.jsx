import { AppleMusicIcon, SpotifyIcon, YouTubeIcon } from './BrandIcons.jsx'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { songLinks } from '../utils/song-links.js'

const platforms = [
  { key: 'youtube', name: 'YouTube', Icon: YouTubeIcon },
  { key: 'spotify', name: 'Spotify', Icon: SpotifyIcon },
  { key: 'appleMusic', name: 'Apple Music', Icon: AppleMusicIcon },
]

export function SongLinks({ song }) {
  const { t } = usePreferences()
  const links = songLinks(song)
  return <nav className="song-links" aria-label={t('musicLinks.label', { title: song.title })}>
    {platforms.map(({ key, name: platform, Icon }) =>
      <a key={key} href={links[key]} target="_blank" rel="noopener noreferrer" aria-label={t('musicLinks.search', { platform, title: song.title, artist: song.artist })}>
        <Icon />{platform}
      </a>)}
  </nav>
}
