import { useEffect, useId, useRef, useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { describeError } from '../services/api.js'
import { recallFragment, reidentifySource } from '../services/reidentification.js'
import { Modal } from './Modal.jsx'

export function ReidentifySong({ song, input, historyId, local, onResolved }) {
  const { t } = usePreferences()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [lyrics, setLyrics] = useState(() => input?.lyrics || recallFragment(historyId)?.lyrics || '')
  const [state, setState] = useState({ status: 'idle' })
  const active = useRef(null)
  useEffect(() => () => active.current?.abort(), [])
  const cancel = () => { active.current?.abort(); active.current = null; setState({ status: 'idle' }); setOpen(false) }
  const run = async event => {
    event.preventDefault()
    if (active.current) return
    const controller = new AbortController()
    active.current = controller
    setState({ status: 'loading' })
    try {
      const data = await reidentifySource({ song, lyrics, artist: input?.artist || recallFragment(historyId)?.artist || song.artist, historyId, local }, { signal: controller.signal })
      if (controller.signal.aborted) return
      if (data.found) {
        onResolved(data.song)
        setOpen(false)
        setState({ status: 'success', unsaved: historyId && !['saved', 'local_saved'].includes(data.history?.status) })
      } else setState({ status: data.reason === 'ambiguous' ? 'ambiguous' : 'unconfirmed' })
    } catch (error) {
      if (!controller.signal.aborted) setState({ status: 'error', error })
    } finally { if (active.current === controller) active.current = null }
  }
  return <div className="stack stack--2">
    <button type="button" className="btn btn--secondary song-card__reidentify" onClick={() => { setState({ status: 'idle' }); setOpen(true) }}>{t('reidentify.action')}</button>
    {state.status === 'success' && <p className="text-sm" role="status">{t(state.unsaved ? 'reidentify.unsaved' : 'reidentify.success')}</p>}
    {open && <Modal open title={t('reidentify.action')} description={t('reidentify.description')} onClose={cancel}>
      <form className="discovery-form" onSubmit={run}>
        <div className="discovery-field">
          <label htmlFor={id}>{t('discovery.lyrics')}</label>
          <textarea id={id} rows={5} required minLength={15} maxLength={12000} value={lyrics} disabled={state.status === 'loading'} onChange={event => setLyrics(event.target.value)} aria-describedby={`${id}-hint`} />
          <p id={`${id}-hint`} className="text-muted text-sm">{t('reidentify.fragmentHint')}</p>
        </div>
        {state.status === 'loading' && <p role="status">{t('reidentify.loading')}</p>}
        {['ambiguous', 'unconfirmed'].includes(state.status) && <p role="status">{t(`reidentify.${state.status}`)}</p>}
        {state.error && <p role="alert">{describeError(state.error, t).description}</p>}
        <div className="row row--wrap">
          <button className="btn btn--primary" disabled={state.status === 'loading' || lyrics.trim().length < 15}>{t('reidentify.submit')}</button>
          <button type="button" className="btn btn--secondary" onClick={cancel}>{t('common.cancel')}</button>
        </div>
      </form>
    </Modal>}
  </div>
}
