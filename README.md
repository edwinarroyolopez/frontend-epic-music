# MUSICA EPICA - Frontend

Frontend independiente en React (Vite) de la aplicación de recomendación musical.
Se ejecuta en **http://localhost:3000** y consume una API que se levanta por
separado en **http://localhost:7000**.

## Puesta en marcha

### Entrada pública y acceso

- Sin sesión, `#/` muestra `Landing.jsx`: portada editorial con vinilo ilustrado,
  vista previa interactiva de recordar/descubrir/guardar y explicación desplegable.
  Es una demostración visual local: no consulta música, historial ni playlists.
- `#/registro` abre directamente el registro; `#/login`, el acceso con correo.
  `#/ajustes` sigue disponible para tema e idioma antes de iniciar sesión.
- La búsqueda, historial (incluidos detalles y análisis), playlists, perfil y cuenta
  requieren sesión real. Las vistas privadas no se montan durante la restauración
  ni al entrar sin credenciales; las rutas directas llevan al login y conservan
  el destino durante ese flujo. Cerrar sesión regresa a la landing.
- No hay entrada demo. Datos demo de versiones anteriores en localStorage no
  autorizan el acceso. El hook de búsqueda también bloquea solicitudes sin sesión.
- Se conserva la paleta existente en oscuro, claro y personalizado, y ES/EN.
  La animación del vinilo se puede pausar; `prefers-reduced-motion` desactiva el
  movimiento. La vista previa no reproduce audio ni realiza búsquedas.

### Desarrollo local

Requiere Node.js 22.12+ (o 20.19+) y npm. Desde este repositorio:

```bash
npm ci
npm run dev
```

Abre **http://localhost:3000**. El frontend arranca incluso si la API está
apagada; las funcionalidades que necesitan datos requieren que el backend esté
disponible. Todos los scripts y dependencias necesarios están en este proyecto.

Vite mantiene el puerto 3000: si está ocupado, el comando falla en lugar de
elegir otro puerto automáticamente. `npm run dev:front` es un alias de `npm run dev`.

El navegador llama directamente a `VITE_API_URL` (por defecto localhost:7000).
Express permite el origen local de Vite mediante CORS. Reinicia Vite al cambiar
la configuración. El proxy `/api` existente es opcional; el cliente no lo usa por defecto.

### Build y vista previa

```bash
npm run build     # genera dist/index.html, dist/dev.html y los assets
npm run lint      # oxlint
npm run preview   # abre http://localhost:3000/
```

Para generar además el `index.html` autónomo, ejecuta después del build:

```bash
node scripts/build-standalone.mjs
```

Ese archivo contiene HTML, CSS y JavaScript en un solo archivo y se puede abrir
con doble clic o *Open with Live Server*.

El build (incluida la vista previa) llama directamente a `VITE_API_URL`, por
defecto `http://localhost:7000`. La API debe permitir el origen del frontend
mediante CORS. Para publicar el frontend, define la URL pública de la API antes
de ejecutar `npm run build`.

## Entrada HTML y archivos generados

| Archivo | Qué es |
| --- | --- |
| `dev.html` | Archivo fuente requerido por Vite para desarrollo y build. Se versiona y no se genera al compilar. El servidor de desarrollo lo sirve en `/` y en `/dev.html`. |
| `index.html` | Build autónomo opcional generado; no editar a mano. Lo genera `node scripts/build-standalone.mjs` después de compilar, incrustando CSS y JS dentro del HTML. |
| `dist/index.html` | Entrada estática generada automáticamente por Vite. Permite abrir `/` en Netlify sin ejecutar el generador standalone. |
| `dist/` | Salida generada por `npm run build`. |

El código de la aplicación está en `src/` y su entrada HTML es `dev.html`.
Conserva `dev.html` al limpiar archivos generados: sin él, Vite falla con
`UNRESOLVED_ENTRY: Cannot resolve entry module dev.html`.

## Producción: Netlify + Railway

`netlify.toml` configura automáticamente:

- **Build command:** `npm run build`
- **Publish directory:** `dist` (su contenido, no la carpeta del repositorio)
- **Node:** 22
- **VITE_API_URL:** `https://backend-epic-music-production.up.railway.app`
- **VITE_API_TIMEOUT:** `20000`; **VITE_AI_TIMEOUT:** `240000`

Con el repositorio independiente del frontend, Base directory debe quedar vacía
(raíz del repo). Si Netlify se conecta a una raíz que contiene ambos proyectos,
configurar Base directory `frontend-epic-music` para localizar este archivo.
No configurar Publish directory como `.`: la raíz pública necesita `dist/index.html`.

