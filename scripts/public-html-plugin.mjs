import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

export function isPreview(context) {
  return ['deploy-preview', 'branch-deploy', 'dev'].includes(context)
}

export function publicHtmlPlugin(root, context = process.env.CONTEXT) {
  let devServer
  return {
    name: 'musica-epica:public-html',
    configureServer(server) {
      devServer = server
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        // Development reuses its own SSR loader. Creating another client
        // optimizer per request used to invalidate/replace React's live cache.
        // Builds use an isolated, SSR-only loader; no SSR runtime is shipped.
        const renderer = devServer || await createServer({
          root, configFile: false, plugins: [react()], appType: 'custom',
          cacheDir: `${root}/node_modules/.vite/public-html`,
          optimizeDeps: { noDiscovery: true, include: [] },
          server: { middlewareMode: true, hmr: false, watch: null },
        })
        try {
          const { renderPublicLanding } = await renderer.ssrLoadModule('/src/prerender.jsx')
          const rendered = html.replace('<div id="root"></div>', () => `<div id="root">${renderPublicLanding()}</div>`)
          return isPreview(context)
            ? rendered.replace('content="index, follow, max-image-preview:large"', 'content="noindex, follow"')
            : rendered
        } finally {
          if (!devServer) await renderer.close()
        }
      },
    },
    generateBundle() {
      if (isPreview(context)) {
        this.emitFile({ type: 'asset', fileName: '_headers', source: '/*\n  X-Robots-Tag: noindex, follow\n' })
      }
    },
  }
}
