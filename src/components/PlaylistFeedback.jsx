import { usePreferences } from '../context/PreferencesContext.jsx'
import { describeError } from '../services/api.js'
export function PlaylistFeedback({ loading, error, onRetry }) {
  const { t } = usePreferences()
  if (loading) return <p role="status">{t('states.loading')}</p>
  if (!error) return null
  return <div role="alert"><p>{describeError(error, t).description}</p>
    {onRetry && <button className="btn btn--secondary" onClick={onRetry}>{t('states.retry')}</button>}
  </div>
}
