import { motion } from 'framer-motion'
import { useState } from 'react'

interface NumberSliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  /** Short word after the number in the pill, e.g. "min" or "s". */
  unit: string
  /** Names the control for screen readers, e.g. "Hydration interval". */
  label: string
  /** Small caps text on the left. */
  caption?: string
  /** Optional secondary readout, e.g. "1 h 24" beside "84 min". */
  hint?: (value: number) => string | null
  /** Replaces the whole readout at `min`, e.g. "until dismissed" at 0. */
  minLabel?: string
  /** Faint landmarks on the track. The slider never snaps to them. */
  ticks?: number[]
  accent?: string
  disabled?: boolean
}

/**
 * A range input paired with a typed number box, both bound to the same value.
 *
 * The box is not a second setting — it is the slider's readout made editable,
 * which is the only honest way to offer a hundred-odd discrete stops in ~200px.
 * Used for reminder intervals (1-180 min) and toast duration (0-60 s).
 */
export function NumberSlider({
  value,
  onChange,
  min,
  max,
  unit,
  label,
  caption = 'Every',
  hint,
  minLabel,
  ticks = [],
  accent,
  disabled = false,
}: NumberSliderProps) {
  /**
   * What the box shows *while being typed*. Held apart from `value` so an
   * intermediate state — "1" on the way to "15", or a cleared field — is not
   * committed as a real setting.
   */
  const [draft, setDraft] = useState<string | null>(null)
  const color = accent ?? 'rgb(var(--kw-accent))'
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)))
  const pctFor = (n: number) => ((n - min) / (max - min)) * 100
  const secondary = hint?.(value) ?? null
  const atMin = minLabel !== undefined && value === min

  const commit = (raw: string) => {
    setDraft(null)
    const trimmed = raw.trim()
    // Empty or unreadable input reverts to the stored value rather than
    // silently snapping to the minimum.
    if (trimmed === '') return
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) return
    const next = clamp(parsed)
    if (next !== value) onChange(next)
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-40' : ''}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-inkFaint">
          {caption}
        </span>

        <div className="flex items-center gap-1.5">
          {atMin ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
              style={{
                background: 'rgb(var(--kw-accent-soft))',
                color: 'rgb(var(--kw-accent-deep))',
              }}
            >
              {minLabel}
            </span>
          ) : (
            <>
              {secondary && (
                <motion.span
                  key={secondary}
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                  className="text-[9.5px] font-semibold text-inkFaint"
                >
                  {secondary}
                </motion.span>
              )}
              <label
                className="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2 focus-within:ring-4 focus-within:ring-accent/20"
                style={{ background: 'rgb(var(--kw-accent-soft))' }}
              >
                <span className="sr-only">{label}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={min}
                  max={max}
                  step={1}
                  disabled={disabled}
                  value={draft ?? String(value)}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={(e) => commit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.currentTarget.blur()
                    } else if (e.key === 'Escape') {
                      setDraft(null)
                    }
                  }}
                  className="kw-number w-[3.2ch] bg-transparent text-right text-[11.5px] font-bold tabular-nums focus:outline-none"
                  style={{ color: 'rgb(var(--kw-accent-deep))' }}
                />
                <span
                  className="text-[10px] font-bold"
                  style={{ color: 'rgb(var(--kw-accent-deep))' }}
                >
                  {unit}
                </span>
              </label>
            </>
          )}
        </div>
      </div>

      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-ink/10" />
        <div
          className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
          style={{ width: `${pctFor(value)}%`, background: color }}
        />
        {ticks.map((tick) => (
          <span
            key={tick}
            aria-hidden
            className="absolute top-1/2 h-1 w-px -translate-y-1/2 rounded-full"
            style={{
              left: `${pctFor(tick)}%`,
              background: tick <= value ? 'rgb(255 255 255 / 0.7)' : 'rgb(var(--kw-ink) / 0.18)',
            }}
          />
        ))}
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          disabled={disabled}
          aria-label={label}
          aria-valuetext={atMin ? minLabel : `${value} ${unit}`}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="kw-range absolute inset-0 w-full cursor-grab active:cursor-grabbing"
          style={{ ['--kw-thumb' as string]: color }}
        />
      </div>
    </div>
  )
}