Los valores de netlify.toml prevalecen sobre los equivalentes de la UI. La URL
del backend es pública, no un secreto. No definir credenciales de Gemini, JWT o
Mongo como variables VITE: esas pertenecen exclusivamente a Railway.

El cliente llama directamente a Railway por HTTPS, incluyendo consultas IA largas.
El backend permite CORS para `https://musica-epica-ed.netlify.app` y sus URLs
`https://<deploy-o-rama>--musica-epica-ed.netlify.app`. Los dominios propios se
pueden añadir a `CORS_ORIGINS` en Railway (lista de orígenes exactos separados por coma).
Las rutas son hash (`/#/playlists`), por lo que no necesitan un rewrite SPA global.

Para aplicar cambios, publicar el backend con CORS actualizado y reconstruir el
frontend en Netlify desde estos archivos. No basta con reabrir un deploy antiguo.
El navegador debe cargar `/` y hacer requests a Railway, nunca a localhost.
Comprobar `GET /health` y el preflight OPTIONS desde el origen del frontend.
`GET /auth/providers` ya no agrega Content-Type JSON sin cuerpo, por lo que no
provoca un preflight innecesario. Login y llamadas con JWT conservan las cabeceras
necesarias. Si la respuesta es un 502 del gateway sin cabeceras CORS, el navegador
puede etiquetarla como “CORS error” aunque el dominio esté en la allowlist.
Si Railway responde **502 Application failed to respond**, revisar sus logs de
arranque, `npm start`, conexión Mongo, variables privadas y el puerto de destino
(Express usa `PORT` de Railway). Ese 502 debe resolverse en Railway.

## Estructura

```text
frontend-epic-music/
├── index.html                 build autónomo (se abre en el navegador)
├── dev.html                   entrada de Vite
├── scripts/
│   └── build-standalone.mjs   genera index.html incrustando el build
└── src/
    ├── main.jsx               punto de entrada (contextos + error boundary)
    ├── App.jsx                rutas, cabecera, resultado y selección en memoria
    ├── components/            Header, ProfileMenu, Avatar, Cover, Brand, BrandIcons,
    │                          SearchBar, SearchResults, SelectedSong, SongCard,
    │                          RecommendationList, ThemeSelector, LanguageSelector,
    │                          CustomThemeEditor, StateMessage, ErrorBoundary, Footer
    ├── pages/                 Home, SearchHistory, Playlists, Profile, Account, Settings, Login
    ├── context/               PreferencesContext (idiema/tema), UserContext (sesion)
    ├── hooks/                 useHashRoute, useSongSearch, useSearchHistory, usePlaylists,
    │                          useLocalStorage
    ├── services/              api.js, search-history.js, playlists.js, auth.js, config.js
    ├── translations/          es.js, en.js, index.js
    ├── themes/                tokens.css, dark.css, light.css, custom.css
    ├── styles/                global.css, layout.css, discover.css, pages.css
    └── utils/                 format.js, color.js
```

## Decisiones de diseño

* **Router por hash** (`useHashRoute`): evita añadir una dependencia de
  enrutado; el botón atrás y los enlaces `#/perfil` siguen funcionando.
* **Sin emojis en la interfaz**: todos los iconos son de `lucide-react`
  (las marcas Google/Spotify/Apple son SVG propios en `BrandIcons.jsx`).
* **Temas por variables CSS**: los componentes nunca escriben colores de tema.
  `dark.css`, `light.css` y `custom.css` definen `--color-*`; en el tema
  personalizado los colores elegidos se inyectan como variables inline en
  `<html>` y el resto se deriva con `color-mix()`.
* **Estados explícitos**: `idle | loading | ready | empty | error` en búsqueda
  y recomendaciones, iguales a los que devolverá la API real.
* **Resultado y selección viven en `App`**: se conservan al abrir login y volver.
  Una nueva búsqueda limpia ambos. No se persisten letras ni selección en storage.
* **Internacionalización**: todo el texto sale de `translations/`, con
  interpolación `{nombre}` y plurales (`clave` / `clave_other`).

## Conexión con el backend

`src/services/api.js` gestiona descubrimiento, health y las llamadas del módulo
`playlists.js`. `auth.js` mantiene signup/login/me. Los componentes no llaman fetch.

El formulario envía **solo al pulsar buscar** `POST /search-songs` con
`{lyrics,artist?,genre?,searchId}` (UUID por acción). Adjunta JWT si hay sesión real.
Consume `{success:true,data:{found,song,recommendations,...}}`.
Una identificación completa contiene origen y 11 recomendaciones; found:false
no crea tarjetas. Se muestran únicamente metadatos recibidos, sin porcentajes ni
IDs de catálogo. La IA puede equivocarse: toda sugerencia se indica no verificada.

