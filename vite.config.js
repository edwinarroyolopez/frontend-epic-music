import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { publicHtmlPlugin } from './scripts/public-html-plugin.mjs'

const resolvePath = (path) => fileURLToPath(new URL(path, import.meta.url))

// Frontend de MUSICA EPICA.
// La API se ejecuta por separado y se configura con VITE_API_URL.
//
// dev.html es la fuente. El build genera también dist/index.html para que
// Netlify y otros servidores estáticos sirvan la raíz sin reglas especiales.
// scripts/build-standalone.mjs sigue siendo un paso opcional independiente.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolvePath('.'), 'VITE_')
  const apiUrl = env.VITE_API_URL || 'http://localhost:7000'

  return {
    // A production-mode QA/prerender process must never overwrite the live
    // development server's React JSX runtime in a shared optimizer cache.
    cacheDir: resolvePath(`node_modules/.vite/client-${mode}-${process.env.NODE_ENV === 'production' ? 'production' : 'development'}`),
    // Hash routing needs no SPA fallback: unknown HTTP paths must be 404.
    appType: 'mpa',
    plugins: [
      react(),
      publicHtmlPlugin(resolvePath('.')),
      {
        name: 'musica-epica:static-index',
        apply: 'build',
        enforce: 'post',
        generateBundle(_options, bundle) {
          const entry = bundle['dev.html']
          if (!entry || entry.type !== 'asset') this.error('No se generó dev.html para crear index.html')
          this.emitFile({ type: 'asset', fileName: 'index.html', source: entry.source })
        },
      },
      {
        name: 'musica-epica:dev-entry',
        configureServer(server) {
          // "/" e "/index.html" muestran la app de desarrollo (no el build).
          server.middlewares.use((req, _res, next) => {
            const url = new URL(req.url, 'http://localhost')
            if (url.pathname === '/' || url.pathname === '/index.html') req.url = `/dev.html${url.search}`
            next()
          })
        },
      },
    ],
    resolve: {
      alias: {
        '@': resolvePath('./src'),
      },
    },
    // Rutas relativas: el build funciona en cualquier carpeta o subruta.
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: resolvePath('./dev.html'),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    preview: {
      port: 3000,
      strictPort: true,
    },
  }
})
