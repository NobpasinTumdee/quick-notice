import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { formatHour } from '../lib/format'
import { REMINDERS } from '../lib/reminders'
import type { PlayerState, ReminderId, Settings, Stats, ThemeId } from '../lib/types'
import { GlassCard } from './GlassCard'
import { IntervalSlider } from './IntervalSlider'
import { ThemePicker } from './ThemePicker'
import { Toggle } from './Toggle'
import { ViewModePicker } from './ViewModePicker'

interface SettingsViewProps {
  settings: Settings
  stats: Stats
  player: PlayerState
  onToggleReminder: (id: ReminderId, enabled: boolean) => void
  onSetInterval: (id: ReminderId, minutes: number) => void
  onSetTheme: (theme: ThemeId) => void
  onPatch: (patch: Partial<Settings>) => void
  onPreview: (id: ReminderId) => void
}

export function SettingsView({
  settings,
  stats,
  player,
  onToggleReminder,
  onSetInterval,
  onSetTheme,
  onPatch,
  onPreview,
}: SettingsViewProps) {
  const [lockNote, setLockNote] = useState<string | null>(null)

  return (
    <div className="kw-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3.5 pb-4">
      <Section title="Reminders" hint="tap the emoji to preview">
        <div className="flex flex-col gap-2">
          {REMINDERS.map((meta, i) => {
            const conf = settings.reminders[meta.id]
            return (
              <GlassCard
                key={meta.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i, type: 'spring', stiffness: 380, damping: 30 }}
                className="px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.12, rotate: -8 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onPreview(meta.id)}
                    aria-label={`Preview the ${meta.label} notification`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl text-[15px] shadow-pill focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25"
                    style={{
                      background: `linear-gradient(140deg, ${meta.tint.from}, ${meta.tint.to})`,
                    }}
                  >
                    {meta.emoji}
                  </motion.button>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold leading-tight text-ink">
                      {meta.label}
                    </p>
                    <p className="truncate text-[10.5px] font-medium text-inkFaint">
                      {meta.tagline}
                      {stats.completedToday[meta.id] > 0 && (
                        <span className="ml-1 font-bold text-accentDeep">
                          · {stats.completedToday[meta.id]} today
                        </span>
                      )}
                    </p>
                  </div>

                  <Toggle
                    checked={conf.enabled}
                    onChange={(next) => onToggleReminder(meta.id, next)}
                    label={`Toggle ${meta.label} reminders`}
                    size="sm"
                  />
                </div>

                <AnimatePresence initial={false}>
                  {conf.enabled && (
                    <motion.div
                      key="slider"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2.5">
                        <IntervalSlider
                          label={meta.label}
                          value={conf.intervalMinutes}
                          onChange={(minutes) => onSetInterval(meta.id, minutes)}
                          accent={meta.tint.to}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            )
          })}
        </div>
      </Section>

      <Section title="Open as" hint="takes effect on the next icon click">
        <ViewModePicker
          value={settings.viewMode}
          onChange={(viewMode) => onPatch({ viewMode })}
        />
      </Section>

      <Section title="Theme" hint={lockNote ?? 'earn themes by levelling up'}>
        <ThemePicker
          value={settings.theme}
          player={player}
          onChange={onSetTheme}
          onLocked={(_, level) => {
            setLockNote(`unlocks at level ${level}`)
            window.setTimeout(() => setLockNote(null), 1800)
          }}
        />
      </Section>

      <Section title="Notifications">
        <GlassCard className="flex flex-col gap-2.5 px-3 py-2.5">
          <Row
            title="Gentle nudges"
            subtitle="Silent desktop notifications from Momo"
            control={
              <Toggle
                checked={settings.notificationsEnabled}
                onChange={(next) => onPatch({ notificationsEnabled: next })}
                label="Toggle all notifications"
                size="sm"
              />
            }
          />
          <div className="h-px bg-ink/10" />
          <Row
            title="Quiet hours"
            subtitle={
              settings.quietHours.enabled
                ? `Silent ${formatHour(settings.quietHours.from)} – ${formatHour(settings.quietHours.to)}`
                : 'Momo nudges around the clock'
            }
            control={
              <Toggle
                checked={settings.quietHours.enabled}
                onChange={(next) =>
                  onPatch({ quietHours: { ...settings.quietHours, enabled: next } })
                }
                label="Toggle quiet hours"
                size="sm"
              />
            }
          />
          <AnimatePresence initial={false}>
            {settings.quietHours.enabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 pt-1">
                  <HourSelect
                    label="From"
                    value={settings.quietHours.from}
                    onChange={(from) => onPatch({ quietHours: { ...settings.quietHours, from } })}
                  />
                  <HourSelect
                    label="To"
                    value={settings.quietHours.to}
                    onChange={(to) => onPatch({ quietHours: { ...settings.quietHours, to } })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </Section>

      <p className="pt-0.5 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-inkFaint">
        {stats.totalCompleted} healthy moments all-time · streak {stats.streakDays} 🔥
      </p>
    </div>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2 px-1">
        <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-inkSoft">
          {title}
        </h2>
        {hint && <span className="text-[9.5px] font-medium text-inkFaint">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

function Row({
  title,
  subtitle,
  control,
}: {
  title: string
  subtitle: string
  control: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-bold leading-tight text-ink">{title}</p>
        <p className="truncate text-[10.5px] font-medium text-inkFaint">{subtitle}</p>
      </div>
      {control}
    </div>
  )
}

function HourSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (hour: number) => void
}) {
  return (
    <label className="flex flex-1 items-center gap-1.5 rounded-2xl border border-edge/40 px-2.5 py-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-inkFaint">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ml-auto cursor-pointer rounded-lg bg-transparent text-[11.5px] font-bold text-ink focus:outline-none"
      >
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={h} className="text-slate-800">
            {formatHour(h)}
          </option>
        ))}
      </select>
    </label>
  )
}
