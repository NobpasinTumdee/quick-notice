import type { MascotMood, ReminderId } from './types'

/**
 * Interval bounds, in minutes.
 *
 * The floor is 1 because that is also `chrome.alarms`' floor: a packed
 * extension cannot schedule anything faster, so anything smaller would silently
 * become a one-minute alarm and the countdown would lie. The ceiling keeps the
 * slider scrubbable at one-minute granularity across a 180-stop track.
 */
export const INTERVAL_MIN = 1
export const INTERVAL_MAX = 180

/**
 * Where an unreadable interval lands. Deliberately not `INTERVAL_MIN`: a value
 * that cannot be parsed should never turn into a nudge every single minute.
 */
export const INTERVAL_FALLBACK = 30

/**
 * Forces any value into a legal, whole-minute interval.
 *
 * Everything that reaches an alarm goes through here: a typed value, a synced
 * value from another machine, a value written by an older build. `chrome.alarms`
 * throws on a non-finite period, so a bad value would take the whole cycle down.
 */
export function clampInterval(minutes: unknown): number {
  const n = Number(minutes)
  if (Number.isNaN(n)) return INTERVAL_FALLBACK
  // ±Infinity needs no special case: it clamps by sign like any other number.
  return Math.min(INTERVAL_MAX, Math.max(INTERVAL_MIN, Math.round(n)))
}

export interface ReminderMeta {
  id: ReminderId
  label: string
  emoji: string
  /** Short line under the title in the popup. */
  tagline: string
  mood: MascotMood
  /** Per-reminder tint used for chips and rings; readable on every theme. */
  tint: { from: string; to: string; ink: string }
  defaultMinutes: number
  /** Rotated so notifications never feel like the same robot twice. */
  nudges: { title: string; body: string }[]
  /** Shown after the user taps "done". */
  praise: string[]
}

export const REMINDERS: ReminderMeta[] = [
  {
    id: 'hydration',
    label: 'Hydration',
    emoji: '💧',
    tagline: 'Sip some water',
    mood: 'thirsty',
    tint: { from: '#7dd3fc', to: '#38bdf8', ink: '#075985' },
    defaultMinutes: 45,
    nudges: [
      { title: 'Water break! 💧', body: 'Momo poured you a glass. Take a few sips together?' },
      { title: 'Psst… thirsty? 💧', body: 'Even two sips count. Your brain is 75% water!' },
      { title: 'Hydration check 💧', body: 'Momo is holding your cup. Go on, it is still cold.' },
    ],
    praise: ['Glug glug! 🫧', 'So refreshing!', 'Momo is proud of you.'],
  },
  {
    id: 'posture',
    label: 'Posture',
    emoji: '🧘',
    tagline: 'Unfold that spine',
    mood: 'excited',
    tint: { from: '#c4b5fd', to: '#a78bfa', ink: '#4c1d95' },
    defaultMinutes: 30,
    nudges: [
      { title: 'Tall like a sprout 🧘', body: 'Shoulders down, chin level, screen at eye height.' },
      { title: 'Posture reset 🧘', body: 'Momo noticed a slouch. Stack your ears over your shoulders.' },
      { title: 'Sit up, superstar 🧘', body: 'Feet flat, spine long, breathe into your ribs.' },
    ],
    praise: ['Regal! 👑', 'Look at that spine.', 'Nice and tall.'],
  },
  {
    id: 'eyes',
    label: 'Eye Rest',
    emoji: '👀',
    tagline: '20-20-20 rule',
    mood: 'sleepy',
    tint: { from: '#fcd34d', to: '#fbbf24', ink: '#78350f' },
    defaultMinutes: 20,
    nudges: [
      { title: 'Look far away 👀', body: '20 seconds, 20 feet out. Momo will keep watch.' },
      { title: 'Eye stretch 👀', body: 'Find the furthest thing in the room and soften your gaze.' },
      { title: 'Blink break 👀', body: 'Screens make us forget to blink. Ten slow ones, go!' },
    ],
    praise: ['Ahh, that is better.', 'Eyes: refreshed ✨', 'Momo blinked along.'],
  },
  {
    id: 'stretch',
    label: 'Stretch',
    emoji: '🚶',
    tagline: 'Move a little',
    mood: 'stretching',
    tint: { from: '#fda4af', to: '#fb7185', ink: '#881337' },
    defaultMinutes: 60,
    nudges: [
      { title: 'Wiggle time! 🚶', body: 'Stand up, reach for the ceiling, roll those shoulders.' },
      { title: 'Momo wants a walk 🚶', body: 'One lap around the room. Bring your legs.' },
      { title: 'Unstick yourself 🚶', body: 'Two minutes of moving beats two hours of sitting.' },
    ],
    praise: ['Stretchy! 🌱', 'Momo did it too.', 'Your hips say thank you.'],
  },
]

export const REMINDER_MAP: Record<ReminderId, ReminderMeta> = Object.fromEntries(
  REMINDERS.map((r) => [r.id, r]),
) as Record<ReminderId, ReminderMeta>

export const REMINDER_IDS = REMINDERS.map((r) => r.id)

export function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}
