import { useEffect, useId, useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { loadSongLyrics, peekLyrics, lyricsIdentity } from '../services/lyrics.js'
import { EmotionMetrics } from './EmotionMetrics.jsx'

export function LyricsPanel({ song }) {
  const { t } = usePreferences()
  const [open, setOpen] = useState(false)
  const id = useId()
  return <section className="lyrics-panel">
    <button type="button" className="btn btn--secondary" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>{t(open ? 'lyrics.hide' : 'lyrics.show')}</button>
    {open && <div id={id}><LyricsContent key={lyricsIdentity(song)} song={song} /></div>}
  </section>
}
export function LyricsContent({ song }) {
  const { t } = usePreferences()
  const [retryState, setRetryState] = useState({ revision: 0, analysisOnly: false, refetchLyrics: false })
  const { revision, analysisOnly, refetchLyrics } = retryState
  const [clock, setClock] = useState(Date.now)
  const identity = lyricsIdentity(song)
  const [state, setState] = useState(() => ({ identity, revision: 0, data: peekLyrics(song) }))
  const { title, artist, songId, edition } = song
  useEffect(() => {
    const controller = new AbortController()
    loadSongLyrics({ title, artist, songId, edition }, { signal: controller.signal, analysisOnly, refetchLyrics }).then(data => {
      if (!controller.signal.aborted) { setClock(Date.now()); setState({ identity, revision, data }) }
    }).catch(error => { if (!controller.signal.aborted && error.name !== 'AbortError') setState(previous => ({ ...(previous?.identity === identity ? previous : {}), identity, revision, error })) })
    return () => controller.abort()
  }, [title, artist, songId, edition, identity, revision, analysisOnly, refetchLyrics])
  const current = state?.identity === identity ? state : null
  const loading = !current || current.revision !== revision || (!current.data && !current.error)
  const retryAt = current?.data?.status === 'available' ? current.data.emotionAnalysis?.retryAt : current?.data?.lyricsRefetchAt
  const retryAtMs = Date.parse(retryAt) || 0
  const retrySeconds = Math.max(0, Math.ceil((retryAtMs - clock) / 1000))
  useEffect(() => {
    if (retryAtMs <= Date.now()) return
    const timer = setInterval(() => {
      setClock(Date.now())
      if (Date.now() >= retryAtMs) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [retryAtMs])
  const retry = () => {
    if (loading || retrySeconds > 0) return
    const analysisOnly = current?.data?.status === 'available'
    setRetryState(value => ({ revision: value.revision + 1, analysisOnly, refetchLyrics: !analysisOnly && current?.data?.status !== 'in_progress' }))
  }
  if (loading && !current?.data) return <p role="status">{t('lyrics.loading')}</p>
  const errorMessage = state?.error && !loading ? <div role="alert"><p>{t('lyrics.error')}</p><button className="btn btn--secondary" disabled={retrySeconds > 0} onClick={retry}>{t('states.retry')}</button></div> : null
  if (!state?.data) return errorMessage
  return <div className="lyrics-content">
    {loading && <p role="status">{t('lyrics.loading')}</p>}
    {errorMessage}
    <section className="lyrics-content__text stack stack--2">
    <h3>{t('lyrics.title')}</h3>
    {state.data.status === 'available' ? <p className="lyrics-text">{state.data.lyrics}</p> : <p role="status">{t(`lyrics.${state.data.status}`)}</p>}
    {['not_found', 'rights_restricted', 'temporary_error', 'never_attempted', 'in_progress'].includes(state.data.status) && <button className="btn btn--secondary" disabled={loading || retrySeconds > 0} onClick={retry}>{t(state.data.status === 'in_progress' ? 'states.retry' : 'lyricsActions.refetch')}</button>}
    {retrySeconds > 0 && <p role="status">{t('lyricsActions.retryWait', { seconds: retrySeconds })}</p>}
    {state.data.status === 'rights_restricted' && <p className="text-muted text-sm">{t('lyricsActions.restrictedHint')}</p>}
    <p className="text-muted text-sm">{state.data.source?.name && <>{t('lyrics.source')} {state.data.source.name === 'LRCLIB' ? <a href="https://lrclib.net" target="_blank" rel="noopener noreferrer">LRCLIB</a> : state.data.source.name}. </>}{t(state.data.lyricsStorage === 'transient' ? 'lyricsDelivery.transient' : 'lyrics.privacy')}</p>
    </section>
    {state.data.status === 'available' && <EmotionMetrics emotions={state.data.emotions} analysis={state.data.emotionAnalysis} onRetry={retry} loading={loading || retrySeconds > 0} />}
  </div>
}
