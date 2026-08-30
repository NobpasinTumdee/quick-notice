import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { Celebration } from '../hooks/useCompanion'
import { formatApprox, formatCountdown, greeting } from '../lib/format'
import { REMINDERS, REMINDER_MAP, pickOne } from '../lib/reminders'
import type { Theme } from '../lib/themes'
import type { MascotMood, PlayerState, ReminderId, Schedule, Settings, Stats } from '../lib/types'
import { GlassCard } from './GlassCard'
import { LevelBar } from './LevelBar'
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

  // The soonest enabled reminder is the one the hero card is about.
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

  const doneToday = Object.values(stats.completedToday).reduce((a, b) => a + b, 0)

  const complete = async (id: ReminderId) => {
    setFlash({ mood: 'happy', line: pickOne(REMINDER_MAP[id].praise) })
    await onComplete(id)
  }

  return (
    <div className="kw-scroll relative flex min-h-0 flex-1 flex-col overflow-y-auto px-3.5 pb-2">
      {/* Momo stays pinned while the habits below scroll under her. */}
      <div
        className="sticky top-0 z-10 -mx-3.5 flex flex-col items-center px-3.5 pb-3 pt-0.5 backdrop-blur-sm"
        style={{
          background:
            'linear-gradient(to bottom, rgb(var(--kw-bg-start) / 0.92) 62%, rgb(var(--kw-bg-start) / 0))',
        }}
      >
        <SpeechBubble text={bubble} animationKey={bubbleKey} />
        <div className="relative">
          <Mascot
            mood={mood}
            palette={theme.mascot}
            equipped={player.eq}
            size={132}
            onPoke={() => setFlash({ mood: 'wink', line: pickOne(POKE_LINES) })}
          />
          <RewardFloat celebration={celebration} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5">
        <GlassCard tone="raised" className="px-3 py-2.5">
          <LevelBar player={player} showBadge={false} showCoins={false} />
          <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-2 text-[10.5px] font-bold">
            <span className="text-inkSoft">
              🔥 {stats.streakDays}-day streak
            </span>
            <span className="text-accentDeep">
              {doneToday === 0 ? 'no habits yet today' : `${doneToday} done today`}
            </span>
          </div>
        </GlassCard>

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
              className="flex items-center gap-2.5 px-3 py-2.5"
              style={{
                boxShadow: due ? '0 0 0 3px rgb(var(--kw-accent) / 0.22)' : undefined,
              }}
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-[17px] shadow-pill"
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

        <section className="flex flex-col gap-1.5">
          <h2 className="px-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-inkSoft">
            Today
          </h2>
          {REMINDERS.map((meta, i) => (
            <HabitRow
              key={meta.id}
              index={i}
              meta={meta}
              enabled={settings.reminders[meta.id].enabled}
              at={schedule[meta.id] ?? null}
              doneCount={stats.completedToday[meta.id]}
              now={now}
              onComplete={() => void complete(meta.id)}
            />
          ))}
        </section>

        <p className="mt-auto pb-1 pt-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-inkFaint">
          {stats.totalCompleted} healthy moments all-time
        </p>
      </div>
    </div>
  )
}

/** One habit as a full-width row — the side panel has height to spend. */
function HabitRow({
  meta,
  index,
  enabled,
  at,
  doneCount,
  now,
  onComplete,
}: {
  meta: (typeof REMINDERS)[number]
  index: number
  enabled: boolean
  at: number | null
  doneCount: number
  now: number
  onComplete: () => void
}) {
  const ready = enabled && at !== null && at - now <= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index, type: 'spring', stiffness: 380, damping: 28 }}
      className={`flex items-center gap-2.5 rounded-2xl border border-edge/40 px-2.5 py-2 shadow-pill backdrop-blur-xl ${
        enabled ? '' : 'opacity-40'
      }`}
      style={{ background: 'rgb(var(--kw-surface) / var(--kw-glass-soft))' }}
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[15px]"
        style={{ background: `linear-gradient(140deg, ${meta.tint.from}, ${meta.tint.to})` }}
      >
        {meta.emoji}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-bold leading-tight text-ink">{meta.label}</p>
        <p className="truncate text-[10px] font-medium text-inkFaint">
          {!enabled ? 'paused' : ready ? 'ready now' : at ? `in ${formatCountdown(at, now)}` : '—'}
        </p>
      </div>

      {doneCount > 0 && (
        <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-black text-accentDeep">
          ×{doneCount}
        </span>
      )}

      <motion.button
        type="button"
        disabled={!enabled}
        onClick={onComplete}
        whileHover={enabled ? { y: -1, scale: 1.05 } : undefined}
        whileTap={enabled ? { scale: 0.93 } : undefined}
        transition={{ type: 'spring', stiffness: 520, damping: 24 }}
        aria-label={`Mark ${meta.label.toLowerCase()} done`}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-black focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 ${
          ready ? 'text-white shadow-float' : 'border border-edge/50 text-inkSoft'
        }`}
        style={
          ready
            ? { background: 'rgb(var(--kw-accent))' }
            : { background: 'rgb(var(--kw-surface) / var(--kw-glass-soft))' }
        }
      >
        ✓
      </motion.button>
    </motion.div>
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
          className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-black text-white shadow-float"
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
