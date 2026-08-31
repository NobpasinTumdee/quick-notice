import type { ThemeId } from './types'

export interface MascotPalette {
  bodyFrom: string
  bodyTo: string
  leaf: string
  cheek: string
  eye: string
  shine: string
}

export interface Theme {
  id: ThemeId
  name: string
  emoji: string
  scheme: 'light' | 'dark'
  /** Two-stop swatch used by the theme picker. */
  swatch: [string, string]
  mascot: MascotPalette
  /** CSS custom properties, as "R G B" triplets for Tailwind's alpha syntax. */
  vars: Record<string, string>
}

/**
 * Order is part of the save format: `PlayerState['t']` is a bitmask indexed by
 * position here, so new themes are only ever **appended**. Reordering this array
 * would silently hand existing players a different set of unlocks.
 */
export const THEMES: Theme[] = [
  {
    id: 'matcha',
    name: 'Matcha Green',
    emoji: '🍵',
    scheme: 'light',
    swatch: ['#d7ecd2', '#57a05a'],
    mascot: {
      bodyFrom: '#FFFDF3',
      bodyTo: '#E6F2D5',
      leaf: '#57a05a',
      cheek: '#f7b7c0',
      eye: '#35402f',
      shine: '#ffffff',
    },
    vars: {
      '--kw-bg-start': '242 248 236',
      '--kw-bg-end': '211 235 208',
      '--kw-surface': '255 255 255',
      '--kw-surface-strong': '255 255 255',
      '--kw-glass': '0.55',
      '--kw-glass-soft': '0.34',
      '--kw-edge': '255 255 255',
      '--kw-ink': '36 66 44',
      '--kw-ink-soft': '74 107 82',
      '--kw-ink-faint': '125 151 127',
      '--kw-accent': '87 160 90',
      '--kw-accent-soft': '215 236 210',
      '--kw-accent-deep': '47 107 58',
      '--kw-blush': '247 183 192',
      '--kw-shadow': '47 107 58',
    },
  },
  {
    id: 'sakura',
    name: 'Sakura Pink',
    emoji: '🌸',
    scheme: 'light',
    swatch: ['#ffd9e6', '#ef7fa6'],
    mascot: {
      bodyFrom: '#FFF9FB',
      bodyTo: '#FFE0EC',
      leaf: '#ef7fa6',
      cheek: '#ff9ec0',
      eye: '#4a2c38',
      shine: '#ffffff',
    },
    vars: {
      '--kw-bg-start': '255 241 245',
      '--kw-bg-end': '255 214 228',
      '--kw-surface': '255 255 255',
      '--kw-surface-strong': '255 255 255',
      '--kw-glass': '0.55',
      '--kw-glass-soft': '0.34',
      '--kw-edge': '255 255 255',
      '--kw-ink': '90 42 61',
      '--kw-ink-soft': '141 92 112',
      '--kw-ink-faint': '185 142 160',
      '--kw-accent': '239 127 166',
      '--kw-accent-soft': '255 220 232',
      '--kw-accent-deep': '176 58 107',
      '--kw-blush': '255 158 192',
      '--kw-shadow': '176 58 107',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    emoji: '🌊',
    scheme: 'light',
    swatch: ['#cfe6fb', '#3b9ede'],
    mascot: {
      bodyFrom: '#F7FCFF',
      bodyTo: '#D9ECFB',
      leaf: '#3b9ede',
      cheek: '#ffb3c7',
      eye: '#1d3a52',
      shine: '#ffffff',
    },
    vars: {
      '--kw-bg-start': '238 246 255',
      '--kw-bg-end': '203 228 251',
      '--kw-surface': '255 255 255',
      '--kw-surface-strong': '255 255 255',
      '--kw-glass': '0.55',
      '--kw-glass-soft': '0.34',
      '--kw-edge': '255 255 255',
      '--kw-ink': '18 58 92',
      '--kw-ink-soft': '61 102 133',
      '--kw-ink-faint': '113 150 179',
      '--kw-accent': '59 158 222',
      '--kw-accent-soft': '208 232 250',
      '--kw-accent-deep': '20 86 127',
      '--kw-blush': '255 179 199',
      '--kw-shadow': '20 86 127',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    scheme: 'dark',
    swatch: ['#2a2745', '#a78bfa'],
    mascot: {
      bodyFrom: '#403A6B',
      bodyTo: '#2A2648',
      leaf: '#a78bfa',
      cheek: '#e07fa8',
      eye: '#F4F0FF',
      shine: '#cdbcff',
    },
    vars: {
      '--kw-bg-start': '31 29 52',
      '--kw-bg-end': '14 14 28',
      '--kw-surface': '255 255 255',
      '--kw-surface-strong': '255 255 255',
      '--kw-glass': '0.10',
      '--kw-glass-soft': '0.06',
      '--kw-edge': '255 255 255',
      '--kw-ink': '243 239 253',
      '--kw-ink-soft': '196 189 217',
      '--kw-ink-faint': '143 136 168',
      '--kw-accent': '167 139 250',
      '--kw-accent-soft': '58 47 92',
      '--kw-accent-deep': '216 202 255',
      '--kw-blush': '224 127 168',
      '--kw-shadow': '5 3 18',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Peach',
    emoji: '🌇',
    scheme: 'light',
    swatch: ['#ffe2cf', '#f97362'],
    mascot: {
      bodyFrom: '#FFFBF6',
      bodyTo: '#FFE3D2',
      leaf: '#f97362',
      cheek: '#ff9a8b',
      eye: '#5b2b28',
      shine: '#ffffff',
    },
    vars: {
      '--kw-bg-start': '255 243 234',
      '--kw-bg-end': '255 214 194',
      '--kw-surface': '255 255 255',
      '--kw-surface-strong': '255 255 255',
      '--kw-glass': '0.55',
      '--kw-glass-soft': '0.34',
      '--kw-edge': '255 255 255',
      '--kw-ink': '91 43 40',
      '--kw-ink-soft': '140 84 74',
      '--kw-ink-faint': '190 137 122',
      '--kw-accent': '249 115 98',
      '--kw-accent-soft': '255 224 210',
      '--kw-accent-deep': '183 58 46',
      '--kw-blush': '255 154 139',
      '--kw-shadow': '183 58 46',
    },
  },
  {
    id: 'cafe',
    name: 'Cozy Cafe',
    emoji: '☕',
    scheme: 'light',
    swatch: ['#f0e2d0', '#a9714b'],
    mascot: {
      bodyFrom: '#FFFAF2',
      bodyTo: '#F0DFC8',
      leaf: '#a9714b',
      cheek: '#e8a887',
      eye: '#4a3323',
      shine: '#ffffff',
    },
    vars: {
      '--kw-bg-start': '250 242 231',
      '--kw-bg-end': '229 209 185',
      '--kw-surface': '255 253 249',
      '--kw-surface-strong': '255 255 255',
      '--kw-glass': '0.58',
      '--kw-glass-soft': '0.36',
      '--kw-edge': '255 255 255',
      '--kw-ink': '74 51 35',
      '--kw-ink-soft': '120 90 68',
      '--kw-ink-faint': '169 141 118',
      '--kw-accent': '169 113 75',
      '--kw-accent-soft': '240 226 208',
      '--kw-accent-deep': '112 69 41',
      '--kw-blush': '232 168 135',
      '--kw-shadow': '112 69 41',
    },
  },
  {
    id: 'lofi',
    name: 'Lofi Chill',
    emoji: '🎸',
    scheme: 'light',
    swatch: ['#dfe3f0', '#8f9ccc'],
    mascot: {
      bodyFrom: '#FBFAFF',
      bodyTo: '#E2E4F2',
      leaf: '#9aa7d8',
      cheek: '#d7b6d8',
      eye: '#454a63',
      shine: '#ffffff',
    },
    vars: {
      '--kw-bg-start': '241 242 249',
      '--kw-bg-end': '213 216 234',
      '--kw-surface': '253 253 255',
      '--kw-surface-strong': '255 255 255',
      '--kw-glass': '0.56',
      '--kw-glass-soft': '0.34',
      '--kw-edge': '255 255 255',
      '--kw-ink': '69 74 99',
      '--kw-ink-soft': '110 116 146',
      '--kw-ink-faint': '155 160 186',
      '--kw-accent': '143 156 204',
      '--kw-accent-soft': '223 227 240',
      '--kw-accent-deep': '88 100 148',
      '--kw-blush': '215 182 216',
      '--kw-shadow': '88 100 148',
    },
  },
  {
    id: 'nebula',
    name: 'Galactic Nebula',
    emoji: '🌌',
    scheme: 'dark',
    swatch: ['#2b1b4d', '#ff5fd2'],
    mascot: {
      bodyFrom: '#4B3A7E',
      bodyTo: '#2A1E52',
      leaf: '#7de3ff',
      cheek: '#ff5fd2',
      eye: '#F6EEFF',
      shine: '#c9b6ff',
    },
    vars: {
      '--kw-bg-start': '43 27 77',
      '--kw-bg-end': '9 10 35',
      '--kw-surface': '255 255 255',
      '--kw-surface-strong': '255 255 255',
      '--kw-glass': '0.11',
      '--kw-glass-soft': '0.07',
      '--kw-edge': '255 255 255',
      '--kw-ink': '246 238 255',
      '--kw-ink-soft': '199 186 232',
      '--kw-ink-faint': '146 134 185',
      '--kw-accent': '255 95 210',
      '--kw-accent-soft': '74 38 96',
      '--kw-accent-deep': '255 176 235',
      '--kw-blush': '125 227 255',
      '--kw-shadow': '4 2 22',
    },
  },
  {
    id: 'mecha',
    name: 'Mecha Strike',
    emoji: '🤖',
    scheme: 'light',
    swatch: ['#eef1f6', '#d81f30'],
    mascot: {
      bodyFrom: '#FFFFFF',
      bodyTo: '#DDE3EC',
      leaf: '#1f6fd8',
      cheek: '#f2b705',
      eye: '#1b2430',
      shine: '#ffffff',
    },
    vars: {
      '--kw-bg-start': '246 248 251',
      '--kw-bg-end': '211 219 231',
      '--kw-surface': '255 255 255',
      '--kw-surface-strong': '255 255 255',
      '--kw-glass': '0.62',
      '--kw-glass-soft': '0.4',
      '--kw-edge': '255 255 255',
      '--kw-ink': '27 36 48',
      '--kw-ink-soft': '73 86 104',
      '--kw-ink-faint': '133 146 165',
      '--kw-accent': '216 31 48',
      '--kw-accent-soft': '255 224 226',
      '--kw-accent-deep': '150 15 28',
      '--kw-blush': '242 183 5',
      '--kw-shadow': '31 111 216',
    },
  },
  {
    id: 'cyber',
    name: 'Cyber Hacker',
    emoji: '💻',
    scheme: 'dark',
    swatch: ['#050806', '#22ff88'],
    mascot: {
      bodyFrom: '#1B2A1F',
      bodyTo: '#0B140D',
      leaf: '#22ff88',
      cheek: '#118f4d',
      eye: '#B9FFD6',
      shine: '#22ff88',
    },
    vars: {
      '--kw-bg-start': '8 12 9',
      '--kw-bg-end': '0 0 0',
      '--kw-surface': '34 255 136',
      '--kw-surface-strong': '34 255 136',
      '--kw-glass': '0.07',
      '--kw-glass-soft': '0.04',
      '--kw-edge': '34 255 136',
      '--kw-ink': '198 255 222',
      '--kw-ink-soft': '110 214 158',
      '--kw-ink-faint': '70 150 108',
      '--kw-accent': '34 255 136',
      '--kw-accent-soft': '10 46 27',
      '--kw-accent-deep': '150 255 199',
      '--kw-blush': '0 214 255',
      '--kw-shadow': '0 0 0',
    },
  },
]

export const THEME_MAP: Record<ThemeId, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
) as Record<ThemeId, Theme>

/** Paints a theme onto <html>. Cheap enough to call on every change. */
export function applyTheme(id: ThemeId): Theme {
  const theme = THEME_MAP[id] ?? THEME_MAP.matcha
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value)
  }
  root.dataset.theme = theme.id
  root.dataset.scheme = theme.scheme
  root.style.colorScheme = theme.scheme
  return theme
}
