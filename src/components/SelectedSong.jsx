import { usePreferences } from '../context/PreferencesContext.jsx'
import { SongCard } from './SongCard.jsx'
import { ReidentifySong } from './ReidentifySong.jsx'
export function SelectedSong({ input, historyId, local, onResolved, ...props }) {
  const { t } = usePreferences()
  if (!props.song) return null
  return <section className="stack stack--3"><h2 className="section-title">{t('discovery.origin')}</h2><SongCard {...props} showLyrics
    identityAction={onResolved && <ReidentifySong song={props.song} input={input} historyId={historyId} local={local} onResolved={onResolved} />} /></section>
}
