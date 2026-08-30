/** @type {import('tailwindcss').Config} */
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Every token is a CSS variable so themes swap instantly, with no re-render.
        bgStart: withVar('--kw-bg-start'),
        bgEnd: withVar('--kw-bg-end'),
        surface: withVar('--kw-surface'),
        surfaceStrong: withVar('--kw-surface-strong'),
        edge: withVar('--kw-edge'),
        ink: withVar('--kw-ink'),
        inkSoft: withVar('--kw-ink-soft'),
        inkFaint: withVar('--kw-ink-faint'),
        accent: withVar('--kw-accent'),
        accentSoft: withVar('--kw-accent-soft'),
        accentDeep: withVar('--kw-accent-deep'),
        blush: withVar('--kw-blush'),
      },
      fontFamily: {
        sans: [
          '"Baloo 2"',
          '"Quicksand"',
          'ui-rounded',
          '"SF Pro Rounded"',
          '"Segoe UI Variable Display"',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        glass: '0 8px 32px -8px rgb(var(--kw-shadow) / 0.30), inset 0 1px 0 0 rgb(255 255 255 / 0.35)',
        float: '0 12px 28px -10px rgb(var(--kw-shadow) / 0.45)',
        pill: '0 4px 14px -4px rgb(var(--kw-shadow) / 0.40)',
        glow: '0 0 0 4px rgb(var(--kw-accent) / 0.16)',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1) translateY(0)' },
          '50%': { transform: 'scale(1.035) translateY(-2px)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
          '50%': { transform: 'translateY(-8px) rotate(2deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pop: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '70%': { transform: 'scale(1.04)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        breathe: 'breathe 3.6s ease-in-out infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        pop: 'pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
    },
  },
  plugins: [],
}
