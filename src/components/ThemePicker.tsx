import { motion } from 'framer-motion'
import { isThemeUnlocked, THEME_UNLOCK_LEVEL } from '../lib/gamification'
import { THEMES } from '../lib/themes'
import type { PlayerState, ThemeId } from '../lib/types'

interface ThemePickerProps {
  value: ThemeId
  player: PlayerState
  onChange: (theme: ThemeId) => void
  onLocked: (theme: ThemeId, level: number) => void
}

export function ThemePicker({ value, player, onChange, onLocked }: ThemePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {THEMES.map((theme) => {
        const active = theme.id === value
        const unlocked = isThemeUnlocked(player, theme.id)
        const requiredLevel = THEME_UNLOCK_LEVEL[theme.id]
        return (
          <motion.button
            key={theme.id}
            type="button"
            onClick={() =>
              unlocked ? onChange(theme.id) : onLocked(theme.id, requiredLevel)
            }
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 460, damping: 26 }}
            aria-pressed={active}
            aria-disabled={!unlocked}
            className="relative flex items-center gap-2 overflow-hidden rounded-2xl border px-2.5 py-2 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25"
            style={{
              background: `linear-gradient(135deg, ${theme.swatch[0]}, ${theme.swatch[1]})`,
              borderColor: active ? 'rgb(var(--kw-accent))' : 'rgb(var(--kw-edge) / 0.4)',
              boxShadow: active ? '0 0 0 3px rgb(var(--kw-accent) / 0.22)' : undefined,
              filter: unlocked ? undefined : 'grayscale(0.75)',
              opacity: unlocked ? 1 : 0.55,
            }}
          >
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/75 text-[12px] shadow-sm"
              aria-hidden
            >
              {theme.emoji}
            </span>
            <span
              className="truncate text-[11px] font-bold drop-shadow-sm"
              style={{ color: theme.scheme === 'dark' ? '#F4F0FF' : '#26313a' }}
            >
              {theme.name}
            </span>
            {!unlocked && (
              <span className="ml-auto shrink-0 rounded-full bg-white/85 px-1.5 py-0.5 text-[9px] font-black text-slate-600">
                🔒 {requiredLevel}
              </span>
            )}
            {active && unlocked && (
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 620, damping: 22 }}
                className="ml-auto grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white/90 text-[9px] font-black text-slate-700"
              >
                ✓
              </motion.span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
