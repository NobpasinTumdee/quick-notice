import { motion } from 'framer-motion'
import { formatMinutes } from '../lib/format'

interface IntervalSliderProps {
  choices: number[]
  value: number
  onChange: (minutes: number) => void
  disabled?: boolean
  accent?: string
}

/**
 * A range input snapped to a curated list of intervals — sliding between
 * 15 / 20 / 30 / 45 min beats scrubbing a raw 1–120 continuum.
 */
export function IntervalSlider({
  choices,
  value,
  onChange,
  disabled = false,
  accent,
}: IntervalSliderProps) {
  const index = Math.max(0, choices.indexOf(value))
  const max = choices.length - 1
  const pct = max === 0 ? 0 : (index / max) * 100
  const color = accent ?? 'rgb(var(--kw-accent))'

  return (
    <div className={disabled ? 'pointer-events-none opacity-40' : ''}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-inkFaint">
          Every
        </span>
        <motion.span
          key={value}
          initial={{ y: -4, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 26 }}
          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{ background: 'rgb(var(--kw-accent-soft))', color: 'rgb(var(--kw-accent-deep))' }}
        >
          {formatMinutes(value)}
        </motion.span>
      </div>

      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-ink/10" />
        <div
          className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full transition-[width] duration-200"
          style={{ width: `calc(${pct}% )`, background: color }}
        />
        {choices.map((choice, i) => (
          <span
            key={choice}
            className="absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${(i / max) * 100}%`,
              background: i <= index ? 'rgb(255 255 255 / 0.85)' : 'rgb(var(--kw-ink) / 0.22)',
            }}
          />
        ))}
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={index}
          aria-label="Reminder interval"
          aria-valuetext={formatMinutes(value)}
          onChange={(e) => onChange(choices[Number(e.target.value)])}
          className="kw-range absolute inset-0 w-full cursor-grab active:cursor-grabbing"
          style={{ ['--kw-thumb' as string]: color }}
        />
      </div>
    </div>
  )
}
