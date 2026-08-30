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