`#/playlists` y `#/playlists/:id` requieren sesión real. Permiten crear vacías,
ver detalle, editar nombre/descripción, quitar, mover y eliminar con confirmación.
Desde resultados se selecciona origen/recomendaciones y se crea una playlist
poblada en una sola petición, o se añade a una existente. Conteos añadido/omitido
proceden del backend. Demo e invitados no hacen peticiones privadas.

Contratos completos y límites: `../ai/02_CONTRACTS.md`. Mongo conserva el orden,
deduplica título+artista y aísla por propietario JWT. Nunca almacena letras.

### Autocompletado y resolución de pistas

`ArtistCombobox` consulta el directorio global público con debounce250ms y
AbortController, sin llamar a IA. Flechas/Enter/Escape/Tab, listbox/active-descendant,
foco y mouse/touch. Si no hay sugerencias o falla la red, se puede seguir escribiendo.
`InputResolution` muestra correcciones aplicadas y candidatos ambiguos seleccionables;
elegir una pista no reenvía automáticamente la búsqueda. ES/EN y variables de tema.

Después de cada búsqueda identificada con guardado de artista confirmado, el
autocompletado invalida su respuesta anterior y consulta de nuevo la misma cadena:
un «sin sugerencias» anterior no oculta al artista recién guardado. Al recuperar
el foco también revalida, para ver artistas añadidos por otros visitantes.
Seleccionar una opción permite usar el nombre canónico sin lanzar IA. Si falla
el guardado del artista, se muestra un aviso explícito junto al resultado musical.

### Canciones, letras y componentes compartidos

- `SongLinks.jsx`: YouTube, Spotify y Apple Music en todas las tarjetas (origen,
  recomendaciones y canciones guardadas). Son búsquedas codificadas por título y
  artista; destinos derivados localmente, pestaña nueva con noopener/noreferrer.
- `LyricsPanel.jsx`: «Ver letra completa» en canción identificada, también en su
  ficha guardada. Resuelve por `songId` global (legacy por título/artista/edición).
  `services/lyrics.js` comparte requests y cache en memoria (100 claves como máximo);
  reapertura, idioma/tema y navegación reutilizan detalle sin GET si ya existe.
  Refresh/nueva pestaña lee el backend; Mongo coordina trabajos y análisis.
  Estados ES/EN: nunca consultada, pendiente, encontrada, no encontrada, instrumental,
  error temporal y rights_restricted. La falta de permiso para guardar texto LRCLIB
  ya no oculta un resultado encontrado: lyricsStorage=transient muestra letra y
  emociones y explica la entrega temporal. El servidor conserva ese cuerpo sólo
  en memoria acotada (5min/100 canciones); Mongo guarda metadata/hash/análisis.
  Tras expirar/reiniciar/otra instancia puede ser necesaria otra descarga, pero
  el análisis del mismo contenido se reutiliza. Los registros LRCLIB antiguos
  rights_restricted se recuperan al abrir, sin refetch manual obligatorio.
  Cerrar cancela sólo el visor; guard de identidad/sesión descarta respuestas viejas.
  Polling acotado a6 GET cuando hay202, luego permite comprobación manual.
  Nunca copia letras a localStorage, playlists o historial. La excepción histórica
  de persistencia es exclusivamente Song del backend con procedencia autorizada.
  «Volver a buscar letra y emociones» permite recuperar una consulta nunca iniciada,
  fallida, no encontrada o restringida. Omite la caché en memoria sólo por esa acción;
  envía `refetchLyrics=true` una vez, y el polling posterior es lectura ordinaria.
  Un contador muestra cuándo se puede reintentar (cooldown servidor30s para
  not_found/rights_restricted). Se reevalúa la procedencia sin eludir derechos.
- `SongLyricsModal.jsx`: al pulsar una recomendación (tarjeta o título), consulta
  automáticamente su letra. Funciona también con canciones recomendadas guardadas;
  Enter/Space abre, Escape cierra y restaura foco. Los checks y enlaces tienen
  acciones independientes. Modal soporta capas anidadas de preview→letra.
- `EmotionMetrics.jsx`: el mismo GET devuelve letra+3 emociones, mostradas con
  barras accesibles y porcentajes relativos (suma100), estimados por IA sobre texto,
  no audio. Fallo de análisis no oculta letra y retry envía `analysisOnly=true`,
  respeta el cooldown del backend y reutiliza letra guardada o temporal en memoria.
  Si el cuerpo transitorio caducó, el servidor necesita recuperarlo. Sin evidencia
  suficiente no se muestran métricas inventadas. Muestreo de letras largas indicado.
  `VITE_LYRICS_TIMEOUT` permite configurar la espera del request (default25000ms).
