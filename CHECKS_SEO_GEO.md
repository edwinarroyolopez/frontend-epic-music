# Checks SEO / GEO

Fecha: 2026-10-09 UTC. **Implementación local verificada; no se ha desplegado.**
Base de todas las rutas de evidencia: `evidence/seo-geo/`. Navegador: Chrome 147.0.7727.116, Playwright Core; axe 4.14.0; Lighthouse 12.8.2. Sin nuevas dependencias de la aplicación ni cambios en package-lock.

## Matriz por loop

| Loop | Estado | Prueba / resultado | Evidencia y archivos |
|---|---|---|---|
| 0 — inventario | **PASS** | Frontend Git limpio al inicio; fuentes oficiales revisadas; HEAD/GET públicos y origen inspeccionados | `PLAN_SEO_GEO.md`, `public-http.json`, `production.html` |
| 1 — head | **PASS local** | Title/description/canonical/robots, 11 OG y 5 Twitter; imagen exacta y dimensiones; sin duplicados; fuente, build, standalone y HTTP | `dev.html`, `head-checks.json`, `html-checks.json`; `npm run test:seo` |
| 2 — HTML inicial | **PASS local** | H1 único, texto real y enlaces de registro antes de JS; mismo contenido FAQ después de montar React. Chromium con/sin JS a 390/1366; CTA conserva formulario | `src/prerender.jsx`, `scripts/public-html-plugin.mjs`, `local-http.html`, `browser-checks.json`, `js-es-390.png`, `nojs-es-1366.png` |
| 3 — rastreo | **PASS local** | `/` 200; robots text/plain 200; sitemap text/xml 200 y XML parseable con una URL sin hash/lastmod; paths inexistentes y `/playlists` 404 | `public/`, `netlify.toml`, `browser-checks.json` |
| 3 — contextos | **PASS local / BLOCKED remoto** | Builds reales con CONTEXT production, deploy-preview, branch-deploy: solo previews tienen meta noindex + `_headers`. Sin permiso para crear deploys remotos | `context-checks.json`; `node scripts/check-seo-contexts.mjs` |
| 4 — schema | **PASS local** | JSON-LD del HTTP parseado; WebSite/WebApplication enlazados por @id; sin ofertas, ratings, identidad legal ni datos de cuentas | `dev.html`, `local-http.html`; checks Python. Validación interactiva externa: **MANUAL PENDIENTE** |
| 5 — GEO | **PASS local** | 7 respuestas ES/EN; texto presente en HTML, details/summary nativos; inferencias y límites. Nuevos análisis y entrada de enlaces indicados como «Próximamente» | `Landing.jsx`, `translations/{es,en}.js`; `browser-checks.json` y referencias funcionales del plan |
| 6 — regresión | **PASS local** | 37 tests Node (35 existentes + 2 SEO), 8 pruebas HTML/antirregresión; lint 0 errores/0 advertencias; diff --check limpio | `regression-checks.json`, `test/seo.test.js`, `scripts/test-seo.py` |
| 6 — UX / accesibilidad | **PASS local** | 15 vistas: no-JS ES y JS ES/EN × 320/390/768/1366/1440. Sin overflow. Details con Enter; lang correcto; idioma persiste; tema claro y controles del vinilo operativos. 5 escaneos axe WCAG 2 A/AA y 2.1 A/AA sin infracciones | `browser-checks.json`, `js-en-light-1366.png`; no-JS verificado por semántica, teclado y capturas (axe requiere timers JS) |
| 6 — rendimiento | **PASS laboratorio local** | Lighthouse móvil 99/100/100 y escritorio 100/100/100 (performance/accesibilidad/SEO). LCP ≈1.81 s/0.40 s; CLS 0; TBT 0. Imagen OG no descargada por la landing | `performance.json`. No representa CWV de campo, INP, ranking ni velocidad de producción |
| 7 — HTTP/social | **PASS local** | Mismo HTML inicial para Facebook, Twitterbot, OAI-SearchBot, Googlebot y Bingbot; exactitud de imagen y metadatos verificada sin JS | `browser-checks.json`, `html-checks.json`; validador social real **MANUAL PENDIENTE** |
| 7 — autenticación | **PASS contrato local / MANUAL PENDIENTE cuenta real** | Registro y login por formularios, restauración `/auth/me`, logout y 5 guards pasan con API simulada. Sesiones/datos de usuario nunca pasan por el renderer | `browser-checks.json`, `registration-390.png`; no se creó una cuenta ni se enviaron credenciales de prueba a Railway |
| 7 — producción | **BLOCKED actualización** | El sitio existente sigue entregando HTML de 829 bytes, root vacío y sin nuevo head; robots/sitemap aún 404. Falta publicación autorizada, por tanto aceptación A/C/G en vivo no está satisfecha | `production.html`, `production-facebook.html`, `production-searchbot.html`, `public-http.json` |

## Criterios A–I

