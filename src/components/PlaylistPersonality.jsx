import { useEffect, useRef, useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { useUser } from '../context/UserContext.jsx'
import { parseSongs, reviewSongs, parseSongFile, MAX_FILE_BYTES } from '../utils/playlist-input.js'
import { PlaylistLinkPreview } from './PlaylistLinkPreview.jsx'
import '../styles/playlist-personality.css'
import { playlistsApi } from '../services/playlists.js'
import { personalityApi, savePersonalitySongs } from '../services/playlist-personality.js'
import { PersonalityReport } from './PersonalityReport.jsx'
import { localPersonalityHistory } from '../services/personality-history.js'

export function PlaylistPersonality({ sourcePlaylistId = '' }) {
  const { t, language } = usePreferences()
  const { canUsePlaylists, user } = useUser()
  const [mode, setMode] = useState(sourcePlaylistId ? 'internal' : 'manual')
  const [text, setText] = useState('')
  const [drafts, setDrafts] = useState({ manual: [], internal: [] })
  const songs = drafts[mode] || []
  const setSongs = value => setDrafts(current => ({ ...current, [mode]: typeof value === 'function' ? value(current[mode] || []) : value }))
  const [fileError, setFileError] = useState('')
  const [consent, setConsent] = useState(false)
  const [playlists, setPlaylists] = useState([])
  const [internalId, setInternalId] = useState(sourcePlaylistId)
  const [title, setTitle] = useState('')
  const [saveTarget, setSaveTarget] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [entry, setEntry] = useState(null)
  const [lastInput, setLastInput] = useState(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const cooldownTimer = useRef(null)
  const active = useRef(null)
  const [localHistory] = useState(() => localPersonalityHistory(user?.provider === 'demo' ? 'demo' : 'guest'))
  useEffect(() => () => { active.current?.abort(); clearTimeout(cooldownTimer.current) }, [])
  const onAnalyze = async body => {
    if (active.current || cooldown) return
    const controller = new AbortController(); active.current = controller
    setBusy(true); setEntry(null); setMessage('')
    try {
      const input = { ...body, language, requestId: crypto.randomUUID() }
      setLastInput(input)
      let cached
      if (!canUsePlaylists) { try { cached = localHistory.find(input) } catch { /* Analysis still works when storage fails. */ } }
      const data = cached ? { entry: cached, saved: true } : await personalityApi.analyze(input, { signal: controller.signal })
      if (!controller.signal.aborted) {
        setEntry(data.entry)
        if (canUsePlaylists) setMessage(data.saved ? 'saved' : 'notSaved')
        else { try { localHistory.save(data.entry, input); setMessage('localSaved') } catch { setMessage('localFailed') } }
      }
    } catch (e) { if (!controller.signal.aborted) {
      setMessage(e.code === 'ANALYSIS_IN_PROGRESS' ? 'inProgress' : e.code === 'RATE_LIMITED' ? 'rateLimited' : 'error')
      if (e.retryAfter) { setCooldown(true); clearTimeout(cooldownTimer.current); cooldownTimer.current = setTimeout(() => setCooldown(false), e.retryAfter * 1000) }
    } }
    finally { if (active.current === controller) { active.current = null; setBusy(false) } }
  }
  useEffect(() => {
    if (!canUsePlaylists) return
    const controller = new AbortController()
    playlistsApi.list({ signal: controller.signal }).then(data => setPlaylists(data.playlists)).catch(e => { if (e.name !== 'AbortError') setMessage('error') })
    return () => controller.abort()
  }, [canUsePlaylists])
  const previewInternal = async () => {
    if (active.current) return
    const controller = new AbortController(); active.current = controller; setBusy(true)
    try { const data = await personalityApi.preview({ sourceMode: 'internal', sourcePlaylistId: internalId }, { signal: controller.signal }); if (!controller.signal.aborted) { setSongs(data.songs); setConsent(false); setMessage('') } }
    catch { if (!controller.signal.aborted) setMessage('error') }
    finally { if (active.current === controller) { active.current = null; setBusy(false) } }
  }
  const rows = reviewSongs(songs)
  const ready = rows.length >= 2 && rows.length <= 500 && rows.every(s => s.valid) && rows.filter(s => !s.duplicate).length >= 2
  return <section className="personality stack stack--3">
    <h2>{t('personality.subtitle')}</h2>
    <p className="text-muted">{t('personality.notice')}</p>
    <p className="notice">{t(canUsePlaylists ? 'personality.private' : 'personality.local')}</p>
    <a href="#/analisis">{t('personality.history')}</a>
    <fieldset disabled={busy || saving} className="personality-fields stack stack--3">
    <label>{t('personality.inputMode')}<select value={mode} onChange={e => { setMode(e.target.value); setConsent(false) }}>
      {['manual', 'link', 'internal'].map(value => <option key={value} value={value}>{t(`personality.${value}`)}</option>)}
    </select></label>
    <div hidden={mode !== 'link'}><PlaylistLinkPreview onIndependent={() => { setMode('manual'); setConsent(false) }} /></div>
    {mode === 'internal' && <><p>{t(canUsePlaylists ? 'personality.chooseInternal' : 'playlists.signIn')}</p>{canUsePlaylists && <>
      <label>{t('playlists.choose')}<select value={internalId} onChange={e => { setInternalId(e.target.value); setSongs([]); setConsent(false) }}><option value="">—</option>{playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <button className="btn btn--secondary" disabled={!internalId} onClick={previewInternal}>{t('personality.preview')}</button>
    </>}</>}
    {mode === 'manual' && <>
      <label>{t('playlistLinks.file')}<input type="file" accept=".csv,.txt,.json,text/csv,text/plain,application/json" onChange={async e => {
        const file = e.target.files?.[0]; if (!file) return
        setFileError(''); setConsent(false)
        try {
          if (file.size > MAX_FILE_BYTES) throw new Error('FILE_TOO_LARGE')
          const content = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer())
          const parsed = parseSongFile(content, file.name)
          setDrafts(current => ({ ...current, manual: parsed }))
        } catch (error) { setFileError(error.message.startsWith('FILE_') ? error.message : 'FILE_INVALID') }
        e.target.value = ''
      }} /></label>
      <p className="text-sm">{t('playlistLinks.fileHint')}</p>
      {fileError && <p role="alert">{t(`playlistLinks.${fileError}`)}</p>}
      <label>{t('personality.songs')}<textarea rows={5} maxLength={200000} value={text} placeholder={t('personality.format')} onChange={e => { setText(e.target.value); setSongs([]); setConsent(false) }} /></label>
      <p className="text-sm">{t('personality.format')}</p>
      <button className="btn btn--secondary" disabled={!text.trim()} onClick={() => setSongs(parseSongs(text))}>{t('personality.preview')}</button>
    </>}
    {mode !== 'link' && <>
      {!!rows.length && <><p role="status">{t('personality.count', { count: rows.length, duplicates: rows.filter(s => s.duplicate).length, invalid: rows.filter(s => !s.valid).length })}</p>
        <ol className="personality-editor">{rows.map((song, index) => <li key={index}>
          <span>{index + 1}. {song.duplicate && t('personality.duplicate')} {!song.valid && t('playlistLinks.rowError', { line: song.sourceLine || index + 1 })}</span>
          {['title', 'artist', 'genre', 'edition'].map(field => <label key={field}>{t(`personality.${field}`)} {index + 1}<input maxLength={200} value={song[field]} aria-invalid={!song.valid && ['title', 'artist'].includes(field)} onChange={e => { setConsent(false); setSongs(current => current.map((s, i) => i === index ? { ...s, parseError: false, [field]: e.target.value } : s)) }} /></label>)}
          {mode === 'manual' && <button className="btn btn--secondary" onClick={() => { setConsent(false); setSongs(current => current.filter((_, i) => i !== index)) }}>{t('playlistLinks.removeRow', { line: index + 1 })}</button>}
        </li>)}</ol>
        {!ready && <p role="alert">{t('personality.insufficient')}</p>}
        <label className="personality-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />{t('personality.consent')}</label>
        <label>{t('personality.reportTitle')}<input value={title} maxLength={100} onChange={e => setTitle(e.target.value)} /></label>
        <button className="btn btn--primary" disabled={!ready || !consent || busy || cooldown} onClick={() => onAnalyze({ sourceMode: mode, sourceProvenance: mode === 'internal' ? 'internal_selection' : 'user_independent', ...(mode === 'internal' && { sourcePlaylistId: internalId }), [mode === 'internal' ? 'reviewedSongs' : 'songs']: songs.map(({ title, artist, genre, edition }) => ({ title, artist, genre, edition })), title, consent, independentSource: consent })}>{t('personality.analyze')}</button>
        {canUsePlaylists ? <><label>{t('personality.saveTarget')}<select value={saveTarget} onChange={e => setSaveTarget(e.target.value)}><option value="">{t('playlists.create')}</option>{playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="btn btn--secondary" disabled={!ready || (!saveTarget && !title.trim()) || saving} onClick={async () => {
          setSaving(true); setMessage('')
          try { const data = await savePersonalitySongs({ id: saveTarget, name: title, songs }); setMessage(t('playlists.savedCounts', { added: data.addedCount, skipped: data.skippedCount })) }
          catch (error) { setMessage(error.partialSave?.addedCount ? 'partialSave' : 'error') }
          finally { setSaving(false) }
        }}>{t(saveTarget ? 'playlists.add' : 'personality.saveSongs')}</button></> : <a href="#/login">{t('playlists.signIn')}</a>}
      </>}
    </>}
    </fieldset>
    {busy && <div role="status"><p>{t('personality.processing')}</p><button className="btn btn--secondary" onClick={() => { active.current?.abort(); active.current = null; setBusy(false); setMessage('cancelled') }}>{t('common.cancel')}</button></div>}
    {message && <p role="status">{['error', 'partialSave', 'saved', 'notSaved', 'inProgress', 'cancelled', 'localSaved', 'localFailed', 'rateLimited'].includes(message) ? t(`personality.${message}`) : message}</p>}
    {entry && <><PersonalityReport entry={entry} />{['saved', 'localSaved'].includes(message) && <a href={`#/analisis/${entry.id}`}>{t('history.view')}</a>}
      {entry.status === 'partial' && lastInput && <button className="btn btn--secondary" disabled={busy || cooldown} onClick={() => onAnalyze({ ...lastInput, retryOf: entry.id })}>{t('personality.retryAI')}</button>}
    </>}
  </section>
}