- `DataTable.jsx`: misma tabla en Historial y Mis playlists; filtro que tolera
  tildes, orden por columnas, conteo, fechas localizadas y acciones Eye/Trash2.
  En historial se filtran/ordenan solo las entradas cargadas; se mantiene Cargar más.
  En móvil las filas se adaptan con etiquetas y botones accesibles.
- `Modal.jsx`: base común para preview/edición/confirmación, portal, fondo inert,
  foco inicial/trampa/restauración, Escape, scroll interno y ancho de preview.
- `ConfirmDeleteModal.jsx`: confirmación reutilizada para playlist, canción de
  playlist e historial (local o cuenta). Cancelar no borra; doble clic no duplica
  operaciones; errores dejan el modal abierto para reintentar.
- Los ojos abren previews sin cambiar ruta o selección. Se conservan enlaces al
  detalle completo. Cambiar sesión desmonta previews y elimina datos privados.

Ver `../ai/MUSIC_DETAILS_TABLES_EVIDENCE.md` para verificación de navegador,
privacidad y regresiones.

### Historial

`#/historial` y `#/historial/:id` permiten listar con paginación, actualizar, ver
snapshot completo (origen + recomendaciones) y eliminar entradas. Ver un resultado
histórico no llama a IA ni sustituye la búsqueda/selección actual en App.

- En el detalle de una búsqueda, cada tarjeta permite **Añadir a playlist**.
  Las casillas y **Guardar selección** reúnen origen y recomendaciones en una
  playlist nueva o existente. La tabla del historial permite consultar y eliminar
  búsquedas; la selección y el guardado se realizan en su detalle.
- **Volver a identificar**, en el origen de la búsqueda y del historial, contrasta
  el fragmento con letras de LRCLIB antes de corregir título/artista. La corrección
  actualiza la referencia usada por enlaces, letras, guardado e historial. Si la
  letra está abierta, se vuelve a consultar con la identidad corregida.
- El fragmento se reutiliza desde memoria (hasta 20 búsquedas de la sesión), nunca
  desde almacenamiento persistente. Tras recargar o abrir un historial antiguo se
  pide pegarlo de nuevo. Una coincidencia no confirmada conserva el título anterior;
  un fallo de guardado se informa aunque la corrección esté visible en pantalla.

- Cuenta real: GET/DELETE `/search-history`, JWT y Mongo privado; nunca se copia
  al historial invitado. Cambiar/cerrar sesión desmonta la vista y cancela lecturas;
  resultados privados en memoria y formulario se limpian al cambiar identidad.
- Cuenta: hasta200 entradas completadas y90 días, con metadatos permitidos,
  sin letra, digest, JWT ni credenciales en el historial. El adaptador de historial
  invitado permanece para compatibilidad con datos antiguos, pero las rutas ya no
  lo exponen ni generan nuevas búsquedas de invitado.
- Historial muestra found/not_found/error. Una búsqueda autenticada ya aceptada
  puede terminar en el servidor después de cancelar en el navegador.
- El doble envío se bloquea en memoria; UUID deduplica retry autenticado en Mongo
  y las entradas locales. No hay retry automático de llamadas IA.
- Fallo de Mongo o almacenamiento local muestra aviso explícito; resultado musical
  y11 recomendaciones siguen consultables en la búsqueda actual.

Contrato: `../ai/SEARCH_INTELLIGENCE_MASTER_PLAN.md`; pruebas y aceptación local:
`../ai/SEARCH_INTELLIGENCE_EVIDENCE.md` (complementan los documentos anteriores).

Configuración opcional (`.env`; estos son los valores por defecto):

```text
VITE_API_URL=http://localhost:7000
VITE_API_TIMEOUT=20000
VITE_AI_TIMEOUT=240000
```

### Estados de error

`ApiError` lleva un `code` estable y `describeError()` lo traduce al idioma
activo, de modo que la interfaz distingue los fallos reales:

| code | Cuándo | Texto en pantalla |
| --- | --- | --- |
| `NETWORK_ERROR` | la API no está arrancada | "No se pudo conectar con la API" + URL |
| `TIMEOUT` | la API tarda demasiado | "La API tardó demasiado" |
| `NOT_FOUND` | 404: recurso inexistente o ajeno | "El recurso no está disponible" |
| `UNAVAILABLE` | 503: servicio o Mongo no disponible | "El servicio no está disponible" |
| `UNKNOWN` | otro fallo no clasificado | "No se pudo completar la solicitud" |

