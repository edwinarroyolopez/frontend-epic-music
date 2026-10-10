# El viaje de una canción · aceptación local

## Fuentes y alcance
- Repositorio: `frontend-epic-music`, `master`; working tree inicial limpio. Backend separado, fuera del diff.
- Skill principal leída íntegramente: https://github.com/elayadesign/ai-design-skills/blob/1c1e97cb9878e236552c772092dda7adcdddbcb2/skills/landing-page-design/SKILL.md
- Skill complementaria leída íntegramente: https://github.com/elayadesign/redesign-skill/blob/64627f6ebe7a7a2f17c0affe4fe5838e2d46a876/skills/redesign-existing-projects/SKILL.md
- Lectura directa, sin instalación redundante. No generador de imágenes autorizado disponible; SVG originales procedurales. Chrome, Playwright, Pillow y FFmpeg disponibles.
- Overrides: paleta vino/dorado y tipografía/iconos del producto; gradientes solo como luz/material dentro del arte; titular 30–48 px; navegación existente; FAQ nativas indexables; sin testimonios ni garantías inventados. Reveal discreto, contenido visible sin JS, sin gran sección tipográfica de relleno.

## Storyboard verificable / Loop 1
Una propuesta: recordar una frase para iniciar un descubrimiento musical. Una conversión: `#/registro`, «Empezar a descubrir» / “Start discovering”.

| Plano | Tiempo | Composición | Movimiento / texto ilustrativo |
|---|---|---|---|
| 01 · Recuerdo | 0–8 s | Escultura de ondas, pequeño núcleo luminoso | Travelling lento; fragmento ficticio |
| 02 · Canción | 8–16 s | Portada de paisaje abstracto y vinilo | Portada avanza, disco gira independientemente; posible canción |
| 03 · Descubrimientos | 16–24 s | Cinco portadas y conexiones orbitales | Paneo contrario al primer plano; recomendaciones ilustrativas |
| 04 · Afinidades | 24–32 s | Órbitas entrelazadas vino, oro y jade | Acercamiento; interpretación, no diagnóstico; análisis de listas próximamente |
| 05 · Archivo | 32–40 s | Portadas en estantería de latón | Composición se asienta; guardar y volver |

Fundidos de 1.6 s. WAAPI para transform/opacity, reloj único; sin dependencias ni audio. Pausa global, visibilidad, IntersectionObserver, reduced motion y ahorro de datos. Desktop: copy fijo a izquierda / ventana cinematográfica a derecha. Móvil: copy y CTA compactos arriba / escena completa debajo; controles fuera del arte. Después: pasos y afinidades en dos capítulos, siete FAQ existentes y cierre de archivo.

Assets: cinco escenas + póster y capas de atmósfera, vinilo y primer plano; todos 1000×700 SVG escalables, manifiesto con bytes y SHA-256. Recorte móvil conserva sujeto central; no letras protegidas ni portadas reales.

## Gates de loops
Cada fila sigue diagnóstico → cambio mínimo → prueba → evidencia → corrección. **FINAL = PASS en los gates locales ejecutados.** Las métricas de campo y los servicios reales no se presentan como verificados.

| Loop | Objetivo / cambio mínimo | Evidencia / criterio | Estado |
|---|---|---|---|
| 0 | Auditar landing, skills, prerender y baseline | 37 tests, lint, build; capturas 1440/390, `evidence/cinema/baseline/` | PASS |
| 1 | Storyboard, copy bilingüe, CTA y técnicas compatibles | Tabla anterior y assets mapeados a planos; preserva `staticView` | PASS |
| 2 | Producir archivos originales reproducibles | `src/assets/cinema/`, generador y manifiesto: 9 SVG, 56880 bytes. Composiciones revisadas en `assets-preview.png` | PASS |
| 3 | Hero autónomo, capas y controles | `LandingCinema.jsx`; `checks.json`, `motion-{1440,390}-{0,3,6,10}s.png` y WEBM. Transformaciones independientes, pausa global y reanudación comprobadas | PASS |
| 4 | Narrativa compacta y enlaces | `Landing.jsx`, `landing.css`, ES/EN; `full-1440.png`, `full-390.png`. CTA constante a registro; siete FAQ conservadas | PASS |
| 5 | Responsive, teclado, preferencias | 36 vistas en `checks.json`: 320×700, 390×844, 768×1024, 1024×768, 1440×900 y 844×390 × ES/EN × dark/light/custom. Axe sin infracciones, sin overflow ni controles superpuestos | PASS |
| 6 | SEO, standalone y performance | `evidence/seo-geo/`, `context-checks.json`: HTTP, `file://`, sin JS, canonical, OG, JSON-LD, robots/sitemap, contextos Netlify. Lighthouse móvil 99/100 | PASS |
| 7 | Regresión / aceptación | `release-checks.json`: 37 tests, lint 0 errores/avisos, Vite, standalone, 8 regresiones SEO, diff --check; browser fixtures de sesión; inventario y SHA-256 | PASS |

