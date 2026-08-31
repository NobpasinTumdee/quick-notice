/**
 * Content-script entry point for the in-page toast.
 *
 * This file runs on **every page the user visits**, so it is deliberately tiny:
 * a guard, a message listener, and nothing else. React, Framer Motion, the
 * mascot art and the Tailwind stylesheet are all behind a dynamic `import()`
 * that only runs the first time a nudge actually fires — a browsing session
 * that never gets a reminder pays a couple of KB, not a UI framework.
 *
 * Everything it eventually renders lives inside a **shadow root**. Injecting
 * Tailwind into a host page's `document.head` would rewrite the styling of
 * every site the user visits (Preflight alone resets margins, headings, lists
 * and form controls), which is not a trade we get to make on someone else's
 * page. Inside a closed-off shadow tree, our CSS cannot reach the page and the
 * page's CSS cannot reach us.
 */
import type { ToastMessage } from '../lib/types'

const HOST_ID = 'kawaii-wellness-toast-host'

function isToastMessage(message: unknown): message is ToastMessage {
  return !!message && typeof message === 'object' && (message as ToastMessage).type === 'SHOW_TOAST'
}

/**
 * Pages we stay out of entirely: frames (one toast per tab, not per iframe),
 * non-HTML documents such as a rendered XML feed, and any page that somehow
 * already has us — a re-injection after an extension update, say.
 */
function shouldMount(): boolean {
  if (window.top !== window) return false
  if (!document.documentElement || document.contentType !== 'text/html') return false
  return !document.getElementById(HOST_ID)
}

/** Resolves once the widget module is loaded; kept so we only import it once. */
let widget: Promise<typeof import('./mount')> | null = null

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isToastMessage(message)) return false
  if (!shouldMount() && !widget) return false

  widget ??= import('./mount')
  void widget
    .then((mod) => mod.showToast(message))
    .catch((error) => {
      // A CSP that blocks the chunk, a page tearing itself down mid-navigation:
      // a missed toast is a nuisance, a thrown error in someone's page is worse.
      console.debug('[kawaii] toast skipped', error)
    })

  // Nothing to respond with, and the worker does not wait for one.
  return false
})