Otros códigos traducidos: VALIDATION_ERROR, UNAUTHORIZED, ACCOUNT_DISABLED,
CONFLICT, LIMIT_REACHED, RATE_LIMITED, PROVIDER_ERROR e INVALID_RESPONSE.
Los 401/403 privados invalidan la sesión. AbortController cancela lecturas y
descarta respuestas obsoletas. Un timeout de escritura puede ocurrir tras un
guardado real: revisar Mis playlists antes de repetir (no hay reintento automático).

## Perfil de usuario

Los datos viven en `src/context/UserContext.jsx` (y en `localStorage`, clave
`me:user`). El shape es este, y `displayName` y `username` **no se mezclan**:

```js
{
  displayName: 'Sam Rivers',   // nombre visible, puede repetirse y llevar espacios
  username: 'sam_rivers',      // identificador único, se guarda SIN '@'
  profilePicture: '',          // data URL de la foto, o null
  bio: '',
  pronouns: 'she/her',         // opcional
  email: '',
  provider: 'spotify',
  createdAt: '2024-11-03T10:00:00.000Z',
  isAuthenticated: true,
}
```

Las sesiones antiguas (que usaban `name` y `photo`) se migran solas al leerlas.

Experiencia:

* La **PFP es clicable**: abre un menú con "Cambiar foto" y, si hay foto,
  "Quitar foto". En escritorio el icono de cámara aparece al pasar el cursor;
  en táctil, como distintivo en la esquina.
* El **nombre para mostrar se edita en el sitio** (clic → input → Enter o ✔
  para guardar, Esc para cancelar). Al guardar, el header y el menú de perfil
  se actualizan al instante.
* **Editar perfil** abre un modal con foto, nombre, username, bio (máx. 160
  caracteres), pronombres y correo. Nada se aplica hasta pulsar *Guardar*.
* Username: se limpia al escribir (minúsculas, sin `@`, solo
  `a-z0-9_`, máx. 24) y se valida el formato en `src/services/profile.js`.

### Unicidad del username (pendiente de backend)

Desde React **no** se puede garantizar que un username no esté en uso por otra
cuenta, así que la interfaz no lo afirma: solo valida el formato y muestra la
pista "La unicidad se comprobará en el servidor". El punto exacto donde
enchufar la comprobación está documentado en `src/services/profile.js`:

```text
GET {VITE_API_URL}/profiles/username-available?username=sam_rivers
  -> { "available": true }
```

## Sesión de usuario

`UserContext` guarda la sesión en `localStorage` (`me:user`): nombre, correo,
método de acceso y foto (como data URL, máx. 1 MB). Al cambiar la foto se
actualiza el avatar del header y el del menú de perfil a la vez.

El acceso con correo es real: `/auth/signup`, `/auth/login`, `/auth/me` y JWT
guardado por auth.js. `/auth/providers` declara si el backend puede emitir JWT.
Cuando email:false, el formulario muestra un aviso de configuración y desactiva
el envío; AUTH_UNAVAILABLE también tiene mensaje es/en. OAuth sigue no disponible.
`isAuthenticated` exige usuario activo, JWT y restauración de sesión finalizada.
El antiguo modo demo no habilita acceso a las funciones privadas.
Los cambios locales del perfil siguen teniendo su alcance original.

## Pruebas

```bash
npm test           # contrato HTTP, errores, timeout/cancelación y traducciones
npm run lint
npm run build
```

El recorrido completo se ejecuta desde `../backend-epic-music` con
`npm run test:e2e`: Chromium + ambos proyectos reales + Mongo efímero. Solo se
inyecta el proveedor IA con datos sintéticos; no se consultan proveedores pagados.
Ver `../ai/06_ACCEPTANCE.md` para comandos y resultados.

Landing y control de acceso (desde `../backend-epic-music`):
`node --test scripts/landing-ux.mjs`. Prueba Chromium con API simulada, cero
consultas de datos para visitantes, acceso directo a rutas privadas, sesiones
caducadas, regreso tras login, logout, teclado, pausa de animación, ES/EN,
tres temas, anchos 320/768/1440 y auditoría axe. Requiere el puerto 5173 libre.

## Robustez

`components/ErrorBoundary.jsx` envuelve la aplicación: si un componente falla,
se muestra una pantalla de error en el idioma activo en lugar de una página en
blanco. Los estados de datos (`idle | loading | ready | empty | error`) se
gestionan en `src/hooks/`, no en el error boundary.
