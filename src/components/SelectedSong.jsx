import { usePreferences } from '../context/PreferencesContext.jsx'
import { SongCard } from './SongCard.jsx'
export function SelectedSong(props) {
  const { t } = usePreferences()
  if (!props.song) return null
  return <section className="stack stack--3"><h2 className="section-title">{t('discovery.origin')}</h2><SongCard {...props} /></section>
}
