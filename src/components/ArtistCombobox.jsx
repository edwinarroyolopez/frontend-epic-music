import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { ARTISTS_UPDATED_EVENT, suggestArtists } from '../services/api.js'

export function ArtistCombobox({ value, onChange }) {
  const { t } = usePreferences()
  const id = useId(), input = useRef(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState({ query: '', revision: -1, status: 'idle', items: [] })
  const refresh = useCallback(() => { setActive(-1); setRevision(value => value + 1) }, [])
  useEffect(() => {
    window.addEventListener(ARTISTS_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(ARTISTS_UPDATED_EVENT, refresh)
  }, [refresh])
  const query = value.trim()
  useEffect(() => {
    if (query.length < 2) return
    const controller = new AbortController()
    let current = true
    const timer = setTimeout(async () => {
      setState({ query, revision, status: 'loading', items: [] })
      try {
        const items = await suggestArtists(query, { signal: controller.signal })
        if (current) setState({ query, revision, status: items.length ? 'ready' : 'empty', items })
      } catch (error) {
        if (current && error.name !== 'AbortError') setState({ query, revision, status: 'error', items: [] })
      }
    }, 250)
    return () => { current = false; clearTimeout(timer); controller.abort() }
  }, [query, revision])
  const current = state.query === query && state.revision === revision && query.length >= 2
  const items = current ? state.items : []
  const expanded = open && items.length > 0
  useEffect(() => {
    if (expanded && active >= 0) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [expanded, active, id])
  const choose = name => { onChange(name); setOpen(false); setActive(-1); input.current?.focus() }
  const keyDown = event => {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setActive(-1) }
    if (event.key === 'Tab') setOpen(false)
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && items.length) {
      event.preventDefault(); setOpen(true)
      setActive(index => event.key === 'ArrowDown' ? (index + 1) % items.length : (index <= 0 ? items.length - 1 : index - 1))
    }
    if (event.key === 'Enter' && expanded && active >= 0) { event.preventDefault(); choose(items[active].canonicalName) }
  }
  return <div className="artist-combobox discovery-field">
    <label htmlFor={`${id}-input`}>{t('discovery.artist')}</label>
    <div className="artist-combobox__control">
      <input ref={input} id={`${id}-input`} role="combobox" aria-autocomplete="list" autoComplete="off"
        aria-expanded={expanded} aria-controls={`${id}-list`} aria-describedby={`${id}-help`}
        aria-activedescendant={expanded && active >= 0 ? `${id}-option-${active}` : undefined}
        maxLength={200} value={value} onKeyDown={keyDown} onFocus={() => { setOpen(true); refresh() }} onBlur={() => setOpen(false)}
        onChange={event => { onChange(event.target.value); setOpen(true); setActive(-1) }} />
      {expanded && <ul id={`${id}-list`} role="listbox" aria-label={t('intelligence.suggestions')} className="artist-options">
        {items.map((artist, index) => <li key={artist.id} id={`${id}-option-${index}`} role="option" aria-selected={index === active}
          onPointerDown={event => event.preventDefault()} onClick={() => choose(artist.canonicalName)}>
          {artist.canonicalName}<small>{t(artist.validationStatus === 'curated' ? 'intelligence.curated' : 'intelligence.inferred')}</small>
        </li>)}
      </ul>}
    </div>
    <p id={`${id}-help`} className="text-muted text-sm" role="status" aria-live="polite">
      {open && current && ['loading', 'empty', 'error'].includes(state.status)
        ? t(`intelligence.${state.status}`) : t('intelligence.keyboard')}
    </p>
  </div>
}