## Baseline
Máximo cinco defectos: hero móvil alto; titular grande; un solo recurso dominante; sin secuencia autónoma; espaciado vertical excesivo. Riesgos: conservar SSR estático, datos de sesión fuera de landing, análisis de playlists aún no habilitado, assets en standalone `file://`.

- Tests 37/37; lint 0 errores; Vite PASS.
- Bundle: JS 426641 bytes (gzip 129.34 kB), CSS 76044 bytes (gzip 13.90 kB); HTML 23.72 kB.
- Chrome local sin throttling: 1440 LCP 1996 ms / CLS 0 / altura 2757 px; 390 LCP 1940 ms / CLS 0 / altura 3512 px. No son métricas de campo.
- Lighthouse 12.8.2 local, una ejecución: móvil performance 99, a11y 100, SEO 100, LCP 1658 ms, CLS 0, TBT 0, transferencia 149590 bytes; desktop performance 100, LCP 405 ms. INP de campo no medido.
- Primer intento Lighthouse: dependencia no presente en `epic-seo-tools`; corregido a instalación existente en `epic-ux-tools`, sin instalar paquetes.

## Evidencias finales
- Visor local: [evidence/cinema/index.html](evidence/cinema/index.html).
- Grabaciones **reales del navegador**, sin audio: [escritorio](evidence/cinema/motion-1440.webm), [móvil](evidence/cinema/motion-390.webm). Incluyen autoplay, pausa/reanudación y selección de planos. La web utiliza **animación cinematográfica de capas SVG**, no vídeo generado por IA ni un clip descargado.
- Secuencias con tiempo relativo y matrices de transformación: `evidence/cinema/checks.json`. Las capturas se toman con animación activa, no con `animations: disabled`.
- Respaldo: `nojs.png`, `failedImage.png`, `saveData.png`, `slowDevice.png`; pausa: `paused-390.png`, `paused-1440.png`; preferencias: capturas `{390,1440}-{es,en}-{dark,light,custom}.png`.
- `context-checks.json`: pestaña real en segundo plano (`document.hidden=true`), todos los relojes congelados; retorno conserva pausa manual; cambio de reduced motion en caliente; todas las imágenes del standalone cargan por `file://`.
- `release-checks.json`: stdout/stderr de los comandos ejecutados, comprobación de archivos protegidos y hashes de assets.
- Inventario exacto de código, arte y evidencia: `evidence/cinema/changed-files.json`. Integridad: `evidence/cinema/SHA256SUMS`. Manifest original: `src/assets/cinema/manifest.json` (dimensiones, bytes, método, procedencia y derechos; sin licencias de terceros).

## Comparativa medida
Lighthouse 12.8.2, una ejecución local por versión/perfil; simulación móvil de Lighthouse, mismo equipo. No es CWV de campo. El LCP sin throttling de las capturas no se confunde con esta prueba.

