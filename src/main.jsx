import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── One-time full data reset ──────────────────────────────────────────────────
// Bump RESET_VERSION to wipe ALL persisted app state (tenders, users, the current
// session, roles, permission matrix, dropdown config) and start the app from its
// brand-new seed state on the next load. Runs once per version, before any
// context reads localStorage, then leaves normal persistence untouched.
const RESET_VERSION = '1'
try {
  if (localStorage.getItem('atm_reset_v') !== RESET_VERSION) {
    Object.keys(localStorage)
      .filter(k => k.startsWith('atm_'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.setItem('atm_reset_v', RESET_VERSION)
  }
} catch {
  /* storage unavailable — nothing to reset */
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
