import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { loadSettings } from './lib/storage'
import { currentSurface } from './lib/surface'
import { applyTheme } from './lib/themes'

// Sizing depends on the surface, so stamp it before the first paint.
document.documentElement.dataset.surface = currentSurface()

// Paint the stored theme before React mounts so the UI never flashes matcha.
void (async () => {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      applyTheme((await loadSettings()).theme)
    }
  } catch {
    /* first run, or a plain browser tab: defaults are already in index.css */
  }
})()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
