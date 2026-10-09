export const en = {
  emotions: { title: 'Predominant emotions', joy: 'Joy', sadness: 'Sadness', anger: 'Anger', fear: 'Fear', love: 'Love', hope: 'Hope', nostalgia: 'Nostalgia', calm: 'Calm', estimated: 'Relative weights among the three AI-estimated emotions in the lyrics. They do not measure absolute intensity or analyze audio.', sampled: 'These lyrics are long: a sample from the beginning and end was analyzed.', insufficient: 'The lyrics do not provide enough evidence to estimate three emotions.', unavailable: 'Lyrics are available, but their emotions could not be estimated.', retry: 'Retry analysis' },
  table: { filter: 'Filter {name}', count: '{count} of {total} entries', loadedOnly: 'Filtering and sorting apply to loaded entries. Load more to include the next ones.', sort: 'Sort by {column}', actions: 'Actions', view: 'View {name}', delete: 'Delete {name}', noMatches: 'No matches for this filter.', confirmDelete: 'Confirm deletion', deleting: 'Deleting…', preview: 'Preview', openDetail: 'Open detail', date: 'Date', status: 'Status', song: 'Song', hints: 'Hints', songs: 'Songs', updated: 'Updated' },
  musicLinks: { label: 'Listen to {title}', search: 'Search for {title} by {artist} on {platform} (new tab)', hint: 'Search links for each platform.' },
  lyrics: { title: 'Full lyrics', show: 'View full lyrics', openSong: 'View lyrics for {title} by {artist}', hide: 'Hide lyrics', loading: 'Looking up lyrics and their emotions…', not_found: 'No full lyrics are available for this song from the source.', instrumental: 'The source identifies this song as instrumental.', error: 'Lyrics could not be retrieved. You can try again.', source: 'Source:', privacy: 'Looked up by title and artist; not saved in your history or playlists.' },
  history: {
    confirmDelete: 'Delete “{name}” from history? This cannot be undone.',
    title: 'History', local: 'Local history in this browser (guest or demo). Not synced to an account.',
    synced: 'Private account history, stored on the server.', privacy: 'Lyrics are not saved. You can view saved results, but cannot repeat the original search from this entry. Retention: 90 days; up to 200 account entries or 50 local entries.',
    empty: 'No searches in this history yet.', written: 'Written hints', resolved: 'Resolved hints', noHints: 'No optional hints',
    found: 'Identified', not_found: 'Not identified', error: 'Search error', pending: 'Search in progress',
    more: 'Load more', delete: 'Delete entry', view: 'View saved result', refresh: 'Refresh history',
    saved: 'Search saved to your account history.', local_saved: 'Search saved only in this browser.',
    unavailable: 'The result is available, but saving to history could not be confirmed.',
    local_unavailable: 'Local history could not be saved or read. Check browser storage.',
    unknown: 'The response was not confirmed. If the API accepted the search, it may appear in your history.',
    cancelled: 'Request cancelled on this device. An already accepted search may finish and appear in your account history.',
    interrupted: 'The search was interrupted before a result was saved.', providerError: 'The provider did not complete a valid response.',
    clientError: 'No response was received due to a network error or timeout; this does not mean the song does not exist.',
  },
  intelligence: {
    saveUnavailable: 'The result is available, but the artist could not be saved to the directory. It may not appear in suggestions yet.',
    title: 'Hint resolution', suggestions: 'Artist suggestions', artist: 'Artist', genre: 'Genre',
    keyboard: 'Global suggestions: use ↑/↓, Enter to choose and Escape to close.',
    loading: 'Looking up artists…', empty: 'No suggestions. You can type any artist.', error: 'Suggestions unavailable. You can keep typing and search.',
    curated: 'Curated name', inferred: 'AI-inferred name · Unverified',
    applied: 'Correction applied.', proposed: 'Possible match, not applied.', choose: 'Use {name}',
    uncertain: 'Several matches are possible. Choose a hint if you recognize it; lyrics remain the primary evidence.',
    dictionary: 'Source: genre dictionary.', directory: 'Source: name match in the global directory.',
    confidence: 'Confidence in a name correction does not verify the song or the AI estimate.',
    unavailable: 'The directory is unavailable. Music search can continue without that check.',
  },
  discovery: {
    lyrics: 'Lyrics fragment', hint: 'Paste 15–12000 characters. Lyrics are not stored in your playlists.',
    artist: 'Artist (optional)', genre: 'Genre (optional)', submit: 'Find similar songs',
    notice: 'AI-suggested identification and recommendations, not verified against a catalog. Titles or artists may be incorrect.',
    unverified: 'AI suggestion · Not catalog-verified', origin: 'Identified source song',
    notFound: 'The song could not be identified with sufficient evidence. Try another fragment or add hints.',
    partial: 'Partial response: fewer than 11 recommendations received. Only received data is shown.',
    select: 'Select', selectSong: 'Select {title} by {artist}', count: '{count} songs selected',
    all: 'Select all recommendations', clear: 'Clear selection',
  },
  playlists: {
    confirmRemoveSong: 'Remove “{name}” from this playlist?',
    title: 'My playlists', signIn: 'Sign in to save playlists', saveSelection: 'Save selection',
    create: 'Create playlist', createWithSelection: 'Create with selection', existing: 'Add to existing', choose: 'Choose a playlist', add: 'Add songs',
    name: 'Playlist name', description: 'Description (optional)', empty: 'You have no playlists yet.', noSongs: 'This playlist is empty.',
    savedCounts: 'Saved: {added} added; {skipped} duplicates skipped.', songCount: '{count} songs', updatedAt: 'Updated:',
    edit: 'Edit playlist', save: 'Save changes', updated: 'Playlist updated', delete: 'Delete playlist', deleted: 'Playlist deleted',
    confirmDelete: 'Delete “{name}”? This cannot be undone.', confirm: 'Confirm deletion',
    discover: 'Discover and add songs', up: 'Move up', down: 'Move down', remove: 'Remove',
    upSong: 'Move {title} up', downSong: 'Move {title} down', removeSong: 'Remove {title}',
  },
  apiErrors: {
    SEARCH_IN_PROGRESS: 'This search is still running. Check history before trying again.', INTERRUPTED: 'The search was interrupted before a result was saved.',
    VALIDATION_ERROR: 'Check the fields and their limits.', UNAUTHORIZED: 'Sign in to save playlists', ACCOUNT_DISABLED: 'This account is disabled. Sign in with an active account.',
    NOT_FOUND: 'This resource is unavailable.', CONFLICT: 'The playlist changed. Reload its state before repeating the operation.', LIMIT_REACHED: 'The playlist or song limit has been reached.',
    RATE_LIMITED: 'Too many requests. Wait before trying again.', PROVIDER_ERROR: 'AI could not produce a valid response. You can search again.',
    UNAVAILABLE: 'The service is unavailable.', TIMEOUT: 'The request timed out. If saving, check My playlists before repeating the operation.',
    NETWORK_ERROR: 'Could not connect to the API. If saving, check the playlist before repeating.', INVALID_RESPONSE: 'The API returned an invalid response.', UNKNOWN: 'The request could not be completed. Try again later.',
  },
  app: {
    name: 'MUSICA EPICA',
    tagline: 'Discover music from a lyrics fragment.',
    crashText: 'Something went wrong in the interface. Reload the app to continue.',
    crashReload: 'Reload',
  },

  nav: {
    home: 'Search',
    profile: 'Profile',
    account: 'Your account',
    settings: 'Settings',
    login: 'Sign in',
    logout: 'Sign out',
    skipToContent: 'Skip to main content',
  },

  header: {
    openMenu: 'Open profile menu',
    closeMenu: 'Close profile menu',
    openSearch: 'Go to search',
    brandHome: 'Go to home',
  },

  profileMenu: {
    title: 'Your profile',
    greeting: 'Hi, {name}',
    memberSince: 'Since {date}',
  },

  search: {
    label: 'Search songs',
    placeholder: 'Search by title or artist...',
    hint: 'Examples: This Hurts, A Pearl, Duvet',
    clear: 'Clear search',
    resultsTitle: 'Search results',
    resultsCount: '{count} song found',
    resultsCount_other: '{count} songs found',
    noResults: 'No results for “{query}”',
    noResultsHint: 'Try a different title or the artist name.',
    empty: 'Start typing the name of a song.',
  },

  selected: {
    title: 'Selected song',
    empty: 'Search for a song to get started',
    emptyHint: 'Pick a result and press Recommend to discover similar songs.',
    meta: '{genre} · {duration}',
    recommend: 'Recommend',
    recommending: 'Loading recommendations...',
    change: 'Change song',
  },

  recommendations: {
    title: 'Recommendations',
    forSong: 'For “{title}”',
    basedOn: 'Based on {count} similar song',
    basedOn_other: 'Based on {count} similar songs',
    empty: 'No recommendations found',
    emptyHint: 'The system has no similar songs for this track in its database yet.',
    similarity: 'Similarity',
    noSimilarity: 'Similarity unavailable',
    similarityFromApi: 'Similarity computed by the recommender (cosine similarity)',
    useSong: 'Use this song',
    current: 'Current song',
  },

  errors: {
    apiTitle: 'The API did not respond correctly',
    api: 'Please try again in a few seconds.',
    connectionTitle: 'Could not reach the API',
    connection: 'The API is not responding at {url}.',
    connectionHint: 'Start the backend separately at http://localhost:7000 or configure its URL with VITE_API_URL.',
    connectionCors:
      'If the API is already running, check that its CORS configuration allows the frontend origin.',
    deployedTitle: 'The API is not configured for this deployment',
    deployed:
      'This page is deployed, but VITE_API_URL points to {url}, which in a browser means "this computer".',
    deployedHint:
      'On Netlify: Site configuration → Environment variables → VITE_API_URL = the public URL of your API, then redeploy.',
    timeoutTitle: 'The API took too long',
    timeout: 'The request exceeded the timeout.',
    apiUnavailableTitle: 'The database is unavailable',
    apiUnavailable: 'The backend cannot connect to MongoDB right now.',
    songNotFoundTitle: 'Song not found',
    songNotFound: '“{title}” is not in the database, so there are no recommendations.',
  },

  states: {
    loading: 'Loading...',
    loadingRecommendations: 'Finding similar songs...',
    error: 'We could not complete the request',
    errorHint: 'Please try again in a few seconds.',
    retry: 'Try again',
    empty: 'Nothing to show here yet',
  },

  profile: {
    title: 'Profile',
    subtitle: 'Your personal information in MUSICA EPICA.',
    photo: 'Profile photo',
    changePhoto: 'Change photo',
    removePhoto: 'Remove photo',
    photoHint: 'JPG or PNG files. The image is stored only in this browser.',
    displayName: 'Display name',
    displayNameHint: 'Click to change the name',
    username: 'Username',
    phone: 'Phone',
    usernameHint: 'Unique account identifier. Uniqueness will be checked by the server.',
    noUsername: 'no username',
    bio: 'Bio',
    bioEmpty: 'You have not written a bio yet.',
    bioPlaceholder: 'Just listening to music.',
    pronouns: 'Pronouns',
    pronounsEmpty: 'No pronouns',
    pronounsPlaceholder: 'she/her',
    edit: 'Edit profile',
    editTitle: 'Edit profile',
    editHint: 'Changes are applied when you save.',
    accountInfo: 'Account information',
    basicInfo: 'Basic information',
    name: 'User name',
    email: 'Email address',
    save: 'Save changes',
    saved: 'Profile updated',
    cancel: 'Cancel',
    invalidEmail: 'Enter a valid email address.',
    nameRequired: 'Name cannot be empty.',
    joined: 'Member since',
    localNote: 'Data is stored in this browser until the profile is connected to the API.',
    preferences: 'Quick preferences',
    preferencesHint: 'Language and theme are set in Settings.',
    goToSettings: 'Go to Settings',
    errors: {
      required: 'This field is required.',
      long: 'Too long.',
      usernameShort: 'At least 3 characters.',
      usernameFormat: 'Letters, numbers and underscore only.',
      photo: 'That image could not be used (JPG or PNG, max 1 MB).',
    },
  },

  account: {
    title: 'Your account',
    subtitle: 'Information about the current session.',
    name: 'Name',
    email: 'Email',
    provider: 'Sign-in method',
    status: 'Account status',
    active: 'Active',
    memberSince: 'Member since',
    sessions: 'Signed in with',
    sessionsHint: 'Private playlists require a real JWT session.',
    apiNote:
      'Demo sessions let you explore but cannot save playlists.',
  },

  login: {
    title: 'Sign in to MUSICA EPICA',
    subtitle: 'Sign in or create an email account to save your playlists.',
    tabLogin: 'Sign in',
    tabRegister: 'Create account',
    password: 'Password',
    passwordHint: 'At least 8 characters.',
    createAccount: 'Create account and sign in',
    working: 'One moment...',
    or: 'or sign in with',
    pending: 'Pending',
    withGoogle: 'Continue with Google',
    withSpotify: 'Continue with Spotify',
    withApple: 'Continue with Apple Music',
    withEmail: 'Continue with email',
    emailTitle: 'Sign in with email',
    emailPlaceholder: 'you@email.com',
    submit: 'Sign in',
    pendiente_Google: 'Google sign-in activates once you set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.',
    pendiente_Spotify: 'Spotify sign-in activates once you set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in backend/.env.',
    notReady: 'Real sign-in is not available yet. You can enter in demo mode.',
    errorGeneric: 'Could not sign in.',
    demoMode: 'Continue without an account (demo)',
    providersNote: 'Accounts and playlists are stored in MongoDB. Demo sessions cannot access private playlists.',
    loginSuccess:
      "Signed in successfully.",

    registerSuccess:
      "Account created successfully. Your session is now active.",

    logoutSuccess:
      "Signed out successfully.",

    errors: {

      unavailable: 'Sign-in is unavailable. The server JWT configuration needs to be checked.',

      required:
        "Complete all required fields.",

      passwordLength:
        "The password must be at least 8 characters.",

      network:
        "Could not connect to the server.",

      validation:
        "Please review the information you entered.",

      credentials:
        "Incorrect email or password.",

      disabled:
        "This account is disabled.",

      exists:
        "An account with these details already exists.",

      session:
        "The session could not be created.",

      server:
        "A server error occurred. Please try again."

    }
  },

  settings: {
    title: 'Settings',
    subtitle: 'Customise the appearance and language of the app.',
    appearance: 'Appearance',
    theme: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeCustom: 'Custom',
    themeDarkHint: 'The main design, with deep backgrounds.',
    themeLightHint: 'Same visual identity, in a light key.',
    themeCustomHint: 'Choose your own colours.',
    custom: 'Custom colours',
    customHint: 'Changes apply to the app instantly.',
    colorPrimary: 'Primary colour',
    colorBackground: 'Background',
    colorSurface: 'Surface',
    colorText: 'Text',
    colorSecondary: 'Secondary colour',
    preview: 'Preview',
    resetColors: 'Restore default colours',
    contrastOk: 'Text contrast looks good.',
    contrastWarning: 'Low text contrast. Consider darkening the text or lightening the background.',
    language: 'Language',
    languageHint: 'Your language choice is kept in this browser.',
    account: 'Account',
    accountHint: 'Current session data and sign-in method.',
    accountLink: 'Account settings',
    data: 'Data',
    dataSource: 'Data source',
    dataSourceApi: 'Node.js/Express API, MongoDB and AI music inference',
    apiUrl: 'API URL',
    apiCheck: 'Check connection',
    apiChecking: 'Checking...',
    apiOk: 'API and MongoDB connected (AI providers not checked)',
    apiLoading: 'The API is still loading the recommender, try again in a moment.',
    apiDown: 'No connection to the API',
    apiSongs: '{count} songs in the database',
    apiNone: 'songs in the database',
    apiDeployedHint:
      'This page is deployed but the API points to localhost. Set VITE_API_URL in Netlify to the public URL of your API.',
  },

  account_status: {
    email: 'Email',
    google: 'Google',
    spotify: 'Spotify',
    apple: 'Apple Music',
    demo: 'Demo session',
  },

  common: {
    close: 'Close',
    back: 'Back',
    cancel: 'Cancel',
    optional: 'optional',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },

  footer: {
    note: 'AI music discovery. Identification and recommendations are not catalog-verified.',
    protected: 'Your playlists are private. Lyrics fragments are not stored in them.',
  },
}

export default en
