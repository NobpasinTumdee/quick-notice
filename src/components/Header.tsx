import { motion } from 'framer-motion'
import { levelProgress } from '../lib/gamification'
import type { PlayerState } from '../lib/types'
import { CoinPurse } from './LevelBar'

interface HeaderProps {
  streak: number
  player: PlayerState
  subtitle: string
}

export function Header({ streak, player, subtitle }: HeaderProps) {
  const progress = levelProgress(player)

  return (
    <header
      className="flex shrink-0 items-center gap-2 px-3.5 pb-1.5 pt-3 backdrop-blur-sm"
      // Matches the sticky mascot band below it, so the two read as one surface
      // instead of meeting at a visible seam.
      style={{ background: 'rgb(var(--kw-bg-start) / 0.92)' }}
    >
      <LevelRing level={player.l} pct={progress.pct} />

      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[14px] font-extrabold leading-tight tracking-tight text-ink">
          Momo <span className="text-inkFaint">·</span>{' '}
          <span className="text-accentDeep">wellness</span>
        </span>
        <span className="truncate text-[9.5px] font-medium uppercase tracking-[0.14em] text-inkFaint">
          {subtitle}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1 rounded-full border border-edge/50 px-2 py-1 text-[11px] font-bold text-ink backdrop-blur-md"
          style={{ background: 'rgb(var(--kw-surface) / var(--kw-glass-soft))' }}
          title={`${streak}-day streak`}
        >
          <span className="text-[11px] leading-none">🔥</span>
          {streak}
        </motion.div>
        <CoinPurse coins={player.c} />
      </div>
    </header>
  )
}

/** Level badge wrapped in a circular EXP gauge — progress is always on screen. */
function LevelRing({ level, pct }: { level: number; pct: number }) {
  const r = 15
  const circumference = 2 * Math.PI * r
  return (
    <div className="relative grid h-9 w-9 shrink-0 place-items-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgb(var(--kw-ink) / 0.12)" strokeWidth="4" />
        <motion.circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="rgb(var(--kw-accent))"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />
      </svg>
      <motion.span
        key={level}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 18 }}
        className="text-[12px] font-black text-ink"
      >
        {level}
      </motion.span>
    </div>
  )
}
