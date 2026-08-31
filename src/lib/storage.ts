import { clampInterval, REMINDER_IDS, REMINDERS } from './reminders'
import type { ReminderId, Schedule, Settings, Stats, ViewMode } from './types'

export const SETTINGS_KEY = 'kw:settings'
export const STATS_KEY = 'kw:stats'
/**
 * Cooldown ledger: `{ hydration: 1710000000000, … }`.
 *
 * Local, not sync. These timestamps move on every completion, snooze and alarm —
 * far too churny for sync's 1800-writes-per-hour ceiling — and a cooldown is a
 * property of the machine you are sitting at, not of the account.
 */
export const DUE_KEY = 'kw:due'

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export const VIEW_MODES: readonly ViewMode[] = ['sidepanel', 'popup'] as const

/** Seconds. 0 is legal and means "stay until dismissed". */
export const TOAST_DURATION_MAX = 60

export function defaultSettings(): Settings {
  return {
    theme: 'matcha',
    viewMode: 'sidepanel',
    notificationsEnabled: true,
    enableInPageToast: true,
    toastDuration: 10,
    quietHours: { enabled: false, from: 22, to: 8 },
    reminders: Object.fromEntries(
      REMINDERS.map((r) => [r.id, { enabled: true, intervalMinutes: r.defaultMinutes }]),
    ) as Settings['reminders'],
  }
}

export function defaultStats(): Stats {
  return {
    day: todayKey(),
    completedToday: { hydration: 0, posture: 0, eyes: 0, stretch: 0 },
    totalCompleted: 0,
    streakDays: 0,
    lastStreakDay: null,
  }
}

/** Merges stored values over defaults so new settings keys never break an old install. */
export function mergeSettings(stored: unknown): Settings {
  const base = defaultSettings()
  if (!stored || typeof stored !== 'object') return base
  const s = stored as Partial<Settings>
  return {
    theme: s.theme ?? base.theme,
    // An unknown mode would leave the action wired to nothing, so validate it.
    viewMode: VIEW_MODES.includes(s.viewMode as ViewMode) ? (s.viewMode as ViewMode) : base.viewMode,
    notificationsEnabled: s.notificationsEnabled ?? base.notificationsEnabled,
    enableInPageToast: s.enableInPageToast ?? base.enableInPageToast,
    // A NaN or negative duration would become a toast that never leaves.
    toastDuration: clampDuration(s.toastDuration, base.toastDuration),
    quietHours: { ...base.quietHours, ...(s.quietHours ?? {}) },
    reminders: Object.fromEntries(
      REMINDERS.map((r) => {
        const conf = { ...base.reminders[r.id], ...(s.reminders?.[r.id] ?? {}) }
        // Intervals are free-typed now, and can also arrive from another machine
        // running a different build, so they are clamped on the way in.
        return [r.id, { ...conf, intervalMinutes: clampInterval(conf.intervalMinutes) }]
      }),
    ) as Settings['reminders'],
  }
}

/* ------------------------------------------------------- cooldown ledger */

/** Epoch-ms `minutes` from now — one place so alarms and the ledger cannot drift. */
export function dueAfter(minutes: number, from = Date.now()): number {
  return from + clampInterval(minutes) * 60_000
}

/**
 * Rebuilds the ledger from whatever storage handed back, against live settings.
 *
 * A paused habit has no due time. An enabled one that has never had a timestamp
 * (fresh install, a reminder switched back on) starts a full interval out, so
 * toggling a habit off and on cannot be used to mint a claim. A stored time
 * further out than one interval is impossible and is pulled back — otherwise a
 * corrupt value could lock a habit away for years.
 */
export function mergeDue(raw: unknown, settings: Settings, now = Date.now()): Schedule {
  const stored = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const due: Schedule = {}
  for (const id of REMINDER_IDS) {
    const conf = settings.reminders[id]
    if (!conf.enabled) {
      due[id] = null
      continue
    }
    const value = stored[id]
    const ceiling = dueAfter(conf.intervalMinutes, now)
    due[id] =
      typeof value === 'number' && Number.isFinite(value) ? Math.min(value, ceiling) : ceiling
  }
  return due
}

/**
 * Moves one habit's cooldown after its interval changed.
 *
 * A habit that is already claimable stays claimable: re-tuning the slider must
 * not swallow a nudge the user has earned but not yet tapped. Anything still
 * counting down restarts, matching the alarm that `syncAlarms` recreates.
 */
export function retimeDue(
  due: Schedule,
  id: ReminderId,
  minutes: number,
  now = Date.now(),
): Schedule {
  const current = due[id]
  if (typeof current === 'number' && current <= now) return due
  return { ...due, [id]: dueAfter(minutes, now) }
}

export async function loadDue(settings: Settings, now = Date.now()): Promise<Schedule> {
  const bag = await chrome.storage.local.get(DUE_KEY)
  return mergeDue(bag[DUE_KEY], settings, now)
}

export async function saveDue(due: Schedule): Promise<void> {
  await chrome.storage.local.set({ [DUE_KEY]: due })
}

/** Forces a toast duration into 0..60 whole seconds. */
export function clampDuration(seconds: unknown, fallback = 10): number {
  const n = Number(seconds)
  if (Number.isNaN(n)) return fallback
  return Math.min(TOAST_DURATION_MAX, Math.max(0, Math.round(n)))
}

export function mergeStats(stored: unknown): Stats {
  const base = defaultStats()
  if (!stored || typeof stored !== 'object') return base
  const s = stored as Partial<Stats>
  const stats: Stats = {
    ...base,
    ...s,
    completedToday: { ...base.completedToday, ...(s.completedToday ?? {}) },
  }
  return rollOverDay(stats)
}

/** Zeroes the daily counters when the calendar day changed. */
export function rollOverDay(stats: Stats, now = new Date()): Stats {
  const today = todayKey(now)
  if (stats.day === today) return stats
  return {
    ...stats,
    day: today,
    completedToday: { hydration: 0, posture: 0, eyes: 0, stretch: 0 },
  }
}

export async function loadSettings(): Promise<Settings> {
  const bag = await chrome.storage.sync.get(SETTINGS_KEY)
  return mergeSettings(bag[SETTINGS_KEY])
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings })
}

export async function loadStats(): Promise<Stats> {
  const bag = await chrome.storage.local.get(STATS_KEY)
  return mergeStats(bag[STATS_KEY])
}

export async function saveStats(stats: Stats): Promise<void> {
  await chrome.storage.local.set({ [STATS_KEY]: stats })
}

/** Records a completed habit and advances the daily streak. */
export function applyCompletion(stats: Stats, id: ReminderId, now = new Date()): Stats {
  const rolled = rollOverDay(stats, now)
  const today = todayKey(now)
  let streakDays = rolled.streakDays
  if (rolled.lastStreakDay !== today) {
    const yesterday = todayKey(new Date(now.getTime() - 86_400_000))
    streakDays = rolled.lastStreakDay === yesterday ? rolled.streakDays + 1 : 1
  }
  return {
    ...rolled,
    completedToday: {
      ...rolled.completedToday,
      [id]: (rolled.completedToday[id] ?? 0) + 1,
    },
    totalCompleted: rolled.totalCompleted + 1,
    streakDays,
    lastStreakDay: today,
  }
}

/** True when `now` falls inside the user's quiet window (wraps past midnight). */
export function isQuiet(settings: Settings, now = new Date()): boolean {
  const { enabled, from, to } = settings.quietHours
  if (!enabled) return false
  const hour = now.getHours()
  return from <= to ? hour >= from && hour < to : hour >= from || hour < to
}