| Medición | Baseline | Final |
|---|---:|---:|
| Lighthouse móvil: rendimiento / accesibilidad / SEO | 99 / 100 / 100 | 99 / 100 / 100 |
| LCP móvil simulado | 1658 ms | 1888 ms |
| CLS móvil | 0 | 0.000056 |
| TBT móvil | 0 ms | 0 ms |
| LCP desktop | 405 ms | 446 ms |
| Transferencia total observada por Lighthouse | 149590 B | 163912 B |
| JS Vite sin gzip | 426.64 kB | 443.02 kB |
| JS Vite gzip | 129.34 kB | 133.56 kB |
| CSS Vite sin gzip | 76.04 kB | 69.01 kB |
| CSS Vite gzip | 13.90 kB | 12.35 kB |
| HTML público Vite | 23.72 kB | 38.20 kB |
| Arte original nuevo, fuente SVG total | — | 56.88 kB |
| Altura ES, 390 px de ancho | 3512 px | 3415 px |
| Altura ES, 1440 px de ancho | 2757 px | 2614 px |

La transferencia crece unos 14 KiB (+9.6%) para incorporar cinco planos; no hay dependencias nuevas. El CSS disminuye. El póster visible carga temprano y React emite su preload; los assets inferiores usan lazy loading. SVG escala sin requerir variantes raster. El standalone pesa 754 KiB sin compresión al incrustar HTML, JS, CSS y SVG para uso sin archivos vecinos; Netlify sigue sirviendo el build cacheable de `dist/`.

## Correcciones verificadas durante los loops
1. Pausa: la primera aserción capturaba el frame pendiente de WAAPI y transiciones de controles. Se fijó explícitamente el mismo `currentTime` en las 18 animaciones del hero y se espera la confirmación de pausa antes de comparar; imagen y relojes quedan idénticos durante la espera. Microinteracciones de foco/botones no son parte de la película.
2. Compactación: primera iteración móvil tenía 3679 px de altura. Se redujeron copy redundante, titular, huecos e ilustraciones secundarias; resultado 3415 px, con escena y controles completos dentro de 390×844.
3. Standalone: el primer inliner cubría `./assets/...` pero Vite emitía también URLs relativas al módulo. El test real `file://` detectó SVG ausentes. `build-standalone.mjs` ahora incrusta ambas referencias; prueba corregida PASS con imágenes completas.
4. Segundo plano: Playwright simula páginas siempre activas. Los primeros intentos no producían `document.hidden`; se cambió el harness a Chrome con Xvfb y CDP `noDefaults`, sin modificar el producto para fingir visibilidad. La prueba real ahora pasa.
5. Preferencias: reduced motion cancela también reveals inferiores ya iniciados; modo estático explica el estado del control. Ahorro de datos y hardware limitado mantienen composición estática seleccionable.

## Contenido y alcance preservados
- Se sustituyó la tarjeta/vinilo único por cinco planos. Se eliminó la franja redundante de valores y el acordeón de beneficios: sus tres explicaciones quedan visibles sin interacción. Se añadió el capítulo de afinidades con disponibilidad real. Se compactaron las FAQ en dos columnas en desktop, manteniendo las siete preguntas y respuestas exactas en ES/EN.
- Registro, login, workspace autenticado, recarga de sesión, logout y cinco guardas privadas pasan en el harness existente con **respuestas Auth sintéticas**. No se usaron cuentas ni credenciales reales.
- `dev.html`, `src/prerender.jsx`, canonical, robots/sitemap, JSON-LD y Cloudinary permanecen intactos. El cargador de `public-html-plugin.mjs` y la caché de Vite se ajustaron posteriormente para corregir el runtime de desarrollo (véase diagnóstico al final), conservando el contrato de HTML público. OG/Twitter conservan el JPEG optimizado existente; JSON-LD conserva exactamente `https://res.cloudinary.com/qbrotguz/image/upload/v1791588468/musica-epica-descrubre-tu-cancion.png`.
- Auth, contextos, servicios, hooks, rutas privadas, temas globales, package/lockfile, tests existentes y configuración Netlify sin diff. Solo cambia el namespace `landing` en las traducciones. Backend, privacidad y contratos sin cambios.
- Landing visitante: cero peticiones externas registradas; sin servicios IA, catálogos ni datos privados para animar. Cero errores de consola/red en las suites normales; el fallo de imagen se induce y verifica separadamente.

