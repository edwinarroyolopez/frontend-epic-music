import { useState } from 'react'
import { Headphones } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { useUser } from '../context/UserContext.jsx'
import { RecommendationList } from '../components/RecommendationList.jsx'
import { SearchBar } from '../components/SearchBar.jsx'
import { SearchResults } from '../components/SearchResults.jsx'
import { SelectedSong } from '../components/SelectedSong.jsx'
import { SavePlaylistModal } from '../components/SavePlaylistModal.jsx'

export function Home({ search, onNavigate }) {
  const { t } = usePreferences()
  const { canUsePlaylists } = useUser()
  const [saving, setSaving] = useState(false)
  return <div className="page home stack stack--5">
    <section className="hero">
      <p className="hero__eyebrow"><Headphones size={15} aria-hidden="true" />{t('app.name')}</p>
      <h1 className="hero__title">{t('app.tagline')}</h1>
      <SearchBar onSearch={search.run} status={search.status} onCancel={search.cancel} />
    </section>
    <SearchResults status={search.status} error={search.error} />
    {search.result?.found && <>
      <p className="notice">{t('discovery.notice')}</p>
      {search.result.recommendations.length !== 11 && <p role="status">{t('discovery.partial')}</p>}
      <div className="selection-toolbar card card--padded">
        <p role="status">{t('discovery.count', { count: search.selection.length })}</p>
        <div className="row row--wrap">
          <button className="btn btn--secondary" onClick={search.selectAll}>{t('discovery.all')}</button>
          <button className="btn btn--secondary" onClick={search.clear}>{t('discovery.clear')}</button>
          <button className="btn btn--primary" disabled={!search.selection.length} onClick={() => canUsePlaylists ? setSaving(true) : onNavigate('/login')}>
            {t(canUsePlaylists ? 'playlists.saveSelection' : 'playlists.signIn')}
          </button>
        </div>
      </div>
      <SelectedSong song={search.result.song} isSelected={search.selected.includes(0)} onSelect={() => search.toggle(0)} />
      <RecommendationList items={search.result.recommendations} selected={search.selected} onToggle={search.toggle} />
    </>}
    {saving && canUsePlaylists && <SavePlaylistModal songs={search.selection} onClose={() => setSaving(false)} />}
  </div>
}
