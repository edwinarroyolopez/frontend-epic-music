/**
 * Configuracion de la capa de datos del frontend.
 *
 * El frontend consume una API HTTP independiente. La URL se configura con una sola
 * variable de entorno, VITE_API_URL (ver .env.example), y se lee aqui para no
 * repetirla en ningun componente.
 */

const env = import.meta.env ?? {}

const DEFAULT_API_URL = 'http://localhost:7000'

const configurada = (env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')


// Si la pagina se sirve desde la propia API, se usan
// rutas relativas: mismo origen, sin CORS y sin depender del host.
const mismoOrigen =
  typeof window !== 'undefined' && window.location.origin === configurada


const esLocalhost = (url) =>
  /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(String(url || '').trim())

/**
 * La app se sirve desde fuera de localhost (Netlify, un dominio, la red local)
 * pero VITE_API_URL sigue apuntando a localhost. En el navegador de un
 * visitante "localhost" es SU equipo, no el servidor de la API, asi que nunca
 * conectara. Se resuelve definiendo VITE_API_URL en el despliegue.
 */
export const API_PUBLICADA_SIN_URL =
  !env.DEV && typeof window !== 'undefined' && esLocalhost(configurada) && !esLocalhost(window.location.origin)


export const API_CONFIG = {
  // Llamadas directas a Express; Netlify inyecta la URL HTTPS de Railway al compilar.
  baseUrl: mismoOrigen ? '' : configurada,
  timeout: Number(env.VITE_API_TIMEOUT ?? 20000),
  aiTimeout: Number(env.VITE_AI_TIMEOUT ?? 240000),
}

export const API_ENDPOINTS = {
  search: '/search-songs',
  health: '/health',
}
