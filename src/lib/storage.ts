import { REMINDERS } from './reminders'
import type { ReminderId, Settings, Stats } from './types'

export const SETTINGS_KEY = 'kw:settings'
export const STATS_KEY = 'kw:stats'

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function defaultSettings(): Settings {
  return {
    theme: 'matcha',
    notificationsEnabled: true,
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
    notificationsEnabled: s.notificationsEnabled ?? base.notificationsEnabled,
    quietHours: { ...base.quietHours, ...(s.quietHours ?? {}) },
    reminders: Object.fromEntries(
      REMINDERS.map((r) => [
        r.id,
        { ...base.reminders[r.id], ...(s.reminders?.[r.id] ?? {}) },
      ]),
    ) as Settings['reminders'],
  }
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
