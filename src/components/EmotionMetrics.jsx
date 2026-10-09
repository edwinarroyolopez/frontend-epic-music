import { usePreferences } from '../context/PreferencesContext.jsx'

export function EmotionMetrics({ emotions, analysis, onRetry, loading }) {
  const { t } = usePreferences()
  return <section className="emotion-metrics stack stack--2" aria-label={t('emotions.title')}>
    <h4>{t('emotions.title')}</h4>
    {analysis?.status === 'estimated' ? <>
      <ul className="emotion-metrics__list">{emotions.map(({ code, score }) => <li key={code}>
        <div className="emotion-metrics__label"><span>{t(`emotions.${code}`)}</span><strong>{score}%</strong></div>
        <div className="emotion-metrics__meter" role="meter" aria-label={t(`emotions.${code}`)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
          <span aria-hidden="true" style={{ width: `${score}%` }} />
        </div>
      </li>)}</ul>
      <p className="text-muted text-sm">{t('emotions.estimated')}</p>
      {analysis.sampled && <p className="text-muted text-sm">{t('emotions.sampled')}</p>}
    </> : <>
      <p role="status">{t(analysis?.status === 'insufficient_evidence' ? 'emotions.insufficient' : 'emotions.unavailable')}</p>
      {analysis?.status !== 'insufficient_evidence' && <button type="button" className="btn btn--secondary" disabled={loading} onClick={onRetry}>{t('emotions.retry')}</button>}
    </>}
  </section>
}
