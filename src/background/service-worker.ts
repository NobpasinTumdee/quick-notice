/**
 * Kawaii Wellness Companion — MV3 service worker.
 *
 * Owns every timer. The popup is a thin view: it reads state, sends intents,
 * and never schedules anything itself (popups get torn down constantly).
 */
import { isAudioMessage, playKeyFromWorker, playSoundFromWorker } from '../lib/audio'
import {
  buyItem,
  equipItem,
  grantCompletion,
  ITEM_MAP,
  loadPlayer,
  RARITY_META,
  savePlayer,
  SOUND_MAP,
  soundUnlocked,
} from '../lib/gamification'
import { REMINDER_IDS, REMINDER_MAP, pickOne } from '../lib/reminders'
import {
  applyCompletion,
  defaultSettings,
  isQuiet,
  loadSettings,
  loadStats,
  rollOverDay,
  saveSettings,
  saveStats,
  SETTINGS_KEY,
} from '../lib/storage'
import { THEME_MAP } from '../lib/themes'
import type {
  CompanionState,
  PlayerState,
  PopupMessage,
  ReminderId,
  Schedule,
  Settings,
} from '../lib/types'

const ALARM_PREFIX = 'kw:'
const SNOOZE_PREFIX = 'kw:snooze:'
const PENDING_KEY = 'kw:pending'

const alarmName = (id: ReminderId) => `${ALARM_PREFIX}${id}`
const snoozeName = (id: ReminderId) => `${SNOOZE_PREFIX}${id}`

function reminderFromAlarm(name: string): ReminderId | null {
  const raw = name.startsWith(SNOOZE_PREFIX)
    ? name.slice(SNOOZE_PREFIX.length)
    : name.startsWith(ALARM_PREFIX)
      ? name.slice(ALARM_PREFIX.length)
      : null
  const id = raw ? raw.split(':')[0] : null
  return id && (REMINDER_IDS as string[]).includes(id) ? (id as ReminderId) : null
}

/* ------------------------------------------------------------------ alarms */

/** Makes the live alarm set match the settings, recreating only what changed. */
async function syncAlarms(settings: Settings): Promise<void> {
  const existing = await chrome.alarms.getAll()
  const byName = new Map(existing.map((a) => [a.name, a]))

  for (const id of REMINDER_IDS) {
    const conf = settings.reminders[id]
    const name = alarmName(id)
    const current = byName.get(name)

    if (!conf.enabled) {
      if (current) await chrome.alarms.clear(name)
      await chrome.alarms.clear(snoozeName(id))
      continue
    }
    // Chrome keeps periodInMinutes on the alarm, so a mismatch means the user
    // moved the slider and we owe them a fresh cycle.
    if (!current || current.periodInMinutes !== conf.intervalMinutes) {
      await chrome.alarms.create(name, {
        delayInMinutes: conf.intervalMinutes,
        periodInMinutes: conf.intervalMinutes,
      })
    }
  }
}

async function readSchedule(): Promise<Schedule> {
  const alarms = await chrome.alarms.getAll()
  const schedule: Schedule = {}
  for (const id of REMINDER_IDS) schedule[id] = null
  for (const alarm of alarms) {
    const id = reminderFromAlarm(alarm.name)
    if (!id) continue
    const soonest = schedule[id]
    // A snooze alarm fires before the periodic one; show whichever lands first.
    schedule[id] = soonest ? Math.min(soonest, alarm.scheduledTime) : alarm.scheduledTime
  }
  return schedule
}

/* ----------------------------------------------------------------- badging */

async function getPending(): Promise<ReminderId[]> {
  const bag = await chrome.storage.local.get(PENDING_KEY)
  const list = bag[PENDING_KEY]
  return Array.isArray(list) ? (list as ReminderId[]) : []
}

async function setPending(ids: ReminderId[]): Promise<void> {
  await chrome.storage.local.set({ [PENDING_KEY]: ids })
  await chrome.action.setBadgeBackgroundColor({ color: '#ef7fa6' })
  await chrome.action.setBadgeText({ text: ids.length ? String(ids.length) : '' })
}

/* ----------------------------------------------------------- notifications */

