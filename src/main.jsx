import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/noto-sans-sc/wght.css'
import '@fontsource-variable/noto-serif-sc/wght.css'
import '@fontsource-variable/manrope/wght.css'
import '@fontsource-variable/newsreader/wght.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import '@fontsource/ibm-plex-mono/700.css'
import '@fontsource/caveat/400.css'
import '@fontsource/caveat/600.css'
import '@fontsource/zhi-mang-xing/400.css'
import App from './App.jsx'
import { AuthProvider } from './auth.jsx'
import { I18nProvider } from './i18n.jsx'
import Monitoring from './Monitoring.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider><AuthProvider><App /><Monitoring /></AuthProvider></I18nProvider>
  </React.StrictMode>,
)
