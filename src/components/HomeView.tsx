import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { Celebration } from '../hooks/useCompanion'
import { formatApprox, formatCountdown, greeting } from '../lib/format'
import { REMINDERS, REMINDER_MAP, pickOne } from '../lib/reminders'
import type { Theme } from '../lib/themes'
import type { MascotMood, PlayerState, ReminderId, Schedule, Settings, Stats } from '../lib/types'
import { GlassCard } from './GlassCard'
import { Mascot } from './Mascot'
import { SpeechBubble } from './SpeechBubble'

interface HomeViewProps {
  theme: Theme
  settings: Settings
  stats: Stats
  player: PlayerState
  schedule: Schedule
  now: number
  celebration: Celebration | null
  onComplete: (id: ReminderId) => Promise<void> | void
  onSnooze: (id: ReminderId) => Promise<void> | void
}

const POKE_LINES = [
  'Boop! 💫',
  'Hehe, that tickles.',
  'You are doing great today.',
  'Sip, stretch, repeat!',
  'I believe in you 🌱',
]

export function HomeView({
  theme,
  settings,
  stats,
  player,
  schedule,
  now,
  celebration,
  onComplete,
  onSnooze,
}: HomeViewProps) {
  const [flash, setFlash] = useState<{ mood: MascotMood; line: string } | null>(null)

  // The soonest enabled reminder is the one the whole hero card is about.
  const next = useMemo(() => {
    const candidates = REMINDERS.filter((r) => settings.reminders[r.id].enabled)
      .map((r) => ({ meta: r, at: schedule[r.id] ?? null }))
      .filter((c): c is { meta: (typeof REMINDERS)[number]; at: number } => c.at !== null)
      .sort((a, b) => a.at - b.at)
    return candidates[0] ?? null
  }, [schedule, settings.reminders])

  const due = next ? next.at - now <= 0 : false

  useEffect(() => {
    if (!flash) return
    const timer = window.setTimeout(() => setFlash(null), 2200)
    return () => window.clearTimeout(timer)
  }, [flash])

  const mood: MascotMood = flash?.mood ?? (due && next ? next.meta.mood : 'idle')

  // The precise countdown lives on the hero card. Here it is rounded to whole
  // minutes so Momo is not re-reading the clock at you once a second.
  const bubble =
    flash?.line ??
    (due && next
      ? `${next.meta.emoji} ${next.meta.tagline} — time!`
      : next
        ? `${greeting()}! Next up: ${next.meta.label.toLowerCase()} ${formatApprox(next.at, now)}.`
        : 'All reminders are paused. Cosy 🫖')

  const bubbleKey = flash
    ? `flash:${flash.line}`
    : next
      ? `next:${next.meta.id}:${due ? 'due' : 'waiting'}`
      : 'idle'

  const complete = async (id: ReminderId) => {
    setFlash({ mood: 'happy', line: pickOne(REMINDER_MAP[id].praise) })
    await onComplete(id)
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-2 px-4 pb-1">
      <SpeechBubble text={bubble} animationKey={bubbleKey} />

      <div className="relative flex flex-1 items-center justify-center">
        <Mascot
          mood={mood}
          palette={theme.mascot}
          equipped={player.eq}
          size={112}
          onPoke={() => setFlash({ mood: 'wink', line: pickOne(POKE_LINES) })}
        />
        {/* Level-ups get the full overlay; ordinary rewards just float away. */}
        <RewardFloat celebration={celebration} />
      </div>

      <AnimatePresence mode="popLayout">
        {next ? (
          <GlassCard
            key={next.meta.id}
            tone="raised"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="flex items-center gap-2.5 px-3 py-2"
          >
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl text-[16px] shadow-pill"
              style={{
                background: `linear-gradient(140deg, ${next.meta.tint.from}, ${next.meta.tint.to})`,
              }}
            >
              {next.meta.emoji}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold leading-tight text-ink">
                {next.meta.label}
              </p>
              <p className="text-[11px] font-medium text-inkSoft">
                {due ? (
                  <motion.span
                    animate={{ opacity: [1, 0.45, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="font-bold text-accentDeep"
                  >
                    ready now
                  </motion.span>
                ) : (
                  <>in {formatCountdown(next.at, now)}</>
                )}
              </p>
            </div>

            <TactileButton onClick={() => void complete(next.meta.id)} variant="primary">
              Done ✓
            </TactileButton>
            <TactileButton onClick={() => void onSnooze(next.meta.id)} variant="ghost">
              +5m
            </TactileButton>
          </GlassCard>
        ) : null}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-2">
        {REMINDERS.map((meta, i) => {
          const conf = settings.reminders[meta.id]
          const at = schedule[meta.id] ?? null
          return (
            <motion.button
              key={meta.id}
              type="button"
              disabled={!conf.enabled}
              onClick={() => void complete(meta.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, type: 'spring', stiffness: 380, damping: 28 }}
              whileHover={conf.enabled ? { y: -2, scale: 1.02 } : undefined}
              whileTap={conf.enabled ? { scale: 0.96 } : undefined}
              className={`group flex items-center gap-2 rounded-2xl border border-edge/40 px-2.5 py-1.5 text-left shadow-pill backdrop-blur-xl transition-opacity focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 ${
                conf.enabled ? '' : 'opacity-40'
              }`}
              style={{ background: 'rgb(var(--kw-surface) / var(--kw-glass-soft))' }}
              title={conf.enabled ? `Mark ${meta.label.toLowerCase()} done` : `${meta.label} is off`}
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-xl text-[14px]"
                style={{
                  background: `linear-gradient(140deg, ${meta.tint.from}, ${meta.tint.to})`,
                }}
              >
                {meta.emoji}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11.5px] font-bold leading-tight text-ink">
                  {meta.label}
                </span>
                <span className="block truncate text-[10px] font-medium text-inkFaint">
                  {conf.enabled && at ? formatCountdown(at, now) : 'paused'}
                  {stats.completedToday[meta.id] > 0 && (
                    <span className="ml-1 text-accentDeep">·{stats.completedToday[meta.id]}</span>
                  )}
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/** "+13 EXP · +7 ¢" drifting up off the mascot after a completion. */
function RewardFloat({ celebration }: { celebration: Celebration | null }) {
  const show = !!celebration && celebration.levelsGained === 0
  return (
    <AnimatePresence>
      {show && celebration && (
        <motion.div
          key={celebration.id}
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: [0, 1, 1, 0], y: -46, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, times: [0, 0.15, 0.7, 1] }}
          className="pointer-events-none absolute top-2 rounded-full px-2.5 py-1 text-[11px] font-black text-white shadow-float"
          style={{ background: 'rgb(var(--kw-accent))' }}
        >
          +{celebration.exp} EXP · +{celebration.coins} ¢
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TactileButton({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode
  onClick: () => void
  variant: 'primary' | 'ghost'
}) {
  const primary = variant === 'primary'
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1, scale: 1.04 }}
      whileTap={{ scale: 0.93, y: 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 24 }}
      className={`shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 ${
        primary ? 'text-white shadow-float' : 'border border-edge/50 text-inkSoft'
      }`}
      style={
        primary
          ? { background: 'rgb(var(--kw-accent))' }
          : { background: 'rgb(var(--kw-surface) / var(--kw-glass-soft))' }
      }
    >
      {children}
    </motion.button>
  )
}
