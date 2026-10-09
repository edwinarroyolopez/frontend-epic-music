import { useEffect, useRef, useState } from 'react'
import { LogIn, Search, Settings } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { useUser } from '../context/UserContext.jsx'
import { Brand } from './Brand.jsx'
import { ProfileMenuTrigger } from './ProfileMenu.jsx'

/**
 * Cabecera persistente: logotipo, acceso rapido al buscador y menu de perfil.
 * El avatar y el menu comparten el mismo estado de usuario, por lo que un
 * cambio de foto se refleja en los dos sitios a la vez.
 */
export function Header({ path, onNavigate, onSearchClick }) {
  const { t } = usePreferences()
  const { user, isAuthenticated, signOut } = useUser()
  // El menu se marca como abierto "en" una ruta concreta: al navegar se
  // cierra solo, sin necesidad de un efecto.
  const [openForPath, setOpenForPath] = useState(null)
  const menuOpen = openForPath === path
  const headerRef = useRef(null)

  // Cierra el menu si se hace clic fuera del header.
  useEffect(() => {
    if (!menuOpen) return undefined
    const onPointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) setOpenForPath(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  return (
    <header className="header" ref={headerRef}>
      <div className="header__inner">
        <Brand onClick={() => onNavigate('/')} />

        <nav className="header__nav" aria-label={t('app.name')}>
          <button
            type="button"
            className={`header__link${path === '/' ? ' is-active' : ''}`}
            onClick={onSearchClick}
            aria-current={path === '/' ? 'page' : undefined}
            aria-label={t('nav.home')} title={t('nav.home')}
          >
            <Search size={15} aria-hidden="true" />
            <span className="header__search-label">{t('nav.home')}</span>
          </button>
          <button type="button" className={`header__link${path === '/historial' ? ' is-active' : ''}`} aria-current={path === '/historial' ? 'page' : undefined} onClick={() => onNavigate('/historial')}>{t('history.title')}</button>
          <button type="button" className={`header__link${path === '/playlists' ? ' is-active' : ''}`} aria-label={t('playlists.title')} aria-current={path === '/playlists' ? 'page' : undefined} onClick={() => onNavigate('/playlists')}>Playlists</button>
        </nav>

        <div className="header__actions">
          <button type="button" className={`header__settings header__link${path === '/ajustes' ? ' is-active' : ''}`} aria-label={t('settings.title')} title={t('settings.title')} aria-current={path === '/ajustes' ? 'page' : undefined} onClick={() => onNavigate('/ajustes')}><Settings size={18} aria-hidden="true" /></button>
          {isAuthenticated ? (
            <ProfileMenuTrigger
              user={user}
              open={menuOpen}
              onToggle={() => setOpenForPath(menuOpen ? null : path)}
              onClose={() => setOpenForPath(null)}
              onNavigate={onNavigate}
              onSignOut={signOut}
            />
          ) : (
            <button type="button" className="btn btn--primary header__login" aria-label={t('nav.login')} title={t('nav.login')} onClick={() => onNavigate('/login')}>
              <LogIn size={16} aria-hidden="true" />
              <span>{t('nav.login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