async function notify(id: ReminderId): Promise<void> {
  const meta = REMINDER_MAP[id]
  const nudge = pickOne(meta.nudges)
  await chrome.notifications.create(`${ALARM_PREFIX}${id}:${Date.now()}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL(`icons/notify-${id}.png`),
    title: nudge.title,
    message: nudge.body,
    contextMessage: 'Momo · your wellness buddy',
    priority: 0,
    silent: true, // soft and non-intrusive is the whole point
    requireInteraction: false,
    buttons: [{ title: 'Done ✓' }, { title: 'Snooze 5 min' }],
  })
  // Chrome's own chime stays off (`silent`); the player's chosen sound plays
  // through the offscreen document instead.
  const player = await loadPlayer()
  await playSoundFromWorker(player.s)
}

/* ------------------------------------------------------------ progression */

/**
 * Pays out a completed habit: EXP, coins, and any level-ups that cascade from
 * it. Returns the new save so callers can hand it straight back to the popup.
 */
async function rewardCompletion(streakDays: number): Promise<PlayerState> {
  const before = await loadPlayer()
  const result = grantCompletion(before, streakDays)
  await savePlayer(result.player)

  if (result.levelsGained > 0) await celebrateLevelUp(result.player, result)
  return result.player
}

type LevelUpSummary = Pick<
  ReturnType<typeof grantCompletion>,
  'levelsGained' | 'coinsAwarded' | 'unlockedThemes' | 'unlockedSounds' | 'shopUnlocks'
>

/** The one notification that is allowed to be loud-ish: you levelled up. */
async function celebrateLevelUp(player: PlayerState, summary: LevelUpSummary): Promise<void> {
  const unlocks: string[] = [
    ...summary.shopUnlocks.map((i) => `${RARITY_META[i.rarity].label} ${i.name}`),
    ...summary.unlockedThemes.map((id) => `${THEME_MAP[id].name} theme`),
    ...summary.unlockedSounds.map((s) => `${s.name} sound`),
  ]

  const settings = await loadSettings()
  if (settings.notificationsEnabled && !isQuiet(settings)) {
    await chrome.notifications.create(`kw:levelup:${Date.now()}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: `Level ${player.l}! 🎉`,
      message: unlocks.length
        ? `+${summary.coinsAwarded} coins · unlocked ${unlocks.slice(0, 3).join(', ')}`
        : `+${summary.coinsAwarded} coins. Momo is very proud.`,
      contextMessage: 'Momo · wellness RPG',
      priority: 0,
      silent: true,
      requireInteraction: false,
    })
    await playKeyFromWorker('levelup', 0.5)
  }
}

async function completeReminder(id: ReminderId): Promise<{ player: PlayerState }> {
  const stats = applyCompletion(await loadStats(), id)
  await saveStats(stats)
  await setPending((await getPending()).filter((p) => p !== id))

  // Streak is already advanced by applyCompletion, so the bonus reflects today.
  const player = await rewardCompletion(stats.streakDays)

  // Completing early restarts the cycle, so the next nudge is a full interval away.
  const settings = await loadSettings()
  const conf = settings.reminders[id]
  await chrome.alarms.clear(snoozeName(id))
  if (conf.enabled) {
    await chrome.alarms.create(alarmName(id), {
      delayInMinutes: conf.intervalMinutes,
      periodInMinutes: conf.intervalMinutes,
    })
  }
  return { player }
}

async function snoozeReminder(id: ReminderId, minutes: number): Promise<void> {
  await chrome.alarms.create(snoozeName(id), { delayInMinutes: minutes })
  await setPending((await getPending()).filter((p) => p !== id))
}

/* ------------------------------------------------------------ event wiring */

chrome.runtime.onInstalled.addListener(async (details) => {
  const settings = await loadSettings()
  await saveSettings(settings)
  await savePlayer(await loadPlayer())
  await syncAlarms(settings)
  await setPending([])

  if (details.reason === 'install') {
    await chrome.notifications.create('kw:welcome', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: 'Momo is here! 🌱',
      message: 'Your wellness buddy is settled in. Open the popup to pick a theme.',
      priority: 0,
      silent: true,
    })
  }
})

