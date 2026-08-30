import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import type { Celebration } from '../hooks/useCompanion'
import { ITEMS, SOUNDS, THEME_UNLOCK_LEVEL } from '../lib/gamification'
import { THEMES, type Theme } from '../lib/themes'
import { Mascot } from './Mascot'
import type { PlayerState } from '../lib/types'

interface LevelUpOverlayProps {
  celebration: Celebration | null
  player: PlayerState
  theme: Theme
  onDismiss: () => void
}

/** Full-popup "you levelled up" moment, listing exactly what just opened up. */
export function LevelUpOverlay({ celebration, player, theme, onDismiss }: LevelUpOverlayProps) {
  const showing = !!celebration && celebration.levelsGained > 0

  useEffect(() => {
    if (!showing) return
    const timer = window.setTimeout(onDismiss, 5200)
    return () => window.clearTimeout(timer)
  }, [showing, onDismiss])

  const level = celebration?.level ?? player.l
  const unlocks = [
    ...ITEMS.filter((i) => i.level === level).map((i) => `${i.name} in the shop`),
    ...THEMES.filter((t) => THEME_UNLOCK_LEVEL[t.id] === level).map((t) => `${t.name} theme`),
    ...SOUNDS.filter((s) => s.level === level).map((s) => `${s.name} sound`),
  ]

  return (
    <AnimatePresence>
      {showing && celebration && (
        <motion.div
          role="dialog"
          aria-label={`Level ${level} reached`}
          onClick={onDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex cursor-pointer flex-col items-center justify-center gap-2 px-6 backdrop-blur-md"
          style={{ background: 'rgb(var(--kw-bg-end) / 0.78)' }}
        >
          <Confetti />

          <motion.div
            initial={{ scale: 0.6, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          >
            <Mascot mood="excited" palette={theme.mascot} equipped={player.eq} size={118} />
          </motion.div>

          <motion.p
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 460, damping: 16 }}
            className="text-[26px] font-black leading-none text-ink drop-shadow-sm"
          >
            Level {celebration.level}!
          </motion.p>

          <p className="text-[12px] font-bold text-accentDeep">
            +{celebration.exp} EXP · +{celebration.coins} coins
          </p>

          {unlocks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-1 w-full rounded-2xl border border-edge/50 px-3 py-2 text-center backdrop-blur-xl"
              style={{ background: 'rgb(var(--kw-surface) / var(--kw-glass))' }}
            >
              <p className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-inkFaint">
                Unlocked
              </p>
              {unlocks.slice(0, 3).map((line) => (
                <p key={line} className="text-[11.5px] font-bold text-ink">
                  {line}
                </p>
              ))}
            </motion.div>
          )}

          <button
            type="button"
            onClick={onDismiss}
            className="mt-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-inkFaint focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25"
          >
            tap to continue
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 14 }, (_, i) => i)
  const colors = ['#f4749b', '#ffd85e', '#7dc45e', '#7dd3fc', '#c8b6ff']
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-2 rounded-[2px]"
          style={{ left: `${6 + (i * 89) % 88}%`, background: colors[i % colors.length] }}
          initial={{ y: -20, rotate: 0, opacity: 0 }}
          animate={{ y: 460, rotate: 420, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.4 + (i % 4) * 0.4, delay: (i % 6) * 0.12, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}
