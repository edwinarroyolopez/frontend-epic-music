import { useCallback, useEffect, useState } from 'react'

function readHash() {
  if (typeof window === 'undefined') return '#/'
  // Se ignoran los parametros: por ejemplo "#/?token=..." (retorno de Apple)
  // sigue siendo la ruta principal.
  const raw = window.location.hash.replace(/^#/, '').split('?')[0]
  return raw.startsWith('/') ? raw : '/'
}

/**
 * Router minimo basado en el hash de la URL.
 * Evita anadir una dependencia de enrutado: la aplicacion solo necesita
 * navegar entre unas pocas vistas (/, /perfil, /cuenta, /ajustes, /login).
 * Funciona con el boton atras del navegador y con enlaces reales (#/perfil).
 */
export function useHashRoute() {
  const [path, setPath] = useState(readHash)

  useEffect(() => {
    const onChange = () => setPath(readHash())
    window.addEventListener('hashchange', onChange)
    if (!window.location.hash) window.location.hash = '#/'
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((to) => {
    const next = to.startsWith('/') ? to : `/${to}`
    if (readHash() !== next) window.location.hash = next
    // Keep navigation in the same React update as login/logout. Waiting only
    // for hashchange can let an old private route redirect a signed-out user.
    setPath(next)
  }, [])

  return [path, navigate]
}

/** Normaliza una ruta: quita la barra final y devuelve la parte usable. */
export function matchRoute(path, routes) {
  const clean = path.replace(/\/+$/, '') || '/'
  return routes.find((route) => route.path === clean) ?? null
}
