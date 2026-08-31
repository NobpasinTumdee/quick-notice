import { motion } from 'framer-motion'
import { useState } from 'react'
import { formatMinutes } from '../lib/format'
import { clampInterval, INTERVAL_MAX, INTERVAL_MIN } from '../lib/reminders'

interface IntervalSliderProps {
  value: number
  onChange: (minutes: number) => void
  disabled?: boolean
  accent?: string
  /** Names the control for screen readers, e.g. "Hydration". */
  label: string
}

/** Minor ticks, purely as landmarks on a 180-stop track — the slider never snaps. */
const TICKS = [15, 30, 60, 90, 120, 150]

const pctFor = (minutes: number) => ((minutes - INTERVAL_MIN) / (INTERVAL_MAX - INTERVAL_MIN)) * 100

/**
 * Interval picker with one-minute granularity: drag for the feel of it, or type
 * the exact number. The two inputs are the same value — the box is not a
 * separate setting, it is the slider's readout made editable, which is the only
 * honest way to offer 180 discrete stops in ~200px.
 */
export function IntervalSlider({
  value,
  onChange,
  disabled = false,
  accent,
  label,
}: IntervalSliderProps) {
  /**
   * What the box shows *while being typed*. Held apart from `value` so an
   * intermediate state — "1" on the way to "15", or a cleared field — is not
   * committed as a real interval and pushed at the alarms.
   */
  const [draft, setDraft] = useState<string | null>(null)
  const color = accent ?? 'rgb(var(--kw-accent))'
  const pct = pctFor(value)

  const commit = (raw: string) => {
    setDraft(null)
    const trimmed = raw.trim()
    // Empty or unreadable input reverts to the stored value rather than
    // silently becoming 1 minute.
    if (trimmed === '') return
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) return
    const minutes = clampInterval(parsed)
    if (minutes !== value) onChange(minutes)
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-40' : ''}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-inkFaint">
          Every
        </span>

        <div className="flex items-center gap-1.5">
          {/* Only shown past the hour, where "90" alone stops being readable. */}
          {value >= 60 && (
            <motion.span
              key={formatMinutes(value)}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
              className="text-[9.5px] font-semibold text-inkFaint"
            >
              {formatMinutes(value)}
            </motion.span>
          )}

          <label
            className="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2 focus-within:ring-4 focus-within:ring-accent/20"
            style={{ background: 'rgb(var(--kw-accent-soft))' }}
          >
            <span className="sr-only">{label} interval in minutes</span>
            <input
              type="number"
              inputMode="numeric"
              min={INTERVAL_MIN}
              max={INTERVAL_MAX}
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
            <span className="text-[10px] font-bold" style={{ color: 'rgb(var(--kw-accent-deep))' }}>
              min
            </span>
          </label>
        </div>
      </div>

      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-ink/10" />
        <div
          className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
        {TICKS.map((tick) => (
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
          min={INTERVAL_MIN}
          max={INTERVAL_MAX}
          step={1}
          value={value}
          disabled={disabled}
          aria-label={`${label} interval`}
          aria-valuetext={formatMinutes(value)}
          onChange={(e) => onChange(clampInterval(e.target.value))}
          className="kw-range absolute inset-0 w-full cursor-grab active:cursor-grabbing"
          style={{ ['--kw-thumb' as string]: color }}
        />
      </div>
    </div>
  )
}
