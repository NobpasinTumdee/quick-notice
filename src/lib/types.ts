export type ReminderId = 'hydration' | 'posture' | 'eyes' | 'stretch'

export type ThemeId =
  | 'matcha'
  | 'sakura'
  | 'ocean'
  | 'midnight'
  | 'sunset'
  | 'cafe'
  | 'lofi'
  | 'nebula'
  | 'mecha'
  | 'cyber'

/**
 * Drives which face the mascot wears. Expressions are state, never inventory:
 * nothing here is bought, owned or written to storage.
 */
export type MascotMood =
  | 'idle'
  | 'happy'
  | 'sleepy'
  | 'excited'
  | 'thirsty'
  | 'stretching'
  | 'wink'
  | 'focused'
  | 'cool'
  | 'dizzy'

export interface ReminderSetting {
  enabled: boolean
  /** Minutes between nudges. */
  intervalMinutes: number
}

/** Where the UI opens when the toolbar icon is clicked. */
export type ViewMode = 'popup' | 'sidepanel'

export interface Settings {
  theme: ThemeId
  /** Surface the extension opens in; applied by the worker, not the manifest. */
  viewMode: ViewMode
  notificationsEnabled: boolean
  /** Show the in-page toast on the active tab when a nudge fires. */
  enableInPageToast: boolean
  /** Seconds the toast stays up. 0 means it waits to be dismissed. */
  toastDuration: number
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

/**
 * Epoch-ms at which each habit next comes due — the moment its nudge fires and
 * its "Done" button unlocks. `null` means the reminder is switched off.
 *
 * This is the cooldown ledger, persisted under `kw:due` in local storage, and
 * the worker is the only writer. It is deliberately *not* derived from
 * `chrome.alarms` at read time: a periodic alarm rolls forward on its own, so an
 * ignored nudge would keep moving the goalposts, while a habit that came due an
 * hour ago must stay claimable until it is actually claimed.
 */
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

/**
 * Worker -> content script. This is the only message that crosses into a page
 * the user is browsing, so it carries everything the toast needs to render
 * itself: no follow-up round trip, and no reason for a content script to read
 * storage on every page load.
 */
export interface ToastMessage {
  type: 'SHOW_TOAST'
  habit: ReminderId
  title: string
  body: string
  /** EXP the habit is worth right now, streak bonus included. */
  expReward: number
  /** ms on screen; 0 keeps it up until dismissed. */
  durationMs: number
  theme: ThemeId
  /** Equipped item ids, so Momo turns up in the outfit the user picked. */
  equipped: PlayerState['eq']
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