## Comandos reproducibles
```sh
node scripts/generate-cinema-assets.mjs
npm test
npm run lint
npm run test:seo
PW_MODULE=/tmp/opencode/epic-seo-tools/node_modules/playwright-core/index.mjs AXE_PATH=/tmp/opencode/epic-ux-tools/node_modules/axe-core/axe.min.js node scripts/check-cinema.mjs
PW_MODULE=/tmp/opencode/epic-seo-tools/node_modules/playwright-core/index.mjs AXE_PATH=/tmp/opencode/epic-ux-tools/node_modules/axe-core/axe.min.js npm run test:seo:browser
PW_MODULE=/tmp/opencode/epic-seo-tools/node_modules/playwright-core/index.mjs CHROME_LAUNCHER_MODULE=/tmp/opencode/epic-ux-tools/node_modules/chrome-launcher/dist/index.js xvfb-run -a node scripts/check-cinema-contexts.mjs
node scripts/check-seo-contexts.mjs
PW_MODULE=/tmp/opencode/epic-seo-tools/node_modules/playwright-core/index.mjs node scripts/check-scene-coherence.mjs
PW_MODULE=/tmp/opencode/epic-seo-tools/node_modules/playwright-core/index.mjs node scripts/check-product-regressions.mjs
QA_BASE_URL=http://localhost:3000/ PW_MODULE=/tmp/opencode/epic-seo-tools/node_modules/playwright-core/index.mjs node scripts/check-product-regressions.mjs
QA_BASE_URL=http://localhost:3000/ PW_MODULE=/tmp/opencode/epic-seo-tools/node_modules/playwright-core/index.mjs node scripts/check-dev-runtime.mjs
LH_MODULE=/tmp/opencode/epic-ux-tools/node_modules/lighthouse/core/index.js CHROME_LAUNCHER_MODULE=/tmp/opencode/epic-ux-tools/node_modules/chrome-launcher/dist/index.js node scripts/check-seo-performance.mjs
node scripts/verify-cinema-release.mjs
git diff --check
```
Las rutas externas apuntan a herramientas QA ya instaladas en este entorno; en otro equipo se sustituyen por sus rutas locales. No son dependencias de la app. `verify-cinema-release.mjs --inventory-only` refresca inventario/hashes sin repetir tests.

## Límites / próximos pasos
No hay fallos locales pendientes en los gates ejecutados. INP y CWV de campo **NO VERIFICADOS**: requieren tráfico y red representativos después de una publicación autorizada. TBT no se reporta como INP. Zoom comprobado con magnificación CSS del 200%, no con dispositivos físicos. Chromium comprobado; Safari/Firefox y hardware móvil real no se midieron. Los temas custom se probaron con una paleta sintética concreta, no todas las combinaciones de colores posibles.

E2E de backend real **NO APLICA a este diff**; los flujos frontend usan fixtures sin llamadas pagadas. No se publicó, no se subieron imágenes a Cloudinary ni se cambiaron servicios de producción. No se generó un clip de vídeo como asset de la web: los WEBM entregados son grabaciones de QA de la animación funcionando.

## Reverificación solicitada: producto y coherencia de las cinco escenas

**PASS local**, con evidencia nueva y ejecución posterior a la corrección:

| Grupo | Comprobación ejecutada | Evidencia |
|---|---|---|
| Registro | Campos obligatorios, contraseña corta, cuenta duplicada (409), alta válida y acceso al workspace | `product-regressions.json` |
| Login y sesión | Contraseña incorrecta (401), login válido, retorno a ruta privada solicitada, recarga, logout y token caducado | `product-regressions.json` |
| Descubrimiento | Búsqueda → 11 recomendaciones → letra ficticia y emociones → selección de 12 canciones → guardado sin letras en payload | `product-regressions.json`, `regression-{390,1440}-search.png` |
| Playlists | Listado, detalle, edición, reordenación, quitar canción y eliminar playlist | `regression-{390,1440}-playlist.png` |
| Historial | Listado, resultado guardado, detalle y eliminación | `regression-{390,1440}-history.png` |
| Perfil / cuenta / ajustes | Edición local de perfil según contrato existente, datos de cuenta, historial de análisis vacío; idioma y tema persistidos; nuevo análisis sigue deshabilitado | `product-regressions.json` |
| Imagen / selector / copy | 5 escenas × 2 idiomas × 2 anchos × 3 modos = 60 verificaciones. Se compara el SVG realmente cargado con el original, título, opacidad y selector. Flechas circulares verificadas | `scene-coherence.json` |
| Respaldo individual | Una imagen fallida no sustituye todas por el póster de recuerdo; escena afectada usa icono y título propios con aviso; otras cuatro siguen seleccionables | `coherent-fallback-390.png`, `scene-coherence.json` |

