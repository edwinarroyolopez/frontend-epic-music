/**
 * Configuracion de la capa de datos del frontend.
 *
 * El frontend consume una API HTTP independiente. La URL se configura con una sola
 * variable de entorno, VITE_API_URL (ver .env.example), y se lee aqui para no
 * repetirla en ningun componente.
 */

const env = import.meta.env

const DEFAULT_API_URL = 'http://localhost:7000'

const configurada = (env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')

console.log({ configurada })

// Si la pagina se sirve desde la propia API, se usan
// rutas relativas: mismo origen, sin CORS y sin depender del host.
const mismoOrigen =
  typeof window !== 'undefined' && window.location.origin === configurada

console.log({ mismoOrigen })

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

console.log({ api_publicada: API_PUBLICADA_SIN_URL, env_dev: env.DEV })

export const API_CONFIG = {
  // Vite reenvia las peticiones a VITE_API_URL durante el desarrollo.
  baseUrl: configurada,
  timeout: Number(env.VITE_API_TIMEOUT ?? 20000),
  // Cantidad de recomendaciones que se piden al backend.
  recommendationCount: Number(env.VITE_RECOMMENDATION_COUNT ?? 5),
}

export const API_ENDPOINTS = {
  search: '/songs',
  recommend: '/recommend',
  health: '/health',
}
