import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext.jsx'

const modalStack = []
let background = null
function syncModalStack() {
  modalStack.forEach(({ layer }, index) => {
    layer.style.setProperty('--modal-depth', index)
    layer.inert = index !== modalStack.length - 1
  })
  if (modalStack.length) {
    if (background.root) background.root.inert = true
    document.body.style.overflow = 'hidden'
  } else if (background) {
    if (background.root) background.root.inert = background.inert
    document.body.style.overflow = background.overflow
    background = null
  }
}

/**
 * Modal reutilizable: capa oscura, cierre con Escape o clic fuera, foco
 * dentro del dialogo y devolucion del foco al cerrarlo.
 *
 * El foco inicial se pone en el primer CAMPO de texto (no en un boton) y solo
 * cuando el modal se abre: si el efecto se repitiera en cada render, le
 * robarian el foco al usuario mientras escribe.
 *
 * @param {{ open: boolean, title: string, description?: string, onClose: () => void, children: ReactNode, footer?: ReactNode }} props
 */
export function Modal({ open, title, description, onClose, children, footer, size = 'normal', initialFocus = 'auto', closeDisabled = false }) {
  const { t } = usePreferences()
  const dialogRef = useRef(null)
  const layerRef = useRef(null)
  const previouslyFocused = useRef(null)
  const id = useId()
  // onClose suele ser una funcion nueva en cada render del padre: se guarda en
  // un ref para que el efecto de foco no dependa de ella.
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    previouslyFocused.current = document.activeElement
    const dialog = dialogRef.current
    if (!modalStack.length) {
      const root = document.getElementById('root')
      background = { root, inert: root?.inert, overflow: document.body.style.overflow }
    }
    const entry = { layer: layerRef.current, dialog }
    modalStack.push(entry)
    syncModalStack()
    const campo = dialog?.querySelector('[data-autofocus], input:not([type=file]):not([disabled]), textarea:not([disabled])')
    const boton = dialog?.querySelector('button:not([data-modal-close]):not([disabled])')
    ;(initialFocus === 'dialog' ? dialog : campo ?? boton ?? dialog)?.focus()

    const onKeyDown = (event) => {
      if (modalStack.at(-1)?.dialog !== dialog) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const focusables = [...(dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex="0"]',
      ) ?? [])].filter(element => element.getClientRects().length > 0 && !element.closest('[inert]'))
      if (!focusables?.length) { event.preventDefault(); dialog.focus(); return }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const wasTop = modalStack.at(-1) === entry
      const index = modalStack.indexOf(entry)
      if (index !== -1) modalStack.splice(index, 1)
      syncModalStack()
      if (!wasTop) return
      const previous = previouslyFocused.current
      if (previous?.isConnected && previous !== document.body && !previous.closest('[inert]')) previous.focus?.({ preventScroll: true })
      else if (modalStack.length) modalStack.at(-1).dialog.focus()
      else document.getElementById('main')?.focus()
    }
  }, [open, initialFocus])

  if (!open) return null

  return createPortal(
    <div className="modal-layer" ref={layerRef}>
      <button type="button" className="modal__scrim" aria-hidden="true" tabIndex={-1} onClick={onClose} disabled={closeDisabled} />
      <div className="modal" role="presentation">
        <div
          className={`modal__dialog card${size === 'wide' ? ' modal__dialog--wide' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          aria-describedby={description ? `${id}-description` : undefined}
          tabIndex={-1}
          data-epic-modal
          ref={dialogRef}
        >
          <header className="modal__header">
            <h2 className="modal__title" id={`${id}-title`}>{title}</h2>
            <button
              type="button"
              className="modal__close"
              onClick={onClose}
              data-modal-close
              disabled={closeDisabled}
              aria-label={t('common.close')}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          {description && <p className="modal__description" id={`${id}-description`}>{description}</p>}

          <div className="modal__body">{children}</div>

          {footer && <footer className="modal__footer">{footer}</footer>}
        </div>
      </div>
    </div>, document.body
  )
}