| Criterio | Estado y alcance |
|---|---|
| A: head completo en GET / | PASS local (4173 build, 4174 Vite, 4175 autónomo); FAIL en producción actual hasta desplegar |
| B: imagen pública comprobada | PASS real Cloudinary: GET/HEAD 200, PNG por firma y Content-Type, **1731×909**, **1.9043:1**, **1,929,146 bytes**. URL exacta sin cambios; `social-image.png` + `public-http.json` |
| C: contenido sin JS | PASS local; FAIL en producción actual hasta desplegar |
| D: canonical/sitemap públicos | PASS local: solo `https://musica-epica-ed.netlify.app/`; @id de schema puede usar fragmentos, no son páginas del sitemap |
| E: privacidad/auth | PASS contratos locales + rechazo HTTP real 401 sin sesión; login con cuenta real MANUAL PENDIENTE |
| F: claims verificables | PASS; creación de análisis deshabilitada en UI; Spotify/YouTube no configurados en API pública consultada, import=false y analysis=false |
| G: Netlify/build coherentes | PASS cadena local; BLOCKED paridad remota del nuevo artefacto hasta publicar |
| H: contenido y datos veraces | PASS inspección del renderer público, HTML/JSON-LD y diff. Ninguna respuesta API, token o sesión renderizados; ejemplos ilustrativos de la landing ya existentes, sin letras de terceros añadidas |
| I: evidencia reproducible | PASS: scripts, JSON, HTML, capturas, hashes de artefactos y `source.diff` |

Imagen: marca y mensaje principal legibles en inspección visual; los textos secundarios de las tarjetas son pequeños al reducirla. Peso relativamente alto pero inferior a 5 MB, sin impacto de descarga en la landing. La ilustración suministrada anuncia análisis de playlists, mientras la interfaz lo marca «Próximamente»: desfase editorial documentado, URL conservada por requisito. Su lectura visual no demuestra una tarjeta efectiva de WhatsApp/Facebook.

## Producción: lo que sí se comprobó

- Host documentado y GET/HEAD final: `https://musica-epica-ed.netlify.app/`, 200 sin redirect a dominio propio. No se accedió a Domain management; no se afirma inexistencia de alias externos.
- Cloudinary: imagen pública sin cookies/sesión; dimensiones IHDR calculadas desde los bytes, no inferidas de un nombre.
- Railway: `/auth/providers` 200, email habilitado y Apple/Google/Spotify deshabilitados. `/playlist-personality/providers` 200, Spotify/YouTube `not_configured`. `/auth/me`, `/playlists`, `/search-history`, `/playlist-personality/history` devuelven **401 sin token**. CORS permite el host canónico. Solo se guardan estados y flags públicos, nunca cuerpos privados: `api-boundaries.json`.
- `git status --short` del backend vacío al finalizar; sus funciones de negocio no se modificaron.

## Comandos para reproducir

Desde `frontend-epic-music/`, Node 22 y Python 3:

```sh
npm run test:seo
node scripts/check-seo-contexts.mjs
npm run lint
npm test
git diff --check
python3 scripts/audit-seo.py
```

Las herramientas de navegador se instalaron/usaron fuera del proyecto. Para reproducir en otro equipo, instalar Playwright Core y axe-core en una carpeta temporal y establecer sus rutas absolutas; usar Chrome disponible:

```sh
PW_MODULE=/tmp/opencode/epic-seo-tools/node_modules/playwright-core/index.mjs AXE_PATH=/tmp/opencode/epic-ux-tools/node_modules/axe-core/axe.min.js npm run test:seo:browser
LH_MODULE=/tmp/opencode/epic-ux-tools/node_modules/lighthouse/core/index.js CHROME_LAUNCHER_MODULE=/tmp/opencode/epic-ux-tools/node_modules/chrome-launcher/dist/index.js node scripts/check-seo-performance.mjs
node scripts/record-seo-review.mjs
```

El navegador inicia/cierra servidores locales en 4173/4174/4175; Lighthouse usa 4176. `CHROME_PATH` permite cambiar el ejecutable. Los builds de contexto se aíslan en `/tmp/opencode`, sin sobrescribir `dist`. `index.html` autónomo se genera en la raíz, ignorado por Git, y se comprueba servido por HTTP; `dist/index.html` conserva assets cacheables. Las evidencias no se copian a `dist`.

## Correcciones durante QA

- El runner HTTP inicialmente se bloqueaba por lanzar un proceso síncrono que consultaba su propio servidor Node. Se cambió a ejecución asíncrona; HTTP y navegador pasan.
- axe no puede completar su evaluación con timers desactivados en un contexto sin JS. Se mantuvo JS realmente desactivado y se verificaron teclado, contenido, headings, overflow y capturas; axe se limita a contextos con JS.
- El selector de idioma usa `role=radio`, no button: se corrigió el selector de prueba.
- Lighthouse detectó un nombre accesible del logo que no incluía el texto visible, y el texto de los spans se concatenaba sin espacio. Se corrigieron ambos en `Brand.jsx` y en el shell público; nueva comprobación WCAG 2.1 A y Lighthouse sin ese error.
- Se corrigió el runner Lighthouse para pasar la configuración desktop real, y se registra `formFactor` para no atribuir métricas móviles a escritorio.

