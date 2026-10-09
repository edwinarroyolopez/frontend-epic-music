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

const ROUTES = [
  { path: '/', element: Home },
  { path: '/perfil', element: Profile },
  { path: '/cuenta', element: Account },
  { path: '/ajustes', element: Settings },
  { path: '/login', element: Login },
  { path: '/playlists', element: Playlists },
  { path: '/historial', element: SearchHistory },
]

// Ajustes es publica (idioma y tema deben poder cambiarse antes de entrar);
// el resto de vistas requieren sesion.
const PRIVATE_PATHS = ['/perfil', '/cuenta']

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
  // Vive aqui (y no en Home) para que la cancion seleccionada no se pierda
  // al ir a Perfil, Tu cuenta o Ajustes y volver al buscador.
  const search = useSongSearch()

  const parent = ['/playlists', '/historial'].find(prefix => path.startsWith(`${prefix}/`))
  const route = parent ? ROUTES.find(r => r.path === parent) : matchRoute(path, ROUTES)
  const Page = route?.element ?? Home

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

      navigate(
        "/login"
      );
    }

  }, [
    needsAuth,
    isAuthenticated,
    sessionChecking,
    navigate
  ]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [path])

  const goHome = useCallback(() => navigate('/'), [navigate])

  const openCustomTheme = useCallback(() => {
    if (path !== '/ajustes') {
      navigate('/ajustes')
      return
    }
    requestAnimationFrame(() => {
      document.getElementById('settings-custom')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [path, navigate])

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>

      <Header path={route?.path ?? '/'} onNavigate={navigate} onSearchClick={goHome} />

      <main className="app__main" id="main" ref={mainRef} tabIndex={-1}>
        <Page
          onNavigate={navigate}
          onOpenCustom={openCustomTheme}
          onSignedIn={goHome}
          search={search}
          path={path}
        />
      </main>

      <Footer />
    </div>
  )
}

export default App
