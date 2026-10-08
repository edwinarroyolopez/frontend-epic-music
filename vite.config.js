import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

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
    plugins: [
      react(),
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
            if (req.url === '/' || req.url === '/index.html') req.url = '/dev.html'
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
