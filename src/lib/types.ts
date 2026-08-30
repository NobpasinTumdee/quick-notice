export type ReminderId = 'hydration' | 'posture' | 'eyes' | 'stretch'

export type ThemeId = 'matcha' | 'sakura' | 'ocean' | 'midnight' | 'sunset'

/** Drives which face the mascot wears. */
export type MascotMood =
  | 'idle'
  | 'happy'
  | 'sleepy'
  | 'excited'
  | 'thirsty'
  | 'stretching'
  | 'wink'

export interface ReminderSetting {
  enabled: boolean
  /** Minutes between nudges. */
  intervalMinutes: number
}

export interface Settings {
  theme: ThemeId
  notificationsEnabled: boolean
  /** Skips nudges outside the active window (24h clock, local time). */
  quietHours: { enabled: boolean; from: number; to: number }
  reminders: Record<ReminderId, ReminderSetting>
}

export interface Stats {
  /** ISO date (YYYY-MM-DD) the counters below belong to. */
  day: string
  completedToday: Record<ReminderId, number>
  totalCompleted: number
  streakDays: number
  lastStreakDay: string | null
}

/** Epoch-ms of the next scheduled nudge per reminder (null when off). */
export type Schedule = Partial<Record<ReminderId, number | null>>

/** Wardrobe slots, in the order they appear in `PlayerState['eq']`. */
export type Slot = 'head' | 'outfit' | 'prop'

/** 1 common, 2 rare, 3 epic, 4 legendary — an int so it costs one byte in sync. */
export type Rarity = 1 | 2 | 3 | 4

/**
 * The entire RPG save, written to `chrome.storage.sync` under `kw:p`.
 * Single-character keys and integer ids only: no strings, no asset payloads.
 * See `lib/gamification.ts` for the byte budget behind this shape.
 */
export interface PlayerState {
  /** level */
  l: number
  /** exp toward the next level (resets on level-up, so it never grows unbounded) */
  e: number
  /** coins */
  c: number
  /** equipped item ids: [head, outfit, prop]; 0 means empty */
  eq: [number, number, number]
  /** owned item ids */
  u: number[]
  /** unlocked-theme bitmask, indexed like THEMES */
  t: number
  /** selected notification sound id */
  s: number
}

export interface CompanionState {
  settings: Settings
  stats: Stats
  schedule: Schedule
  player: PlayerState
}

export type PopupMessage =
  | { type: 'GET_STATE' }
  | { type: 'UPDATE_SETTINGS'; settings: Settings }
  | { type: 'COMPLETE_REMINDER'; id: ReminderId }
  | { type: 'SNOOZE_REMINDER'; id: ReminderId; minutes: number }
  | { type: 'PREVIEW_NOTIFICATION'; id: ReminderId }
  | { type: 'EQUIP_ITEM'; slot: Slot; itemId: number }
  | { type: 'BUY_ITEM'; itemId: number }
  | { type: 'SET_SOUND'; soundId: number }
