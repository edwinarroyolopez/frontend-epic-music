import { useEffect, useId, useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { getLyrics } from '../services/lyrics.js'
import { EmotionMetrics } from './EmotionMetrics.jsx'

export function LyricsPanel({ song }) {
  const { t } = usePreferences()
  const [open, setOpen] = useState(false)
  const id = useId()
  return <section className="lyrics-panel">
    <button type="button" className="btn btn--secondary" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>{t(open ? 'lyrics.hide' : 'lyrics.show')}</button>
    {open && <div id={id}><LyricsContent key={`${song.title}:${song.artist}`} song={song} /></div>}
  </section>
}
export function LyricsContent({ song }) {
  const { t } = usePreferences()
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState(null)
  const { title, artist } = song
  useEffect(() => {
    const controller = new AbortController()
    getLyrics({ title, artist }, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setState({ revision, data })
    }).catch(error => { if (!controller.signal.aborted) setState(previous => ({ ...previous, revision, error })) })
    return () => controller.abort()
  }, [title, artist, revision])
  const loading = state?.revision !== revision
  const retry = () => setRevision(value => value + 1)
  if (loading && !state?.data) return <p role="status">{t('lyrics.loading')}</p>
  const errorMessage = state?.error && !loading ? <div role="alert"><p>{t('lyrics.error')}</p><button className="btn btn--secondary" onClick={retry}>{t('states.retry')}</button></div> : null
  if (!state?.data) return errorMessage
  return <div className="stack stack--2">
    {loading && <p role="status">{t('lyrics.loading')}</p>}
    {errorMessage}
    {state.data.status === 'available' && <EmotionMetrics emotions={state.data.emotions} analysis={state.data.emotionAnalysis} onRetry={retry} loading={loading} />}
    <h4>{t('lyrics.title')}</h4>
    {state.data.status === 'available' ? <p className="lyrics-text">{state.data.lyrics}</p> : <p role="status">{t(`lyrics.${state.data.status}`)}</p>}
    <p className="text-muted text-sm">{t('lyrics.source')} <a href="https://lrclib.net" target="_blank" rel="noopener noreferrer">LRCLIB</a>. {t('lyrics.privacy')}</p>
  </div>
}