chrome.runtime.onStartup.addListener(async () => {
  await syncAlarms(await loadSettings())
  await setPending([])
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const id = reminderFromAlarm(alarm.name)
  if (!id) return

  const settings = await loadSettings()
  if (!settings.notificationsEnabled) return
  if (!settings.reminders[id].enabled) return
  if (isQuiet(settings)) return // stay silent, but keep the cycle running

  // Keep the daily counters honest even if the popup never opens.
  await saveStats(rollOverDay(await loadStats()))

  await notify(id)
  const pending = await getPending()
  if (!pending.includes(id)) await setPending([...pending, id])
})

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  const id = reminderFromAlarm(notificationId)
  if (!id) return
  if (buttonIndex === 0) await completeReminder(id)
  else await snoozeReminder(id, 5)
  await chrome.notifications.clear(notificationId)
})

chrome.notifications.onClicked.addListener(async (notificationId) => {
  await chrome.notifications.clear(notificationId)
  // openPopup lands in Chrome 127+; harmless to attempt on older builds.
  try {
    await chrome.action.openPopup()
  } catch {
    /* the toolbar icon still works */
  }
})

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'sync' || !changes[SETTINGS_KEY]) return
  await syncAlarms(await loadSettings())
})

chrome.runtime.onMessage.addListener((message: PopupMessage, _sender, sendResponse) => {
  // Audio traffic is addressed to the offscreen document, not to us.
  if (isAudioMessage(message)) return false

  void (async () => {
    switch (message.type) {
      case 'GET_STATE': {
        const [settings, stored, player] = await Promise.all([
          loadSettings(),
          loadStats(),
          loadPlayer(),
        ])
        const stats = rollOverDay(stored)
        await saveStats(stats)
        await setPending([]) // opening the popup counts as "seen"
        const state: CompanionState = {
          settings,
          stats,
          player,
          schedule: await readSchedule(),
        }
        sendResponse(state)
        return
      }
      case 'UPDATE_SETTINGS': {
        await saveSettings(message.settings)
        await syncAlarms(message.settings)
        sendResponse({ ok: true, schedule: await readSchedule() })
        return
      }
      case 'COMPLETE_REMINDER': {
        const { player } = await completeReminder(message.id)
        sendResponse({
          ok: true,
          stats: await loadStats(),
          player,
          schedule: await readSchedule(),
        })
        return
      }
      case 'SNOOZE_REMINDER': {
        await snoozeReminder(message.id, message.minutes)
        sendResponse({ ok: true, schedule: await readSchedule() })
        return
      }
      case 'PREVIEW_NOTIFICATION': {
        await notify(message.id)
        sendResponse({ ok: true })
        return
      }
      case 'EQUIP_ITEM': {
        const player = equipItem(await loadPlayer(), message.slot, message.itemId)
        await savePlayer(player)
        sendResponse({ ok: true, player })
        return
      }
      case 'BUY_ITEM': {
        const result = buyItem(await loadPlayer(), message.itemId)
        if (!result.ok) {
          sendResponse({ ok: false, reason: result.reason })
          return
        }
        await savePlayer(result.player)
        await playKeyFromWorker('coin', 0.4)
        sendResponse({ ok: true, player: result.player, item: ITEM_MAP.get(message.itemId) })
        return
      }
      case 'SET_SOUND': {
        const current = await loadPlayer()
        // A sound the player has not reached yet is simply not selectable.
        if (!SOUND_MAP.has(message.soundId) || !soundUnlocked(current.l, message.soundId)) {
          sendResponse({ ok: false, player: current })
          return
        }
        const player = { ...current, s: message.soundId }
        await savePlayer(player)
        sendResponse({ ok: true, player })
        return
      }
      default:
        sendResponse({ ok: false })
    }
  })()
  return true // keep the message channel open for the async work above
})

// A cold worker with nothing stored yet still deserves working alarms.
void (async () => {
  const bag = await chrome.storage.sync.get(SETTINGS_KEY)
  if (!bag[SETTINGS_KEY]) await saveSettings(defaultSettings())
  await syncAlarms(await loadSettings())
})()
