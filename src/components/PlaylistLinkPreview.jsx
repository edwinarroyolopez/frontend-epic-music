import { useEffect, useRef, useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { personalityApi } from '../services/playlist-personality.js'

export function PlaylistLinkPreview({ onIndependent }) {
  const { t } = usePreferences()
  const [url, setUrl] = useState(''), [result, setResult] = useState(null)
  const [invalid, setInvalid] = useState(false), [busy, setBusy] = useState(false), [cooldown, setCooldown] = useState(false)
  const active = useRef(null), timer = useRef(null), input = useRef(null)
  useEffect(() => () => { active.current?.abort(); clearTimeout(timer.current) }, [])
  const preview = async (more = false) => {
    if (active.current || cooldown) return
    const controller = new AbortController(); active.current = controller; setBusy(true); setInvalid(false)
    try {
      const data = await personalityApi.preview({ sourceMode: 'link', url, ...(more && { nextPageToken: result.nextPageToken }) }, { signal: controller.signal })
      if (controller.signal.aborted) return
      setResult(previous => more && previous?.preview ? { ...data, preview: { ...previous.preview, items: [...previous.preview.items, ...(data.preview?.items || [])] }, ...(data.status !== 'preview_ready' && { nextPageToken: previous.nextPageToken }) } : data)
      if (data.retryAfter) { setCooldown(true); timer.current = setTimeout(() => setCooldown(false), data.retryAfter * 1000) }
    } catch (error) {
      if (!controller.signal.aborted) {
        if (error.code === 'VALIDATION_ERROR') setInvalid(true)
        else setResult(previous => ({ ...previous, status: 'provider_error', messageCode: 'YOUTUBE_PROVIDER_ERROR' }))
        if (error.retryAfter) { setCooldown(true); timer.current = setTimeout(() => setCooldown(false), error.retryAfter * 1000) }
      }
    } finally { if (active.current === controller) { active.current = null; setBusy(false) } }
  }
  return <div className="stack stack--3">
    <label>{t('personality.link')}<input ref={input} type="url" placeholder="https://…" maxLength={500} value={url} onChange={e => { active.current?.abort(); active.current = null; setBusy(false); setUrl(e.target.value); setResult(null); setInvalid(false) }} /></label>
    <details><summary>{t('playlistLinks.privacyTitle')}</summary><p>{t('playlistLinks.privacy')}</p>
      <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube Terms of Service</a>{' · '}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>
    </details>
    <button className="btn btn--secondary" disabled={!url || busy || cooldown} onClick={() => preview()}>{t('personality.checkLink')}</button>
    {busy && <p role="status">{t('playlistLinks.loading')} <button className="btn btn--secondary" onClick={() => { active.current?.abort(); active.current = null; setBusy(false) }}>{t('common.cancel')}</button></p>}
    {invalid && <p role="alert">{t('personality.invalidLink')}</p>}
    {result && <section className="stack stack--2" aria-label={t('playlistLinks.result')}>
      <p role="status">{result.provider === 'spotify' ? 'Spotify' : 'YouTube'} · {t(`playlistLinks.${result.messageCode}`)}</p>
      {result.canonicalUrl && <a href={result.canonicalUrl} target="_blank" rel="noopener noreferrer">{t(result.resourceType === 'youtube_radio' ? 'playlistLinks.openRadio' : 'playlistLinks.openProvider')}</a>}
      {result.resourceType === 'youtube_radio' && <button className="btn btn--secondary" onClick={() => { input.current?.focus(); input.current?.select() }}>{t('playlistLinks.fixedPlaylist')}</button>}
      {result.preview && <>
        <h3>{result.preview.title}</h3>
        <p>{t('playlistLinks.attribution')} · {t('playlistLinks.count', { count: result.preview.items.length, total: result.totalItems ?? '—' })}</p>
        <ol className="personality-provider-items">{result.preview.items.map((item, index) => <li key={index}>
          {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a> : <span>{item.title} — {t('playlistLinks.unavailable')}</span>}
          {item.channelTitle && <span> · {item.channelTitle}</span>}
        </li>)}</ol>
        {result.nextPageToken && <button className="btn btn--secondary" disabled={busy || cooldown} onClick={() => preview(true)}>{t('playlistLinks.loadMore')}</button>}
        {result.truncated && <p>{t('playlistLinks.limit')}</p>}
      </>}
      {result.analysis_access && <p>{t(result.provider === 'spotify' ? 'playlistLinks.spotifyAnalysis' : 'playlistLinks.youtubeAnalysis')}</p>}
    </section>}
    {cooldown && <p role="status">{t('personality.rateLimited')}</p>}
    <p>{t('playlistLinks.independentHint')}</p>
    <button className="btn btn--secondary" onClick={onIndependent}>{t('personality.manual')}</button>
  </div>
}
