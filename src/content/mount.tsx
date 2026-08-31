/**
 * Shadow-DOM host for the in-page toast.
 *
 * Loaded lazily by `index.ts` the first time a nudge fires. Everything here
 * happens exactly once per page: create a host element, attach a shadow root,
 * put our stylesheet *inside* that root, and mount React into it.
 */
import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { THEME_MAP } from '../lib/themes'
import type { ToastMessage } from '../lib/types'
import { ToastStack, type ToastApi } from './ToastStack'
// `?inline` hands us the compiled Tailwind output as a string instead of letting
// Vite inject a <link>/<style> into the page. That difference is the whole point:
// the bytes end up in the shadow root and nowhere else.
import css from './toast.css?inline'

const HOST_ID = 'kawaii-wellness-toast-host'

let root: Root | null = null
let api: ToastApi | null = null
/** Toasts that arrived before React finished its first commit. */
const pending: ToastMessage[] = []

/**
 * Styles the host element itself.
 *
 * `all: initial` wipes whatever the page's CSS would otherwise inherit into our
 * element (a global `div { font: ... }`, a `* { animation: ... }`), and the
 * `!important`s defend the handful of properties a page could still use to
 * relocate or hide us. The host is `pointer-events: none` so the invisible
 * corner of the fixed layer never eats clicks meant for the page; the card
 * itself turns pointer events back on.
 */
function styleHost(host: HTMLElement): void {
  host.style.cssText = [
    'all: initial',
    'position: fixed !important',
    'inset: 0 !important',
    'z-index: 2147483000 !important',
    'pointer-events: none !important',
    'display: block !important',
    'visibility: visible !important',
    'opacity: 1 !important',
    'transform: none !important',
    'filter: none !important',
    'contain: layout style',
  ].join(';')
}

/** Paints the player's theme onto the shadow host, where `:host` picks it up. */
function applyTheme(host: HTMLElement, message: ToastMessage): void {
  const theme = THEME_MAP[message.theme] ?? THEME_MAP.matcha
  for (const [key, value] of Object.entries(theme.vars)) {
    host.style.setProperty(key, value)
  }
  host.style.setProperty('color-scheme', theme.scheme)

  /**
   * The toast gets its own surface rather than reusing `--kw-surface` at
   * `--kw-glass`. Inside the panel that glass sits on our own gradient; here it
   * sits on *someone else's page*, which might be black, a photo, or a video —
   * at 55% white the body copy washed out over a dark page. So: a near-opaque
   * base, still blurred, and drawn from the background colour under the dark
   * themes so a dark UI never turns into a white card with pale text.
   */
  const dark = theme.scheme === 'dark'
  host.style.setProperty('--kw-toast-surface', dark ? theme.vars['--kw-bg-start'] : '255 255 255')
  host.style.setProperty('--kw-toast-alpha', dark ? '0.94' : '0.90')
}

function ensureMounted(): HTMLElement {
  const existing = document.getElementById(HOST_ID)
  if (existing) return existing

  const host = document.createElement('div')
  host.id = HOST_ID
  styleHost(host)

  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = css
  shadow.append(style)

  const mountPoint = document.createElement('div')
  shadow.append(mountPoint)
  document.documentElement.append(host)

  root = createRoot(mountPoint)
  root.render(
    <StrictMode>
      <ToastStack
        onReady={(next) => {
          api = next
          // Drain anything that landed during this first render.
          for (const queued of pending.splice(0)) next.show(queued)
        }}
        onEmpty={() => teardown()}
      />
    </StrictMode>,
  )
  return host
}

/**
 * Unmounts once the last toast has left.
 *
 * A page can stay open for days; leaving a React root, its timers and a fixed
 * overlay parked on it for a toast shown at 9am is not neighbourly. The next
 * nudge simply mounts again — the module is already loaded by then.
 */
function teardown(): void {
  const host = document.getElementById(HOST_ID)
  root?.unmount()
  root = null
  api = null
  host?.remove()
}

/** Entry point used by the content script. */
export function showToast(message: ToastMessage): void {
  const host = ensureMounted()
  applyTheme(host, message)
  if (api) api.show(message)
  else pending.push(message)
}
