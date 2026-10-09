import { usePreferences } from '../context/PreferencesContext.jsx'
import { useState } from 'react'

export function PersonalityReport({ entry }) {
  const { t } = usePreferences()
  const [copyStatus, setCopyStatus] = useState('')
  const r = entry.report
  const refs = values => values.map(ref => {
    const song = entry.songs[ref.index]
    return song ? `${ref.index + 1}. ${song.title} — ${song.artist}` : ''
  }).filter(Boolean).join('; ')
  return <article className="personality-report card card--padded stack stack--3" aria-label={t('personality.report')}>
    <h2>{entry.title}</h2>
    <p className="notice">{t(r.ai.status === 'completed' ? 'personality.aiCompleted' : 'personality.aiUnavailable')}</p>
    <p>{t('personality.coverage', { total: r.totalSongCount, sample: r.coverage.aiSample, genres: r.coverage.genre, emotions: r.coverage.emotions })}</p>
    <section><h3>{t('personality.identity')}</h3><h4>{r.archetype.name}</h4><p>{r.archetype.description}</p>
      <p className="text-sm">{refs(r.archetype.evidence)}</p>
      {r.tendencies.map(item => <div key={item.name}><p>{item.interpretation}</p><p className="text-sm">{refs(item.evidence)}</p></div>)}
    </section>
    <section><h3>{t('personality.emotional')}</h3>{r.emotionalUniverse.descriptions.map((p, i) => <p key={i}>{p}</p>)}
      {!!r.emotionalUniverse.emotions?.length && <p>{r.emotionalUniverse.emotions.map(code => t(`emotions.${code}`)).join(' · ')}</p>}
      <p className="text-sm">{refs(r.emotionalUniverse.evidence)}</p>
    </section>
    <section><h3>{t('personality.narrative')}</h3><h4>{r.narrative.headline}</h4>{r.narrative.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</section>
    <section><h3>{t('personality.representative')}</h3><ul>{r.representativeSongs.map(s => <li key={s.index}><strong>{refs([s])}</strong><p>{s.why}</p></li>)}</ul></section>
    <section><h3>{t('personality.findings')}</h3>{r.findings.observed.map((p, i) => <p key={i}>{p}</p>)}{r.findings.unknown.map((p, i) => <p key={i}>{p}</p>)}{r.caveats.map((p, i) => <p key={i} className="text-sm">{p}</p>)}</section>
    <details><summary>{t('personality.considered')}</summary><ol>{entry.songs.map((s, i) => <li key={i}>{s.title} — {s.artist}{s.edition && ` (${s.edition})`}{s.genre && ` · ${s.genre}`}</li>)}</ol></details>
    <button className="btn btn--secondary" onClick={async () => {
      try { await navigator.clipboard.writeText([entry.title, r.archetype.name, ...r.narrative.paragraphs, ...r.caveats, ...entry.songs.map(s => `${s.title} — ${s.artist}`)].join('\n\n')); setCopyStatus('copied') }
      catch { setCopyStatus('copyFailed') }
    }}>{t('personality.copy')}</button>
    {copyStatus && <p role="status">{t(`personality.${copyStatus}`)}</p>}
  </article>
}
