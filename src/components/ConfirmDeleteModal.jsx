import { useEffect, useRef, useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { describeError } from '../services/api.js'
import { Modal } from './Modal.jsx'

/** Mount per target. One reusable confirmation for all destructive actions. */
export function ConfirmDeleteModal({ title, description, onConfirm, onDeleted, onClose }) {
  const { t } = usePreferences()
  const lock = useRef(false), alive = useRef(true)
  const [state, setState] = useState({ busy: false, error: null })
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const confirm = async () => {
    if (lock.current) return
    lock.current = true; setState({ busy: true, error: null })
    try { await onConfirm(); if (alive.current) onDeleted() }
    catch (error) { if (alive.current) setState({ busy: false, error }) }
    finally { lock.current = false; if (alive.current) setState(value => ({ ...value, busy: false })) }
  }
  return <Modal open title={title} description={description} onClose={() => { if (!lock.current) onClose() }} closeDisabled={state.busy}>
    {state.error && <p role="alert">{describeError(state.error, t).description}</p>}
    {state.busy && <p role="status">{t('table.deleting')}</p>}
    <div className="row row--wrap">
      <button type="button" className="btn btn--secondary" data-autofocus disabled={state.busy} onClick={onClose}>{t('common.cancel')}</button>
      <button type="button" className="btn btn--primary" disabled={state.busy} onClick={confirm}>{t('table.confirmDelete')}</button>
    </div>
  </Modal>
}
