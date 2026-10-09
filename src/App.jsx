import { useCallback, useEffect, useRef } from 'react'
import { Footer } from './components/Footer.jsx'
import { Header } from './components/Header.jsx'
import { usePreferences } from './context/PreferencesContext.jsx'
import { useUser } from './context/UserContext.jsx'
import { matchRoute, useHashRoute } from './hooks/useHashRoute.js'
import { Account } from './pages/Account.jsx'
import { Home } from './pages/Home.jsx'
import { Login } from './pages/Login.jsx'
import { Profile } from './pages/Profile.jsx'
import { Settings } from './pages/Settings.jsx'
import { Playlists } from './pages/Playlists.jsx'
import { useSongSearch } from './hooks/useSongSearch.js'
import { SearchHistory } from './pages/SearchHistory.jsx'
import { PlaylistAnalysisHistory } from './pages/PlaylistAnalysisHistory.jsx'
import { Landing } from './pages/Landing.jsx'

const ROUTES = [
  { path: '/', element: Home },
  { path: '/perfil', element: Profile },
  { path: '/cuenta', element: Account },
  { path: '/ajustes', element: Settings },
  { path: '/login', element: Login },
  { path: '/registro', element: Login },
  { path: '/playlists', element: Playlists },
  { path: '/historial', element: SearchHistory },
  { path: '/analisis', element: PlaylistAnalysisHistory },
]

// The root is a landing for visitors and the search workspace for accounts.
// Settings, sign-in and registration remain public.
const PRIVATE_PATHS = ['/perfil', '/cuenta', '/playlists', '/historial', '/analisis']

/**
 * Raiz de la aplicacion: rutas, cabecera persistente y navegacion.
 * La sesion y las preferencias se resuelven en App para que el header
 * (avatar, menu) y las paginas compartan exactamente el mismo estado.
 */
export function App() {
  const { t } = usePreferences()
  const {
    isAuthenticated,
    sessionChecking
  } = useUser();
  const [path, navigate] = useHashRoute()
  const mainRef = useRef(null)
  const firstRender = useRef(true)
  const returnTo = useRef('/')
  // Vive aqui (y no en Home) para que la cancion seleccionada no se pierda
  // al ir a Perfil, Tu cuenta o Ajustes y volver al buscador.
  const search = useSongSearch()

  const parent = ['/playlists', '/historial', '/analisis'].find(prefix => path.startsWith(`${prefix}/`))
  const route = parent ? ROUTES.find(r => r.path === parent) : matchRoute(path, ROUTES)
  const Page = route?.element ?? Home

  useEffect(() => {
    if (path === '/analizar' || path.startsWith('/analizar/')) window.location.replace('#/')
  }, [path])

  // Rutas privadas: sin sesion se vuelve a la pantalla de acceso.
  const needsAuth = Boolean(route) && PRIVATE_PATHS.includes(route.path)
  useEffect(() => {

    if (sessionChecking) {
      return;
    }

    if (
      needsAuth &&
      !isAuthenticated
    ) {

      returnTo.current = path
      window.location.replace('#/login')
    }

  }, [
    needsAuth,
    isAuthenticated,
    sessionChecking,
    path
  ]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [path])

  const goHome = useCallback(() => navigate('/'), [navigate])
  const signedIn = useCallback(() => {
    navigate(returnTo.current)
    returnTo.current = '/'
  }, [navigate])
  // Do not mount private pages (or their data-fetching effects) while signed out.
  const VisiblePage = !isAuthenticated ? needsAuth ? Login : Page === Home ? Landing : Page : Page

  const openCustomTheme = useCallback(() => {
    if (path !== '/ajustes') {
      navigate('/ajustes')
      return
    }
    requestAnimationFrame(() => {
      document.getElementById('settings-custom')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' })
    })
  }, [path, navigate])

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={event => {
        event.preventDefault()
        mainRef.current?.focus({ preventScroll: true })
        window.scrollTo({ top: 0, behavior: 'instant' })
      }}>
        {t('nav.skipToContent')}
      </a>

      <Header path={route?.path ?? '/'} onNavigate={navigate} onSearchClick={goHome} />

      <main className="app__main" id="main" ref={mainRef} tabIndex={-1}>
        {isAuthenticated && ['/historial', '/analisis'].includes(route?.path) && <nav className="page row row--wrap" aria-label={t('personality.historyTypes')}>
          <a className="btn btn--secondary" aria-current={route.path === '/historial' ? 'page' : undefined} href="#/historial">{t('personality.searchHistory')}</a>
          <a className="btn btn--secondary" aria-current={route.path === '/analisis' ? 'page' : undefined} href="#/analisis">{t('personality.history')}</a>
        </nav>}
        {sessionChecking ? <div className="session-loading" role="status"><span className="state__spinner" aria-hidden="true" />{t('states.loading')}</div> : <VisiblePage
          key={route?.path ?? '/'}
          onNavigate={navigate}
          onOpenCustom={openCustomTheme}
          onSignedIn={signedIn}
          initialMode={route?.path === '/registro' ? 'registro' : 'login'}
          search={search}
          path={path}
        />}
      </main>

      <Footer publicView={!isAuthenticated} />
    </div>
  )
}

export default App
