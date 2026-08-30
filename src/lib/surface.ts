import type { ViewMode } from './types'

/**
 * Which surface this document is rendering in.
 *
 * The popup and the side panel load the same `index.html`, so the page cannot
 * infer it — the worker appends `?surface=popup` when it points the action at
 * the popup (see `POPUP_PATH` in the service worker). Anything else, including
 * `npm run dev` in a plain tab, is treated as the panel: it is the layout that
 * adapts to whatever space it is given.
 */
export function currentSurface(): ViewMode {
  try {
    return new URLSearchParams(window.location.search).get('surface') === 'popup'
      ? 'popup'
      : 'sidepanel'
  } catch {
    return 'sidepanel'
  }
}
