# MUSICA EPICA - Frontend

Frontend independiente en React (Vite) de la aplicación de recomendación musical.
Se ejecuta en **http://localhost:3000** y consume una API que se levanta por
separado en **http://localhost:7000**.

## Puesta en marcha

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
npm run build     # genera dist/ con dev.html y los assets
npm run lint      # oxlint
npm run preview   # abre http://localhost:3000/dev.html
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
| `dist/` | Salida generada por `npm run build`. |

El código de la aplicación está en `src/` y su entrada HTML es `dev.html`.
Conserva `dev.html` al limpiar archivos generados: sin él, Vite falla con
`UNRESOLVED_ENTRY: Cannot resolve entry module dev.html`.

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
    ├── pages/                 Home, Playlists, Profile, Account, Settings, Login
    ├── context/               PreferencesContext (idiema/tema), UserContext (sesion)
    ├── hooks/                 useHashRoute, useSongSearch, usePlaylists,
    │                          useLocalStorage
    ├── services/              api.js, playlists.js, auth.js, config.js
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
`{lyrics,artist?,genre?}`. Consume `{success:true,data:{found,song,recommendations,...}}`.
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
guardado por auth.js. `/auth/providers` declara correo disponible y OAuth no
disponible. Modo demo permite explorar; no permite leer ni persistir playlists.
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

## Robustez

`components/ErrorBoundary.jsx` envuelve la aplicación: si un componente falla,
se muestra una pantalla de error en el idioma activo en lugar de una página en
blanco. Los estados de datos (`idle | loading | ready | empty | error`) se
gestionan en `src/hooks/`, no en el error boundary.