Quedan oportunidades de rendimiento del bundle compartido (aprox. 67 KiB de JS no usado en la landing y CSS bloqueante). El nuevo JS gzip pasa de **127.71 kB a 129.34 kB**; CSS de **13.78 kB a 13.90 kB**; HTML indexable ≈**23.49 kB / 5.56 kB gzip**. No se añadieron fuentes, trackers o librerías de runtime. Son tamaños de build, no tráfico orgánico.

## Acciones externas exactas del propietario

1. **Publicación — MANUAL PENDIENTE.** Revisar el diff y la rama de despliegue configurada en Netlify. En Domain management confirmar el dominio primario: si hay uno propio vigente, corroborar su GET 200 y actualizar todas las URLs enumeradas en README antes del build. Publicar mediante el flujo autorizado del proyecto: build `npm run build`, publish `dist`, Node 22. No publicar la raíz del repo ni la carpeta de evidencias.
2. **Paridad después de publicar.** Ejecutar `python3 scripts/audit-seo.py` y `python3 scripts/check-seo.py https://musica-epica-ed.netlify.app/`. Comprobar `/robots.txt` 200 text/plain, `/sitemap.xml` 200 XML y una ruta inexistente 404. El HTML GET debe contener H1, FAQ y schema, además del head. Comparar el head/body público con `dist/index.html` (Netlify puede modificar formato). Abrir la raíz a 390 y 1366 px, probar registro/login/reingreso con cuenta de prueba autorizada.
3. **Previews.** Abrir un deploy preview y un branch deploy autorizados: `curl -I URL_PREVIEW` debe mostrar `X-Robots-Tag: noindex, follow`; su HTML debe incluir noindex. Producción debe conservar index y carecer de ese header. La configuración se probó localmente; no se atribuye este resultado a Netlify remoto.
4. **Facebook / WhatsApp — MANUAL PENDIENTE.** Abrir https://developers.facebook.com/tools/debug/ con cuenta autorizada, introducir la URL raíz canónica, pulsar Debug y **Scrape Again** tras publicar. Revisar URL canónica, título, descripción, imagen exacta y dimensiones; repetir si queda caché antigua. En WhatsApp crear un mensaje nuevo con la raíz canónica y esperar la tarjeta antes de enviarlo. Guardar capturas con fecha. Una tarjeta anterior puede permanecer cacheada; no modificar la URL de imagen para forzarla sin decisión del propietario.
5. **Google Search Console — MANUAL PENDIENTE.** Añadir propiedad **Prefijo de URL** `https://musica-epica-ed.netlify.app/` (el usuario no controla el DNS de `netlify.app`). Elegir archivo HTML de verificación, colocarlo en `public/`, desplegar y verificar su URL. Alternativamente, usar la meta proporcionada por Google en dev.html y comprobarla en GET. En Sitemaps enviar `sitemap.xml`. En Inspección de URLs probar la raíz publicada, revisar HTML rastreado/renderizado, canonical y permisos; solicitar indexación. No enviar hashes. Para un dominio propio controlado puede usarse propiedad Dominio y TXT DNS, solo por el propietario.
6. **Bing Webmaster Tools — MANUAL PENDIENTE.** Añadir el mismo sitio en https://www.bing.com/webmasters/ o importar la propiedad verificada de Search Console. Si se usa BingSiteAuth.xml, incorporarlo en `public/`, desplegar, verificar y enviar el sitemap completo. Usar URL Inspection para `/`.
7. **Datos estructurados — MANUAL PENDIENTE externo.** Probar URL publicada o código de `dist/index.html` en https://validator.schema.org/; comprobar los dos nodos y sus relaciones. En https://search.google.com/test/rich-results no esperar elegibilidad de SoftwareApplication: no hay precio/review/aggregateRating verificables. No añadirlos para eliminar avisos. No se añadió FAQPage ni se promete FAQ rich result.

OAI-SearchBot se permite para descubrimiento solicitado. GPTBot controla entrenamiento, no búsqueda: no se añadió una regla específica ni se cambió su acceso efectivo por defecto. robots no protege datos privados ni puede distinguir hashes; la autorización real sigue en la API. No se conectaron Search Console/Bing, no se solicitó indexación y no se garantizan rankings, tráfico o citas de IA.

## Diff entregado

- Head y schema: `dev.html`.
- Renderer público y Vite: `src/prerender.jsx`, `scripts/public-html-plugin.mjs`, `vite.config.js`.
- FAQ/estilos/traducciones y accesibilidad de marca: `Landing.jsx`, `landing.css`, `translations/es.js`, `translations/en.js`, `Brand.jsx`.
- Rastreo/hosting: `public/robots.txt`, `public/sitemap.xml`, `public/404.html`, `netlify.toml`.
- Build autónomo y comandos: `scripts/build-standalone.mjs`, `.gitignore`, `package.json`, README.
- QA reproducible: scripts SEO, `test/seo.test.js`, plan, esta matriz y evidencias. `source.diff` incluye archivos nuevos de texto además de los cambios rastreados; `regression-checks.json` registra hashes/tamaños de los artefactos y resultados.

**Gate final: PASS local; publicación y validaciones externas pendientes.** El estado del sitio público previo al deploy sigue siendo distinto del artefacto local.
