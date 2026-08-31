import { buyItem, checkClaim, defaultPlayer, equipItem, grantCompletion } from './gamification'
import { defaultSettings, defaultStats, dueAfter } from './storage'
import type { CompanionState, PopupMessage } from './types'

const hasRuntime = () =>
  typeof chrome !== 'undefined' && !!chrome.runtime?.id && !!chrome.runtime.sendMessage

/**
 * Talks to the service worker, and degrades to in-memory state when the popup
 * is opened outside an extension context (`npm run dev` in a plain tab).
 */
export async function send<T = unknown>(message: PopupMessage): Promise<T | null> {
  if (!hasRuntime()) return mockResponse(message) as T
  try {
    return (await chrome.runtime.sendMessage(message)) as T
  } catch (error) {
    console.warn('[kawaii] background unreachable', error)
    return null
  }
}

let mock: CompanionState | null = null

/** A believable mid-game save, so the wardrobe has something to show in dev. */
function mockState(): CompanionState {
  if (mock) return mock
  mock = {
    settings: defaultSettings(),
    stats: { ...defaultStats(), streakDays: 3, totalCompleted: 12 },
    player: { ...defaultPlayer(), l: 6, e: 45, c: 480, u: [11, 21, 41], eq: [11, 21, 0], t: 0b1111 },
    // One habit already due, so a dev tab can exercise both button states.
    schedule: {
      hydration: Date.now() + 12 * 60_000,
      posture: Date.now() + 4 * 60_000,
      eyes: Date.now() - 30_000,
      stretch: Date.now() + 41 * 60_000,
    },
  }
  return mock
}

function mockResponse(message: PopupMessage): unknown {
  const state = mockState()
  switch (message.type) {
    case 'GET_STATE':
      return state
    case 'UPDATE_SETTINGS':
      state.settings = message.settings
      return { ok: true, schedule: state.schedule }
    case 'COMPLETE_REMINDER': {
      // Mirrors the worker's cooldown, so the mock cannot be farmed either.
      const conf = state.settings.reminders[message.id]
      const check = checkClaim(conf.enabled, state.schedule[message.id], Date.now())
      if (!check.ok) {
        return { ok: false, reason: check.reason, waitMs: check.waitMs, schedule: state.schedule }
      }
      state.stats.completedToday[message.id] += 1
      state.stats.totalCompleted += 1
      state.player = grantCompletion(state.player, state.stats.streakDays).player
      state.schedule = { ...state.schedule, [message.id]: dueAfter(conf.intervalMinutes) }
      return { ok: true, stats: state.stats, player: state.player, schedule: state.schedule }
    }
    case 'SNOOZE_REMINDER': {
      state.schedule = { ...state.schedule, [message.id]: dueAfter(message.minutes) }
      return { ok: true, schedule: state.schedule }
    }
    case 'EQUIP_ITEM':
      state.player = equipItem(state.player, message.slot, message.itemId)
      return { ok: true, player: state.player }
    case 'BUY_ITEM': {
      const result = buyItem(state.player, message.itemId)
      if (!result.ok) return { ok: false, reason: result.reason }
      state.player = result.player
      return { ok: true, player: state.player }
    }
    case 'SET_SOUND':
      state.player = { ...state.player, s: message.soundId }
      return { ok: true, player: state.player }
    default:
      return { ok: true }
  }
}
