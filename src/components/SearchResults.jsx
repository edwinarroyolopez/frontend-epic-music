import { usePreferences } from '../context/PreferencesContext.jsx'
import { describeError } from '../services/api.js'
export function SearchResults({ status, error }) {
  const { t } = usePreferences()
  if (status === 'loading') return <p role="status">{t('states.loadingRecommendations')}</p>
  if (status === 'error') return <p className="notice" role="alert">{describeError(error, t).description}</p>
  if (status === 'empty') return <p role="status">{t('discovery.notFound')}</p>
  return null
}
