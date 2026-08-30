import { motion } from 'framer-motion'
import { currentSurface } from '../lib/surface'
import type { ViewMode } from '../lib/types'

interface ViewModePickerProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

const MODES: { id: ViewMode; label: string; blurb: string }[] = [
  { id: 'sidepanel', label: 'Side panel', blurb: 'Stays open beside tabs' },
  { id: 'popup', label: 'Popup', blurb: 'Small floating window' },
]

/** Chooses which surface the toolbar icon opens. */
export function ViewModePicker({ value, onChange }: ViewModePickerProps) {
  const here = currentSurface()

  return (
    <div className="grid grid-cols-2 gap-2">
      {MODES.map((mode) => {
        const active = mode.id === value
        return (
          <motion.button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 460, damping: 26 }}
            role="radio"
            aria-checked={active}
            className="flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-2.5 text-center backdrop-blur-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25"
            style={{
              background: 'rgb(var(--kw-surface) / var(--kw-glass-soft))',
              borderColor: active ? 'rgb(var(--kw-accent))' : 'rgb(var(--kw-edge) / 0.4)',
              boxShadow: active ? '0 0 0 3px rgb(var(--kw-accent) / 0.2)' : undefined,
            }}
          >
            <SurfaceDiagram mode={mode.id} active={active} />
            <span className="text-[11.5px] font-bold leading-tight text-ink">{mode.label}</span>
            <span className="text-[9.5px] font-medium leading-tight text-inkFaint">
              {mode.blurb}
            </span>
            {here === mode.id && (
              <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-accentDeep">
                you are here
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

/** A tiny browser window showing where the UI appears. */
function SurfaceDiagram({ mode, active }: { mode: ViewMode; active: boolean }) {
  const accent = active ? 'rgb(var(--kw-accent))' : 'rgb(var(--kw-ink) / 0.3)'
  return (
    <svg viewBox="0 0 56 36" width="56" height="36" aria-hidden>
      <rect
        x="1.5"
        y="1.5"
        width="53"
        height="33"
        rx="4.5"
        fill="rgb(var(--kw-surface) / 0.55)"
        stroke="rgb(var(--kw-ink) / 0.18)"
        strokeWidth="1.5"
      />
      <path d="M1.5 8.5h53" stroke="rgb(var(--kw-ink) / 0.16)" strokeWidth="1.5" />
      <circle cx="6" cy="5" r="1.2" fill="rgb(var(--kw-ink) / 0.3)" />
      <circle cx="10" cy="5" r="1.2" fill="rgb(var(--kw-ink) / 0.3)" />
      <circle cx="14" cy="5" r="1.2" fill="rgb(var(--kw-ink) / 0.3)" />

      {mode === 'sidepanel' ? (
        <motion.rect
          layout
          x="38"
          y="10.5"
          width="15"
          height="22.5"
          rx="3"
          fill={accent}
          opacity={active ? 0.9 : 0.5}
        />
      ) : (
        <motion.rect
          layout
          x="34"
          y="11"
          width="18"
          height="14"
          rx="3"
          fill={accent}
          opacity={active ? 0.9 : 0.5}
        />
      )}
    </svg>
  )
}