Los 11 grupos de recorrido del producto se ejecutaron a 390 y 1440 px. Todas las peticiones API fueron interceptadas por fixtures en memoria; peticiones inesperadas y excepciones de runtime: cero. Los 401/409 inducidos son casos negativos esperados registrados explícitamente, no errores ocultos. Esto verifica el frontend y sus contratos, **no la disponibilidad del backend desplegado ni autenticación real contra MongoDB**.

Corrección acotada a `LandingCinema.jsx`, CSS y copy ES/EN: una sola definición asocia cada escena con su imagen y respaldo; controles con `aria-controls` y nombre de escena; fallos de carga aislados por imagen. No se modificó Auth ni ninguna página privada. La primera ejecución del harness ampliado seleccionó un nombre de perfil oculto en la cabecera móvil; se acotó el selector al perfil visible y volvió a ejecutarse completa, sin cambiar el producto para pasar el test.

Se repitieron además: 37 tests unitarios, lint sin avisos/errores, Vite/standalone, 8 regresiones SEO, 15 vistas SEO/browser, 36 combinaciones responsive/a11y, pausa y pestaña real, `file://`, Lighthouse y `git diff --check`. Los hashes e inventario se regeneran con estas evidencias.

## Error real de desarrollo: `_jsxDEV is not a function`

**Reproducido y corregido en el servidor existente `http://localhost:3000/`.**

- Antes: `#/login` mantenía la landing estática; `loginVisible=false`, botones prerenderizados deshabilitados. `main.jsx` llamaba a `_jsxDEV`, pero el módulo optimizado servido contenía `react-jsx-dev-runtime.production` y `exports.jsxDEV = void 0`. Evidencia: `dev-runtime-before.json` y `dev-runtime-before.png`.
- Causa: distintos servidores/procesos de Vite compartían la caché de optimización del cliente. Un runtime React de producción podía reemplazar el que esperaba el servidor de desarrollo. El prerender también creaba un servidor cliente adicional por petición sobre la misma caché.
- Corrección: `vite.config.js` separa cachés por modo y `NODE_ENV`; `public-html-plugin.mjs` reutiliza el cargador SSR del servidor de desarrollo y reserva para build un cargador aislado, sin descubrimiento/optimización de dependencias del cliente. No cambia Auth ni el routing.
- Regresión nueva: `check-dev-runtime.mjs` comprueba que `jsxDEV` sigue siendo una función y que login/escenas responden antes y después de arrancar un optimizador de producción, generar un build y hacer seis prerenders concurrentes. **PASS, cero errores de consola**, usando el servidor real del usuario. Evidencia: `dev-runtime-checks.json`, `dev-runtime-login-fixed.png`.
- Los 11 grupos funcionales × 2 tamaños del harness ampliado también se ejecutaron sobre **`localhost:3000`**, además del build preview: `product-dev-regressions.json`. Las respuestas de escritura/autenticación de esos recorridos siguen siendo sintéticas.
- Comprobación adicional real, solo lectura a través del proxy local: `/api/health` respondió HTTP 200 y `success=true`; `/api/auth/providers` respondió HTTP 200 y `email=true`. No se creó una cuenta real ni se enviaron credenciales. Evidencia: `public-api-health.json`.
- Los tests previos del build no cubrían esta contaminación entre procesos de optimización y desarrollo; por eso podían pasar mientras la pestaña del usuario conservaba el prerender inerte. El nuevo gate cubre expresamente ese caso y forma parte de `verify-cinema-release.mjs`.

Después de la corrección volvieron a pasar los 37 tests, lint, build, standalone, SEO/HTML en desarrollo, y los tres contextos Netlify. Una recarga completa del navegador descarta cualquier módulo antiguo retenido por la pestaña.
