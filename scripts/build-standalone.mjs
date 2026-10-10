#!/usr/bin/env node
/**
 * Genera index.html: el build autonomo de la aplicacion.
 *
 * Toma el HTML que produce Vite en dist/ e incrusta dentro los CSS y el JS,
 * de modo que index.html se abre directamente (doble clic, "Open with Live
 * Server", cualquier servidor estatico) sin necesidad de Node, Vite ni un
 * servidor con transformaciones.
 *
 * Paso opcional: node scripts/build-standalone.mjs (después de npm run build).
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONT = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(FRONT, 'dist')
const TARGET = join(FRONT, 'index.html')

if (!existsSync(DIST)) {
  console.error('No existe dist/. Ejecuta primero: vite build')
  process.exit(1)
}

const distHtml = 'index.html'
if (!existsSync(join(DIST, distHtml))) {
  console.error('dist/ no contiene index.html. Ejecuta primero npm run build.')
  process.exit(1)
}

let html = readFileSync(join(DIST, distHtml), 'utf8')

/** Escapa secuencias que romperian un <script> inline. */
const escapeForInlineScript = (code) => code.replace(/<\/script/gi, '<\\/script')

/** Incrusta el contenido de un asset referenciado en el HTML. */
function inlineAsset(htmlString, pattern, tagName) {
  return htmlString.replace(pattern, (match, href) => {
    const file = join(DIST, href.replace(/^\.?\//, ''))
    if (!existsSync(file)) return match
    const content = escapeForInlineScript(readFileSync(file, 'utf8'))
    if (tagName === 'script') {
      return `<script type="module">\n${content}\n</script>`
    }
    return `<style>\n${content}\n</style>`
  })
}

html = inlineAsset(html, /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, 'style')
html = inlineAsset(html, /<script[^>]*src="([^"]+)"[^>]*><\/script>/g, 'script')

// Cinematic SVGs are shared by the prerendered HTML and the client bundle.
// Embed both references so the standalone file still works with file://.
for (const name of readdirSync(join(DIST, 'assets')).filter(name => /\.svg$/.test(name))) {
  const data = `data:image/svg+xml;base64,${readFileSync(join(DIST, 'assets', name)).toString('base64')}`
  html = html.replaceAll(`./assets/${name}`, data).replaceAll(`/assets/${name}`, data)
  // With base:'./', Vite also emits new URL("name.svg", import.meta.url).
  // The original module lives in assets/; the embedded one lives in index.html.
  html = html.replaceAll(`./${name}`, data).replaceAll(name, data)
}

// El favicon se incrusta como data URI: asi index.html no depende de archivos
// vecinos y funciona tambien con el protocolo file://.
html = html.replace(/<link[^>]*rel="icon"[^>]*href="([^"]+)"[^>]*>/g, (match, href) => {
  const file = join(DIST, href.replace(/^\.?\//, ''))
  if (!existsSync(file)) return match
  const base64 = readFileSync(file).toString('base64')
  return `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${base64}" />`
})

html = html.replace(
  '</head>',
  '  <meta name="generator" content="MUSICA EPICA - build autonomo" />\n  </head>',
)

// Comentario de cabecera propio: el del HTML de desarrollo no tiene sentido aqui.
html = html.replace(
  /<!--[\s\S]*?-->/,
  '<!--\n' +
    '  MUSICA EPICA - build autonomo.\n' +
    '  Archivo generado por scripts/build-standalone.mjs: contiene toda la aplicacion\n' +
    '  (HTML + CSS + JavaScript) y no depende de Node, Vite ni servidores\n' +
    '  especiales. Se puede abrir con doble clic, con "Open with Live Server"\n' +
    '  o con cualquier servidor estatico.\n' +
    '  Para desarrollo con recarga en caliente: npm run dev\n' +
    '-->\n',
)

writeFileSync(TARGET, html, 'utf8')
// dist/ conserva el build con assets cacheables que publica Netlify.

const kb = (Buffer.byteLength(html) / 1024).toFixed(0)
console.log(`> index.html autonomo generado (${kb} kB, sin dependencias externas)`)
