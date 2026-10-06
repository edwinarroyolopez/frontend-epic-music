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

En desarrollo, las peticiones del navegador a `/api/*` pasan por el proxy de
Vite hacia `http://localhost:7000/*`. Por ejemplo, `/api/songs` se reenvía a
`http://localhost:7000/songs`. Esto permite consumir la API sin exigir CORS
durante el desarrollo. La URL de destino se puede cambiar con `VITE_API_URL`
en `.env` (ver `.env.example`); reinicia Vite después de cambiarla.

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
    ├── App.jsx                rutas, cabecera, cancion seleccionada
    ├── components/            Header, ProfileMenu, Avatar, Cover, Brand, BrandIcons,
    │                          SearchBar, SearchResults, SelectedSong, SongCard,
    │                          RecommendationList, ThemeSelector, LanguageSelector,
    │                          CustomThemeEditor, StateMessage, ErrorBoundary, Footer
    ├── pages/                 Home, Profile, Account, Settings, Login
    ├── context/               PreferencesContext (idiema/tema), UserContext (sesion)
    ├── hooks/                 useHashRoute, useSongSearch, useRecommendations,
    │                          useLocalStorage
    ├── services/              api.js (frontera de datos HTTP), config.js
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
* **La canción seleccionada vive en `App`**: no se pierde al ir a Perfil,
  Tu cuenta o Ajustes y volver al buscador.
* **Internacionalización**: todo el texto sale de `translations/`, con
  interpolación `{nombre}` y plurales (`clave` / `clave_other`).

## Conexión con el backend

`src/services/api.js` es la única capa que hace peticiones HTTP. Los
componentes no cambian nunca: usan `searchSongs()`, `getRecommendations()` y
`checkApiHealth()`, que ya devuelven el shape que consume la interfaz
(`id`, `title`, `artist`, `genre`, `duration`, `year`, `popularity`,
`similarity`). El JSON snake_case de la API se traduce ahí, en un solo sitio.

Configuración opcional (`.env`; estos son los valores por defecto):

```text
VITE_API_URL=http://localhost:7000
VITE_API_TIMEOUT=20000
VITE_RECOMMENDATION_COUNT=5
```

### Estados de error

`ApiError` lleva un `code` estable y `describeError()` lo traduce al idioma
activo, de modo que la interfaz distingue los fallos reales:

| code | Cuándo | Texto en pantalla |
| --- | --- | --- |
| `NETWORK_ERROR` | la API no está arrancada | "No se pudo conectar con la API" + URL |
| `TIMEOUT` | la API tarda demasiado | "La API tardó demasiado" |
| `NOT_FOUND` | 404: la canción no está en MySQL | "Canción no encontrada" |
| `UNAVAILABLE` | 503: la API no puede leer MySQL | "La base de datos no está disponible" |
| `HTTP_ERROR` | cualquier otro 4xx/5xx | "La API no respondió correctamente" |

Además están los estados sin error: `loading` (búsqueda y recomendaciones) y
`empty` (búsqueda sin coincidencias, o canción sin similares por debajo del
umbral de similitud). Nada se simula: si el backend no responde, se muestra el
error.

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

La pantalla de acceso es **interfaz solamente**: los botones de Google,
Spotify, Apple Music y correo no envían ni valida credenciales, solo informan
de que la integración está pendiente. El único flujo activo es "modo
demostración". Cuando exista autenticación real, se sustituye `signInDemo()`
en `src/context/UserContext.jsx` y el resto de la interfaz no cambia.

## Robustez

`components/ErrorBoundary.jsx` envuelve la aplicación: si un componente falla,
se muestra una pantalla de error en el idioma activo en lugar de una página en
blanco. Los estados de datos (`idle | loading | ready | empty | error`) se
gestionan en `src/hooks/`, no en el error boundary.
