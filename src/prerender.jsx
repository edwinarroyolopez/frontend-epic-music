import { renderToStaticMarkup } from 'react-dom/server'
import { Disc3, LogIn, Settings } from 'lucide-react'
import { PreferencesProvider } from './context/PreferencesContext.jsx'
import { Landing } from './pages/Landing.jsx'
import { Footer } from './components/Footer.jsx'

// Build-time public entry only. No App, UserProvider, API calls or session data.
// createRoot replaces this shell with the normal authenticated/localized app.
export function renderPublicLanding() {
  if (typeof window !== 'undefined') throw new Error('Public rendering must run without a browser/session')
  return renderToStaticMarkup(<PreferencesProvider>
    <div className="app">
      <a className="skip-link" href="#main">Saltar al contenido principal</a>
      <header className="header header--public"><div className="header__inner">
        <a className="brand brand--md" href="#/" aria-label="MUSICA EPICA — Ir al inicio">
          <span className="brand__mark" aria-hidden="true"><Disc3 size={24} strokeWidth={1.8} /></span>
          <span className="brand__text"><span className="brand__name">MUSICA{' '}</span><span className="brand__name brand__name--accent">EPICA</span></span>
        </a>
        <nav className="header__nav header__public-nav" aria-label="Música Épica"><a className="header__link" href="#/" aria-current="page">La experiencia</a></nav>
        <div className="header__actions">
          <a className="header__settings header__link" href="#/ajustes" aria-label="Ajustes"><Settings size={18} aria-hidden="true" /></a>
          <a className="btn btn--primary header__login" href="#/login"><LogIn size={16} aria-hidden="true" /><span>Iniciar sesión</span></a>
        </div>
      </div></header>
      <main className="app__main" id="main" tabIndex={-1}>
        <noscript><p className="landing-nojs">Puedes leer cómo funciona Música Épica aquí. Para crear una cuenta, iniciar sesión o buscar canciones, activa JavaScript y vuelve a abrir el enlace correspondiente.</p></noscript>
        <Landing staticView />
      </main>
      <Footer publicView />
    </div>
  </PreferencesProvider>)
}
