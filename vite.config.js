import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const resolvePath = (path) => fileURLToPath(new URL(path, import.meta.url))

// Frontend de MUSICA EPICA.
// La API se ejecuta por separado y se configura con VITE_API_URL.
//
// Hay dos entradas a proposito:
//   - dev.html  : entrada de Vite (desarrollo con recarga en caliente).
//                 El servidor la sirve en "/" y en "/dev.html".
//   - index.html: build autonomo de un solo archivo, generado por
//                 "npm run build" (scripts/build-standalone.mjs). Se puede
//                 abrir con doble clic, con "Open with Live Server" o
//                 cualquier servidor estatico, sin Node ni Vite.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolvePath('.'), 'VITE_')
  const apiUrl = env.VITE_API_URL || 'http://localhost:7000'

  return {
    plugins: [
      react(),
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
