export const es = {
  lyricsDelivery: { transient: 'Letra consultada bajo demanda y conservada sólo temporalmente en memoria; no se guarda el texto completo en la base de datos, el historial ni las playlists. El análisis se reutiliza si el contenido no cambia.' },
  lyricsActions: { refetch: 'Volver a buscar letra y emociones', retryWait: 'Podrás reintentar en {seconds} s.', restrictedHint: 'Puedes volver a comprobar la fuente. Las emociones se calcularán sólo si se obtiene una letra autorizada; reintentar no elimina la restricción de derechos.' },
  emotions: { pending: 'Análisis emocional pendiente.', title: 'Emociones predominantes', joy: 'Alegría', sadness: 'Tristeza', anger: 'Ira', fear: 'Miedo', love: 'Amor', hope: 'Esperanza', nostalgia: 'Nostalgia', calm: 'Calma', estimated: 'Pesos relativos entre las tres emociones estimadas por IA a partir de la letra. No miden intensidad absoluta ni analizan el audio.', sampled: 'La letra es extensa: se analizó una muestra de su principio y final.', insufficient: 'La letra no ofrece evidencia suficiente para estimar tres emociones.', unavailable: 'La letra está disponible, pero no se pudieron estimar sus emociones.', retry: 'Reintentar análisis' },
  table: { filter: 'Filtrar {name}', count: '{count} de {total} entradas', loadedOnly: 'El filtro y el orden se aplican a las entradas cargadas. Carga más para incluir las siguientes.', sort: 'Ordenar por {column}', actions: 'Acciones', view: 'Ver {name}', delete: 'Eliminar {name}', noMatches: 'No hay coincidencias con este filtro.', confirmDelete: 'Confirmar eliminación', deleting: 'Eliminando…', preview: 'Vista previa', openDetail: 'Abrir detalle', date: 'Fecha', status: 'Estado', song: 'Canción', hints: 'Pistas', songs: 'Canciones', updated: 'Actualización' },
  musicLinks: { label: 'Escuchar {title}', search: 'Buscar {title} de {artist} en {platform} (nueva pestaña)', hint: 'Enlaces de búsqueda en cada plataforma.' },
  lyrics: { never_attempted: 'Aún no se ha consultado la letra.', in_progress: 'La consulta sigue en curso. Vuelve a comprobar en unos segundos.', available: 'Letra encontrada.', temporary_error: 'La fuente falló temporalmente. Puedes reintentar tras el tiempo de espera.', rights_restricted: 'Letra consultada; su almacenamiento y reproducción no están autorizados para esta fuente.', title: 'Letra completa', show: 'Ver letra completa', openSong: 'Ver letra de {title}, de {artist}', hide: 'Ocultar letra', loading: 'Consultando la letra y sus emociones…', not_found: 'No hay una letra completa disponible para esta canción en la fuente consultada.', instrumental: 'La fuente identifica esta canción como instrumental.', error: 'No se pudo consultar la letra. Puedes volver a intentarlo.', source: 'Fuente:', privacy: 'El contenido autorizado se reutiliza desde la canción global. No se copia al historial ni a playlists.' },
  history: {
    privacyTitle: 'Privacidad y conservación del historial',
    confirmDelete: '¿Eliminar «{name}» del historial? Esta acción no se puede deshacer.',
    title: 'Historial', local: 'Historial local de este navegador (invitado o demo). No se sincroniza con una cuenta.',
    synced: 'Historial privado de tu cuenta, guardado en el servidor.', privacy: 'No guardamos letras en el historial. Puedes consultar resultados guardados, pero no repetir la búsqueda original desde esta ficha. Retención: 90 días; hasta 200 entradas en cuenta o 50 locales.',
    empty: 'Todavía no hay búsquedas en este historial.', written: 'Pistas escritas', resolved: 'Pistas resueltas', noHints: 'Sin pistas opcionales',
    found: 'Identificada', not_found: 'Sin identificar', error: 'Búsqueda con error', pending: 'Búsqueda en curso',
    more: 'Cargar más', delete: 'Eliminar entrada', view: 'Ver resultado guardado', refresh: 'Actualizar historial',
    saved: 'Búsqueda guardada en el historial de tu cuenta.', local_saved: 'Búsqueda guardada solo en este navegador.',
    unavailable: 'El resultado está disponible, pero no se pudo confirmar el guardado en el historial.',
    local_unavailable: 'No se pudo guardar o leer el historial local. Comprueba el almacenamiento del navegador.',
    unknown: 'No se confirmó la respuesta. Si la API aceptó la búsqueda, puede aparecer en tu historial.',
    cancelled: 'Consulta cancelada en este dispositivo. Una búsqueda ya aceptada puede terminar y aparecer en el historial de tu cuenta.',
    interrupted: 'La búsqueda se interrumpió antes de guardar un resultado.', providerError: 'El proveedor no completó una respuesta válida.',
    clientError: 'No se recibió una respuesta por red o tiempo de espera; esto no significa que la canción no exista.',
  },
  intelligence: {
    saveUnavailable: 'El resultado está disponible, pero no se pudo guardar el artista en el directorio. Puede que todavía no aparezca en las sugerencias.',
    title: 'Resolución de pistas', suggestions: 'Sugerencias de artistas', artist: 'Artista', genre: 'Género',
    keyboard: 'Sugerencias globales: usa ↑/↓, Enter para elegir y Escape para cerrar.',
    loading: 'Consultando artistas…', empty: 'Sin sugerencias. Puedes escribir cualquier artista.', error: 'Sugerencias no disponibles. Puedes seguir escribiendo y buscar.',
    curated: 'Nombre curado', inferred: 'Nombre inferido por IA · No verificado',
    applied: 'Corrección aplicada.', proposed: 'Posible coincidencia, sin aplicar.', choose: 'Usar {name}',
    uncertain: 'Hay varias coincidencias posibles. Elige una pista si la reconoces; la letra sigue siendo la evidencia principal.',
    dictionary: 'Fuente: diccionario de géneros.', directory: 'Fuente: coincidencia de nombre en el directorio global.',
    confidence: 'La confianza en la corrección del nombre no verifica la canción ni la estimación de la IA.',
    unavailable: 'El directorio no está disponible. La búsqueda musical puede continuar sin esa comprobación.',
  },
  discovery: {
    allShort: 'Todas (11)', clearShort: 'Limpiar', signInSave: 'Entrar y guardar',
    optionalHints: 'Pistas opcionales', hintsSummary: 'Artista o género', details: 'Por qué esta canción',
    lyrics: 'Fragmento de letra', hint: 'Pega entre 15 y 12000 caracteres. No guardamos la letra en tus playlists.',
    artist: 'Artista (opcional)', genre: 'Género (opcional)', submit: 'Buscar canciones similares',
    notice: 'Identificación y recomendaciones sugeridas por IA, sin verificación de catálogo. El título o artista pueden ser incorrectos. Los enlaces abren búsquedas en cada plataforma.',
    unverified: 'Sugerencia de IA · Sin verificación de catálogo', origin: 'Canción de origen identificada',
    notFound: 'No se identificó la canción con evidencia suficiente. Prueba otro fragmento o añade pistas.',
    partial: 'Respuesta parcial: no se recibieron las 11 recomendaciones. Solo se muestran los datos recibidos.',
    select: 'Seleccionar', selectSong: 'Seleccionar {title} de {artist}', count: '{count} canciones seleccionadas',
    all: 'Seleccionar todas las recomendaciones', clear: 'Limpiar selección',
  },
  playlists: {
    confirmRemoveSong: '¿Quitar «{name}» de esta playlist?',
    title: 'Mis playlists', signIn: 'Inicia sesión para guardar playlists', saveSelection: 'Guardar selección',
    create: 'Crear playlist', createWithSelection: 'Crear con selección', existing: 'Añadir a existente', choose: 'Elige una playlist', add: 'Añadir canciones',
    name: 'Nombre de playlist', description: 'Descripción (opcional)', empty: 'Todavía no tienes playlists.', noSongs: 'Esta playlist está vacía.',
    savedCounts: 'Guardado: {added} añadidas; {skipped} duplicadas omitidas.', songCount: '{count} canciones', updatedAt: 'Actualizada:',
    edit: 'Editar playlist', save: 'Guardar cambios', updated: 'Playlist actualizada', delete: 'Eliminar playlist', deleted: 'Playlist eliminada',
    confirmDelete: '¿Eliminar «{name}»? Esta acción no se puede deshacer.', confirm: 'Confirmar eliminación',
    discover: 'Descubrir y añadir canciones', up: 'Subir', down: 'Bajar', remove: 'Quitar',
    upSong: 'Subir {title}', downSong: 'Bajar {title}', removeSong: 'Quitar {title}',
  },
  apiErrors: {
    SEARCH_IN_PROGRESS: 'Esta búsqueda sigue en curso. Consulta el historial antes de repetir.', INTERRUPTED: 'La búsqueda se interrumpió antes de guardar un resultado.',
    VALIDATION_ERROR: 'Revisa los campos y sus límites.', UNAUTHORIZED: 'Inicia sesión para guardar playlists', ACCOUNT_DISABLED: 'La cuenta está desactivada. Inicia sesión con una cuenta activa.',
    NOT_FOUND: 'El recurso no está disponible.', CONFLICT: 'La playlist cambió. Recarga su estado antes de repetir la operación.', LIMIT_REACHED: 'Se alcanzó el límite de playlists o canciones.',
    RATE_LIMITED: 'Demasiadas solicitudes. Espera antes de volver a intentar.', PROVIDER_ERROR: 'La IA no pudo completar una respuesta válida. Puedes volver a buscar.',
    UNAVAILABLE: 'El servicio no está disponible.', TIMEOUT: 'Se agotó el tiempo de espera. Si estabas guardando, consulta Mis playlists antes de repetir la operación.',
    NETWORK_ERROR: 'No se pudo conectar con la API. Si estabas guardando, comprueba la playlist antes de repetir.', INVALID_RESPONSE: 'La API devolvió una respuesta inválida.', UNKNOWN: 'No se pudo completar la solicitud. Inténtalo más tarde.',
  },
  app: {
    name: 'MUSICA EPICA',
    tagline: 'Encuentra esa canción.',
    crashText: 'Se ha producido un error inesperado en la interfaz. Recarga la aplicación para continuar.',
    crashReload: 'Recargar',
  },

  nav: {
    home: 'Buscar',
    profile: 'Perfil',
    account: 'Tu cuenta',
    settings: 'Ajustes',
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    skipToContent: 'Saltar al contenido principal',
  },

  header: {
    openMenu: 'Abrir menú de perfil',
    closeMenu: 'Cerrar menú de perfil',
    openSearch: 'Ir al buscador',
    brandHome: 'Ir al inicio',
  },

  profileMenu: {
    title: 'Tu perfil',
    greeting: 'Hola, {name}',
    memberSince: 'Desde {date}',
  },

  search: {
    hintApi: 'Ejemplos: This Hurts, A Pearl, Duvet',
    label: 'Buscar canciones',
    placeholder: 'Busca por título o artista...',
    hint: 'Ejemplos: This Hurts, A Pearl, Duvet',
    clear: 'Limpiar búsqueda',
    resultsTitle: 'Resultados de búsqueda',
    resultsCount: '{count} canción encontrada',
    resultsCount_other: '{count} canciones encontradas',
    noResults: 'Sin resultados para «{query}»',
    noResultsHint: 'Prueba con otro título o con el nombre del artista.',
    empty: 'Empieza escribiendo el nombre de una canción.',
  },

  selected: {
    title: 'Canción seleccionada',
    empty: 'Busca una canción para comenzar',
    emptyHint: 'Selecciona un resultado y pulsa Recomendar para descubrir canciones parecidas.',
    meta: '{genre} · {duration}',
    recommend: 'Recomendar',
    recommending: 'Obteniendo recomendaciones...',
    change: 'Cambiar canción',
  },

  recommendations: {
    title: 'Recomendaciones',
    forSong: 'Para «{title}»',
    basedOn: 'Basado en {count} canciones similares',
    basedOn_other: 'Basado en {count} canciones similares',
    empty: 'No se encontraron recomendaciones',
    emptyHint: 'El sistema todavía no tiene canciones similares a esta en su base de datos.',
    similarity: 'Similitud',
    noSimilarity: 'Similitud no disponible',
    similarityFromApi: 'Similitud calculada por el recomendador (cosine similarity)',
    useSong: 'Usar esta canción',
    current: 'Canción actual',
  },

  errors: {
    apiTitle: 'La API no respondió correctamente',
    api: 'Vuelve a intentarlo en unos segundos.',
    connectionTitle: 'No se pudo conectar con la API',
    connection: 'La API no responde en {url}.',
    connectionHint:
      'Arranca el backend por separado en http://localhost:7000 o configura su URL con VITE_API_URL.',
    connectionCors:
      'Si la API está arrancada y sigue fallando, comprueba que su configuración CORS permite el origen del frontend.',
    deployedTitle: 'La API no está configurada en el despliegue',
    deployed:
      'Esta página está publicada, pero VITE_API_URL apunta a {url}, que en el navegador significa "este ordenador".',
    deployedHint:
      'En Netlify: Site configuration → Environment variables → VITE_API_URL = la URL pública de tu API, y vuelve a desplegar.',
    timeoutTitle: 'La API tardó demasiado',
    timeout: 'La consulta ha superado el tiempo de espera.',
    apiUnavailableTitle: 'La base de datos no está disponible',
    apiUnavailable: 'El backend no puede conectar con MongoDB en este momento.',
    songNotFoundTitle: 'Canción no encontrada',
    songNotFound: '«{title}» no está en la base de datos, así que no hay recomendaciones.',
  },

  states: {
    loading: 'Cargando...',
    loadingRecommendations: 'Buscando canciones similares...',
    error: 'No se pudo completar la petición',
    errorHint: 'Vuelve a intentarlo en unos segundos.',
    retry: 'Reintentar',
    empty: 'Nada que mostrar aquí todavía',
  },

  profile: {
    title: 'Perfil',
    subtitle: 'Tu información personal dentro de MUSICA EPICA.',
    photo: 'Foto de perfil',
    changePhoto: 'Cambiar foto',
    removePhoto: 'Quitar foto',
    photoHint: 'Formatos JPG o PNG. La imagen se guarda solo en este navegador.',
    displayName: 'Nombre para mostrar',
    displayNameHint: 'Pulsar para cambiar el nombre',
    username: 'Nombre de usuario',
    phone: 'Teléfono',
    usernameHint: 'Identificador único de tu cuenta. La unicidad se comprobará en el servidor.',
    noUsername: 'sin username',
    bio: 'Bio',
    bioEmpty: 'Todavía no has escrito una bio.',
    bioPlaceholder: 'Solo escucho música.',
    pronouns: 'Pronombres',
    pronounsEmpty: 'Sin pronombres',
    pronounsPlaceholder: 'she/her',
    edit: 'Editar perfil',
    editTitle: 'Editar perfil',
    editHint: 'Los cambios se aplican al guardar.',
    accountInfo: 'Información de la cuenta',
    basicInfo: 'Información básica',
    name: 'Nombre de usuario',
    email: 'Correo electrónico',
    save: 'Guardar cambios',
    saved: 'Perfil actualizado',
    cancel: 'Cancelar',
    invalidEmail: 'Introduce un correo electrónico válido.',
    nameRequired: 'El nombre no puede estar vacío.',
    joined: 'Miembro desde',
    localNote: 'Los datos se guardan en este navegador hasta que el perfil se conecte a la API.',
    preferences: 'Preferencias rápidas',
    preferencesHint: 'Idioma y tema se ajustan en Ajustes.',
    goToSettings: 'Ir a Ajustes',
    errors: {
      required: 'Este campo es obligatorio.',
      long: 'Es demasiado largo.',
      usernameShort: 'Mínimo 3 caracteres.',
      usernameFormat: 'Solo letras, números y guion bajo.',
      photo: 'No se pudo usar esa imagen (JPG o PNG, máx. 1 MB).',
    },
  },

  account: {
    title: 'Tu cuenta',
    subtitle: 'Información de la sesión actual.',
    name: 'Nombre',
    email: 'Correo',
    provider: 'Método de inicio de sesión',
    status: 'Estado de la cuenta',
    active: 'Activa',
    memberSince: 'Miembro desde',
    sessions: 'Sesión iniciada mediante',
    sessionsHint: 'Las playlists privadas requieren una sesión real con JWT.',
    apiNote:
      'La sesión de demostración permite explorar, pero no guardar playlists.',
  },

  login: {
    title: 'Entra en MUSICA EPICA',
    subtitle: 'Entra o crea tu cuenta con correo para guardar tus playlists.',
    tabLogin: 'Entrar',
    tabRegister: 'Crear cuenta',
    password: 'Contraseña',
    passwordHint: 'Mínimo 8 caracteres.',
    createAccount: 'Crear cuenta y entrar',
    working: 'Un momento...',
    or: 'o entra con',
    pending: 'Pendiente',
    withGoogle: 'Continuar con Google',
    withSpotify: 'Continuar con Spotify',
    withApple: 'Continuar con Apple Music',
    withEmail: 'Continuar con correo electrónico',
    emailTitle: 'Entrar con correo',
    emailPlaceholder: 'tu@correo.com',
    submit: 'Entrar',
    pendiente_Google: 'El acceso con Google se activa cuando pongas GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en backend/.env.',
    pendiente_Spotify: 'El acceso con Spotify se activa cuando pongas SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en backend/.env.',
    notReady: 'El inicio de sesión real todavía no está disponible. Puedes entrar en modo demostración.',
    errorGeneric: 'No se pudo iniciar la sesión.',
    demoMode: 'Entrar sin cuenta (demostración)',
    providersNote: 'Cuentas y playlists se guardan en MongoDB. La demostración no accede a playlists privadas.',
    loginSuccess:
      "Sesión iniciada correctamente.",

    registerSuccess:
      "Cuenta creada correctamente. Tu sesión ya está activa.",

    logoutSuccess:
      "Sesión cerrada correctamente.",

    errors: {

      unavailable: 'El inicio de sesión no está disponible. Es necesario revisar la configuración JWT del servidor.',

      required:
        "Completa todos los campos obligatorios.",

      passwordLength:
        "La contraseña debe tener al menos 8 caracteres.",

      network:
        "No se pudo conectar con el servidor.",

      validation:
        "Revisa los datos enviados.",

      credentials:
        "Correo o contraseña incorrectos.",

      disabled:
        "Esta cuenta está desactivada.",

      exists:
        "Ya existe una cuenta con esos datos.",

      session:
        "No se pudo crear la sesión.",

      server:
        "Ha ocurrido un error en el servidor. Inténtalo nuevamente."

    }
  },

  settings: {
    title: 'Ajustes',
    subtitle: 'Personaliza la apariencia y el idioma de la aplicación.',
    appearance: 'Apariencia',
    theme: 'Tema',
    themeDark: 'Oscuro',
    themeLight: 'Claro',
    themeCustom: 'Personalizado',
    themeDarkHint: 'Diseño principal, con fondos profundos.',
    themeLightHint: 'Misma identidad visual, en clave clara.',
    themeCustomHint: 'Elige tus propios colores.',
    custom: 'Colores personalizados',
    customHint: 'Los cambios se aplican al instante sobre la aplicación.',
    colorPrimary: 'Color principal',
    colorBackground: 'Fondo',
    colorSurface: 'Superficie',
    colorText: 'Texto',
    colorSecondary: 'Color secundario',
    preview: 'Previsualización',
    resetColors: 'Restaurar colores por defecto',
    contrastOk: 'Paleta: texto, superficies y acentos con contraste suficiente. No es una auditoría completa.',
    contrastWarning: 'Contraste insuficiente en texto, superficies o acentos. Ajusta los colores o restaura una paleta predefinida.',
    language: 'Idioma',
    languageHint: 'El idioma se mantiene en este navegador.',
    account: 'Cuenta',
    accountHint: 'Datos de la sesión actual y método de acceso.',
    accountLink: 'Configuración de cuenta',
    data: 'Datos',
    dataSource: 'Origen de los datos',
    dataSourceApi: 'API Node.js/Express, MongoDB e inferencia musical con IA',
    apiUrl: 'URL de la API',
    apiCheck: 'Comprobar conexión',
    apiChecking: 'Comprobando...',
    apiOk: 'API y MongoDB conectados (no comprueba proveedores IA)',
    apiLoading: 'La API está cargando el recomendador, prueba en un momento.',
    apiDown: 'Sin conexión con la API',
    apiSongs: '{count} canciones en la base de datos',
    apiNone: 'canciones en la base de datos',
    apiDeployedHint:
      'Esta página está publicada, pero la API apunta a localhost. Define VITE_API_URL en Netlify con la URL pública de tu API.',
  },

  account_status: {
    email: 'Correo electrónico',
    google: 'Google',
    spotify: 'Spotify',
    apple: 'Apple Music',
    demo: 'Sesión de demostración',
  },

  common: {
    close: 'Cerrar',
    back: 'Volver',
    cancel: 'Cancelar',
    optional: 'opcional',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
  },

  footer: {
    note: 'Descubrimiento musical con IA. Identificación y recomendaciones sin verificación de catálogo.',
    protected: 'Tus playlists son privadas. No almacenamos fragmentos de letras en ellas.',
  },
}

export default es
