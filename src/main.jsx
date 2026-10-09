import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { PreferencesProvider } from './context/PreferencesContext.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { SnackbarProvider } from "./context/SnackbarContext.jsx";

import './styles/global.css'
import './styles/layout.css'
import './styles/discover.css'
import './styles/pages.css'
import './components/ui/ui.css'
import './styles/playlists.css'
import './styles/data-table.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PreferencesProvider>
      <SnackbarProvider>
        <UserProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </UserProvider>
      </SnackbarProvider>
    </PreferencesProvider>
  </StrictMode>,
)
