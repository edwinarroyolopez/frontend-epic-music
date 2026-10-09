import { usePreferences } from '../context/PreferencesContext.jsx'

export function InputResolution({ input, onChoose }) {
  const { t } = usePreferences()
  if (!input) return null
  return <section className="input-resolution stack stack--2" aria-label={t('intelligence.title')}>
    {input.corrections?.length > 0 && <>
      <h2 className="text-sm">{t('intelligence.title')}</h2>
      {input.needsConfirmation && <p>{t('intelligence.uncertain')}</p>}
      <ul>{input.corrections.map((correction, index) => <li key={index}>
        <span>{t(`intelligence.${correction.field}`)}: {correction.original} → {correction.suggested}. </span>
        <span>{t(correction.applied ? 'intelligence.applied' : 'intelligence.proposed')} </span>
        <small>{t(`intelligence.${correction.source?.startsWith('genre') ? 'dictionary' : 'directory'}`)}</small>
        {!correction.applied && onChoose && <button type="button" className="btn btn--secondary" onClick={() => onChoose(correction.field, correction.suggested)}>{t('intelligence.choose', { name: correction.suggested })}</button>}
      </li>)}</ul>
      <p className="text-muted text-sm">{t('intelligence.confidence')}</p>
    </>}
    {input.directoryStatus === 'unavailable' && <p className="text-muted text-sm">{t('intelligence.unavailable')}</p>}
  </section>
}
