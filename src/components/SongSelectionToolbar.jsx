import { usePreferences } from '../context/PreferencesContext.jsx'
import { useUser } from '../context/UserContext.jsx'

export function SongSelectionToolbar({ count, onAll, onClear, onSave, disabled = false }) {
  const { t } = usePreferences()
  const { canUsePlaylists } = useUser()
  return <div className="selection-toolbar card card--padded">
    <p role="status">{t('discovery.count', { count })}</p>
    <div className="row row--wrap">
      <button className="btn btn--secondary" disabled={disabled} onClick={onAll}>{t('historySongs.all')}</button>
      <button className="btn btn--secondary" disabled={!count} onClick={onClear}>{t('discovery.clearShort')}</button>
      <button className="btn btn--primary" disabled={!count || disabled} onClick={onSave}>{t(canUsePlaylists ? 'playlists.saveSelection' : 'discovery.signInSave')}</button>
    </div>
  </div>
}
