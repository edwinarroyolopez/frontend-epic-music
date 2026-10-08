import { usePreferences } from '../context/PreferencesContext.jsx'
import { SongCard } from './SongCard.jsx'
export function RecommendationList({ items, selected, onToggle }) {
  const { t } = usePreferences()
  return <section className="recommendations">
    <h2 className="section-title">{t('recommendations.title')} ({items.length})</h2>
    <ul className="recommendations__grid">{items.map((song, index) => <li key={index} className="recommendations__item">
      <SongCard song={song} isSelected={selected.includes(index + 1)} onSelect={() => onToggle(index + 1)} />
    </li>)}</ul>
  </section>
}
