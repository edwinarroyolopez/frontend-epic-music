import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

export function isPreview(context) {
  return ['deploy-preview', 'branch-deploy', 'dev'].includes(context)
}

export function publicHtmlPlugin(root, context = process.env.CONTEXT) {
  return {
    name: 'musica-epica:public-html',
    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        // A separate, middleware-only Vite loader compiles existing JSX at build
        // time. No SSR runtime, dependency or private application entry is shipped.
        const renderer = await createServer({
          root, configFile: false, plugins: [react()], appType: 'custom',
          server: { middlewareMode: true, hmr: false, watch: null },
        })
        try {
          const { renderPublicLanding } = await renderer.ssrLoadModule('/src/prerender.jsx')
          const rendered = html.replace('<div id="root"></div>', () => `<div id="root">${renderPublicLanding()}</div>`)
          return isPreview(context)
            ? rendered.replace('content="index, follow, max-image-preview:large"', 'content="noindex, follow"')
            : rendered
        } finally {
          await renderer.close()
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
