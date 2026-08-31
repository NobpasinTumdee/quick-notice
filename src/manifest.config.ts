import { defineManifest } from '@crxjs/vite-plugin'
import pkg from '../package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Kawaii Wellness Companion',
  short_name: 'Kawaii Wellness',
  version: pkg.version,
  description:
    'A cute mascot that gently reminds you to hydrate, stretch, fix your posture and rest your eyes.',
  action: {
    // No default_popup: clicking the icon opens the side panel instead, wired up
    // by `sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` in the
    // service worker.
    default_title: 'Open Momo · Kawaii Wellness',
    default_icon: {
      '16': 'icons/icon16.png',
      '32': 'icons/icon32.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
  },
  icons: {
    '16': 'icons/icon16.png',
    '32': 'icons/icon32.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
  side_panel: {
    default_path: 'index.html',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  /**
   * The in-page toast. This is the one part of the extension that touches pages
   * the user browses, so it is kept deliberately thin: the entry point below
   * only registers a message listener, and React, Framer Motion and the widget
   * itself are dynamically imported the first time a nudge actually fires.
   *
   * `all_frames` stays off — one toast per page, never one per ad iframe.
   */
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
  permissions: ['storage', 'alarms', 'notifications', 'offscreen', 'sidePanel'],
  web_accessible_resources: [
    {
      resources: ['icons/*.png'],
      matches: ['<all_urls>'],
    },
  ],
})
