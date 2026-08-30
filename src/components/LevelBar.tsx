import { motion } from 'framer-motion'
import { levelProgress, MAX_LEVEL } from '../lib/gamification'
import type { PlayerState } from '../lib/types'

interface LevelBarProps {
  player: PlayerState
  /** Off where the header ring already shows the level. */
  showBadge?: boolean
  /** Off where the header already shows the purse. */
  showCoins?: boolean
}

/** Level + EXP bar (+ purse where it isn't already on screen). */
export function LevelBar({ player, showBadge = true, showCoins = true }: LevelBarProps) {
  const progress = levelProgress(player)

  return (
    <div className="flex items-center gap-2.5">
      {showBadge && (
        <motion.div
          key={player.l}
          initial={{ scale: 0.7, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 18 }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-white shadow-float"
          style={{
            background:
              'linear-gradient(140deg, rgb(var(--kw-accent)), rgb(var(--kw-accent-deep)))',
          }}
        >
          <span className="text-[13px] font-black leading-none">{player.l}</span>
        </motion.div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 whitespace-nowrap">
          <span className="text-[11px] font-extrabold text-ink">
            {progress.maxed ? `Level ${MAX_LEVEL}` : `Level ${player.l}`}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-inkFaint">
            {progress.maxed ? 'max' : `${progress.exp} / ${progress.need} exp`}
          </span>
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink/10">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, rgb(var(--kw-accent)), rgb(var(--kw-blush)))',
            }}
            initial={false}
            animate={{ width: `${Math.round(progress.pct * 100)}%` }}
            transition={{ type: 'spring', stiffness: 220, damping: 30 }}
          />
        </div>
      </div>

      {showCoins && <CoinPurse coins={player.c} />}
    </div>
  )
}

export function CoinPurse({ coins }: { coins: number }) {
  return (
    <motion.div
      key={coins}
      initial={{ scale: 0.88 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
      className="flex shrink-0 items-center gap-1 rounded-full border border-edge/50 px-2 py-1 text-[11px] font-bold text-ink backdrop-blur-md"
      style={{ background: 'rgb(var(--kw-surface) / var(--kw-glass-soft))' }}
      title={`${coins} coins`}
    >
      <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-amber-300 text-[8px] font-black text-amber-800">
        ¢
      </span>
      {coins}
    </motion.div>
  )
}
