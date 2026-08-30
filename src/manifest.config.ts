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
    default_popup: 'index.html',
    default_title: 'Kawaii Wellness Companion',
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
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['storage', 'alarms', 'notifications', 'offscreen'],
  web_accessible_resources: [
    {
      resources: ['icons/*.png'],
      matches: ['<all_urls>'],
    },
  ],
})
