# Plan SEO / GEO — 2026-10-09

## Auditoría inicial (loop 0)

Repositorio Git real: `frontend-epic-music/`, limpio al inicio. Backend separado, solo inspección.
Evidencia reproducible: `python3 scripts/audit-seo.py` → `evidence/seo-geo/public-http.json` y HTML originales.

| Prioridad | Hallazgo / impacto | Evidencia | Cambio mínimo / aceptación |
|---|---|---|---|
| P0 | HTML público vacío: exige JS para comprender el producto | `dev.html:16`; GET producción 829 bytes, `<div id="root"></div>` | Pre-render público de Landing; H1/texto y CTA en GET sin JS |
| P0 | Sin canonical, OG, Twitter | `dev.html`, `production.html` | Head estático único; igualdad semántica en dist/autónomo/HTTP |
| P0 | robots y sitemap devuelven 404 | `public/` solo favicon; auditoría HTTP | Archivos públicos con solo `/`, MIME y XML comprobados |
| P0 | Host documentado responde 200 sin redirección | README:101; HEAD/GET Netlify | Canonical `https://musica-epica-ed.netlify.app/`. No hay dominio propio corroborado; revisar Domain management al publicar |
| P0 | Imagen social válida, relativamente pesada | GET/HEAD 200 PNG; bytes IHDR 1731×909, 1.9043:1, 1,929,146 bytes | URL exacta y dimensiones reales; solo head, sin descarga visible |
| P1 | Sin JSON-LD ni respuestas sobre límites reales | Landing, traducciones, provider gate backend | WebSite/WebApplication sin ratings/ofertas; FAQ visible sin prometer rich results |
| P1 | Standalone elige cualquier HTML y sobrescribe dist/index | `scripts/build-standalone.mjs:26,82`; no está en npm build | Elegir index explícitamente; conservar metadatos y validar ambos modos |
| P1 | Previews sin política local explícita | `netlify.toml` | `CONTEXT` controla noindex + X-Robots-Tag solo previews |
| P2 | ES/EN por localStorage, sin URLs por idioma | PreferencesContext, traducciones | Conservar preferencia/lang; sin hreflang ficticio |

La navegación es hash y las páginas privadas no se montan sin sesión (`App.jsx:32,100`). No se migran rutas ni se toca autorización. El gate del backend confirma Spotify sin lectura y sin análisis; YouTube tiene preview condicionado a configuración, sin importación ni análisis IA. No se ha confirmado su configuración en producción.

Hallazgo adicional al verificar UX: `Home.jsx:22`, `Playlists.jsx:61` y `PlaylistAnalysisHistory.jsx:33` deshabilitan crear análisis y muestran «Próximamente»; `PlaylistPersonality.jsx` no está montado. La FAQ debe empezar por esta indisponibilidad (incluida la entrada de enlaces), aunque exista soporte en backend. JSON-LD anuncia solo descubrimiento y guardado actuales. La imagen social obligatoria contiene una ilustración de análisis; conservarla por instrucción, con este desfase editorial documentado.

Verificación posterior de QA en producción: el GET público `/playlist-personality/providers` confirmó Spotify y YouTube sin configurar, sin importación ni análisis IA. Ver `evidence/seo-geo/api-boundaries.json`; no se llamó a proveedores ni a endpoints de generación.

## Loops y gates

1. **Head**: etiquetas estáticas en dev.html; build + standalone + inspección automatizada y HTTP.
2. **HTML público**: render estático de Landing en compilación y desarrollo con React/Vite existentes; createRoot reemplaza el shell. Nunca renderizar App, sesiones o respuestas API. Gate: no-JS y navegador con JS, sin H1 duplicado.
3. **Rastreo**: robots/sitemap de public, 404 real, previews noindex. Gate: parseo XML, GET/MIME y contextos producción/preview.
4. **Schema**: WebSite y WebApplication enlazados. Gate: JSON desde HTTP y propiedades verificables; rich result de software no prometido (faltan reseñas/precios sustentados).
5. **GEO**: FAQ ES/EN compacta y reutilizada en HTML inicial; inferencias, cuenta, letras y límites de proveedores. Gate: equivalencia con texto visible, lectura teclado.
6. **Calidad**: build/lint/tests; tamaños, idioma, consola, viewport 320/390/768/1366/1440; autenticación con API simulada claramente identificada.
7. **Entrega**: matriz de evidencias, snapshots HTTP, diff/check; instrucciones exactas de publicación y validadores externos.

## Fuentes oficiales revisadas antes de implementar

- [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): pre-render útil también para bots sin JS; canonical HTML y códigos HTTP reales.
- [Guía para desarrolladores](https://developers.google.com/search/docs/fundamentals/get-started-developers): enlaces HTML, texto útil y sitemap; robots no es autorización.
- [Software](https://developers.google.com/search/docs/appearance/structured-data/software-app): rich result requiere precio y review/aggregateRating; no inventarlos.
- [FAQ](https://developers.google.com/search/blog/2023/08/howto-faq-changes): rich results limitados a sitios gubernamentales/sanitarios autorizados.
- [OpenAI bots](https://developers.openai.com/api/docs/bots): OAI-SearchBot descubrimiento; GPTBot entrenamiento, políticas independientes. Mantener acceso por defecto a GPTBot, sin nueva decisión de entrenamiento.
- [OGP](https://ogp.me/): propiedades en head, imagen/alt/dimensiones verificadas.
- [Netlify routing](https://docs.netlify.com/manage/routing/redirects/redirect-options/): 404.html y ausencia de catch-all 200.
- [Netlify entorno](https://docs.netlify.com/build/configure-builds/environment-variables/): CONTEXT production/deploy-preview/branch-deploy; URL y DEPLOY_PRIME_URL son distintos.
- [Schema.org WebApplication](https://schema.org/WebApplication): metadatos descriptivos de aplicación web.

## Intenciones editoriales (hipótesis, sin volúmenes ni rankings)

| Consultas | Intención / competencia estimada sin estudio SERP | Uso |
|---|---|---|
| buscar canción por letra; encontrar canción con fragmento; no recuerdo el nombre | Resolver identificación; competencia presumiblemente alta por catálogos/buscadores establecidos | Title, descripción, respuesta práctica |
| descubrir canciones similares; descubrir música con IA | Exploración; alta presumible por servicios musicales | Landing y FAQ, aclarar inferencias |
| analizar playlist musical / gustos; playlist y emociones | Informativa/exploratoria; competencia no medida, mezcla con psicología | FAQ sobre interpretación, letras y límites, sin diagnóstico |

No añadir llms.txt: por ahora duplicaría la landing. Es convención emergente, no requisito ni garantía de citación. Una futura `/en/` necesita HTML inglés propio, canonical y verificación HTTP antes de hreflang.
