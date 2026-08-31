/**
 * Kawaii Wellness Companion — MV3 service worker.
 *
 * Owns every timer. The popup is a thin view: it reads state, sends intents,
 * and never schedules anything itself (popups get torn down constantly).
 */
import { isAudioMessage, playKeyFromWorker, playSoundFromWorker } from '../lib/audio'
import {
  buyItem,
  checkClaim,
  type ClaimDenial,
  equipItem,
  grantCompletion,
  ITEM_MAP,
  loadPlayer,
  RARITY_META,
  savePlayer,
  SOUND_MAP,
  soundUnlocked,
} from '../lib/gamification'
import { clampInterval, REMINDER_IDS, REMINDER_MAP, pickOne } from '../lib/reminders'
import {
  applyCompletion,
  defaultSettings,
  dueAfter,
  isQuiet,
  loadDue,
  loadSettings,
  loadStats,
  retimeDue,
  rollOverDay,
  saveDue,
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
  Stats,
  ViewMode,
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

/**
 * Makes the live alarm set match the settings, recreating only what changed, and
 * keeps the cooldown ledger in step with it. Returns the resulting ledger.
 */
async function syncAlarms(settings: Settings): Promise<Schedule> {
  const now = Date.now()
  const existing = await chrome.alarms.getAll()
  const byName = new Map(existing.map((a) => [a.name, a]))
  let due = await loadDue(settings, now)

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
    const minutes = clampInterval(conf.intervalMinutes)
    if (!current || current.periodInMinutes !== minutes) {
      await chrome.alarms.create(name, { delayInMinutes: minutes, periodInMinutes: minutes })
      due = retimeDue(due, id, minutes, now)
    }
  }

  await saveDue(due)
  return due
}

/**
 * The cooldown ledger, repaired against current settings.
 *
 * Reading alarms instead would be wrong twice over: a periodic alarm rolls its
 * own clock forward, so an unclaimed habit would appear to be counting down
 * again, and the ledger has to survive the alarm being dropped or rebuilt.
 */
async function readSchedule(settings: Settings): Promise<Schedule> {
  return loadDue(settings)
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

type CompleteResult =
  | { ok: true; player: PlayerState; stats: Stats; schedule: Schedule }
  | { ok: false; reason: ClaimDenial; waitMs: number; schedule: Schedule }

/**
 * Claims a habit — the only path that mints EXP or coins.
 *
 * The cooldown is enforced *here*, not in the UI. A greyed-out button stops the
 * honest case, but `chrome.runtime.sendMessage({type:'COMPLETE_REMINDER'})` from
 * any extension page would sail straight past it, so the worker re-checks the
 * ledger it owns and refuses without touching the save.
 */
async function completeReminder(id: ReminderId): Promise<CompleteResult> {
  const now = Date.now()
  const settings = await loadSettings()
  const conf = settings.reminders[id]
  const due = await loadDue(settings, now)

  const check = checkClaim(conf.enabled, due[id], now)
  if (!check.ok) {
    return { ok: false, reason: check.reason, waitMs: check.waitMs, schedule: due }
  }

  const stats = applyCompletion(await loadStats(), id, new Date(now))
  await saveStats(stats)
  await setPending((await getPending()).filter((p) => p !== id))

  // Streak is already advanced by applyCompletion, so the bonus reflects today.
  const player = await rewardCompletion(stats.streakDays)

  // Claiming restarts the cycle: alarm and cooldown are rearmed from the same
  // interval so the countdown the user sees is the one the nudge will honour.
  const minutes = clampInterval(conf.intervalMinutes)
  await chrome.alarms.clear(snoozeName(id))
  await chrome.alarms.create(alarmName(id), { delayInMinutes: minutes, periodInMinutes: minutes })

  const schedule: Schedule = { ...due, [id]: dueAfter(minutes, now) }
  await saveDue(schedule)

  return { ok: true, player, stats, schedule }
}

/**
 * Pushes a habit out by `minutes`. The nudge and the claim move together — a
 * snooze that left the button live would just be a slower "Done".
 */
async function snoozeReminder(id: ReminderId, minutes: number): Promise<Schedule> {
  const now = Date.now()
  const wait = Math.min(180, Math.max(1, Math.round(minutes)))
  await chrome.alarms.create(snoozeName(id), { delayInMinutes: wait })
  await setPending((await getPending()).filter((p) => p !== id))

  const settings = await loadSettings()
  const due = await loadDue(settings, now)
  const schedule: Schedule = { ...due, [id]: now + wait * 60_000 }
  await saveDue(schedule)
  return schedule
}

/* ------------------------------------------------------- surface (popup/panel) */

/**
 * The popup and the side panel load the same page. It is handed a query flag so
 * the document can size itself correctly: a side panel fills its viewport, while
 * a popup's viewport is derived from the content and needs fixed dimensions.
 */
export const POPUP_PATH = 'index.html?surface=popup'

/**
 * Points the toolbar icon at the surface the user picked.
 *
 * MV3 gives the popup priority: if an action popup is set, the icon opens it and
 * `openPanelOnActionClick` never gets a look in. So the two settings are always
 * written as a pair — clearing one is what lets the other work.
 *
 * This is profile state, not a manifest key, and `action.setPopup` does not
 * survive a browser restart, so it is re-applied on install, on startup, on cold
 * worker boot, and whenever the setting changes.
 */
async function updateViewMode(mode: ViewMode): Promise<void> {
  try {
    if (mode === 'sidepanel') {
      await chrome.action.setPopup({ popup: '' })
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    } else {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
      await chrome.action.setPopup({ popup: POPUP_PATH })
    }
  } catch (error) {
    console.error('[kawaii] could not apply view mode', mode, error)
  }
}

/**
 * Opens the UI from a notification click, in whichever surface is configured.
 * Both APIs need a user gesture and can refuse; the toolbar icon is always the
 * reliable path, so this stays best-effort.
 */
async function openCompanion(mode: ViewMode): Promise<void> {
  try {
    if (mode === 'popup') {
      // openPopup lands in Chrome 127+.
      await chrome.action.openPopup()
      return
    }
    const window = await chrome.windows.getLastFocused()
    if (window.id === undefined || window.id === chrome.windows.WINDOW_ID_NONE) return
    await chrome.sidePanel.open({ windowId: window.id })
  } catch (error) {
    console.debug('[kawaii] open declined', error)
  }
}

/* ------------------------------------------------------------ event wiring */

chrome.runtime.onInstalled.addListener(async (details) => {
  const settings = await loadSettings()
  await updateViewMode(settings.viewMode)
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
  const settings = await loadSettings()
  // action.setPopup is not persisted across restarts, so this must run every boot.
  await updateViewMode(settings.viewMode)
  await syncAlarms(settings)
  await setPending([])
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const id = reminderFromAlarm(alarm.name)
  if (!id) return

  const settings = await loadSettings()
  if (!settings.reminders[id].enabled) return

  // The interval has elapsed, so the habit is claimable from now on — whether or
  // not we are allowed to say anything about it. Quiet hours and muted
  // notifications silence the nudge, they do not withhold the reward.
  const now = Date.now()
  const due = await loadDue(settings, now)
  if ((due[id] ?? 0) > now) await saveDue({ ...due, [id]: now })

  if (!settings.notificationsEnabled) return
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
  await openCompanion((await loadSettings()).viewMode)
})

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'sync' || !changes[SETTINGS_KEY]) return
  const change = changes[SETTINGS_KEY]
  const settings = await loadSettings()

  const before = (change.oldValue as Settings | undefined)?.viewMode
  if (before !== settings.viewMode) await updateViewMode(settings.viewMode)

  await syncAlarms(settings)
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
          schedule: await readSchedule(settings),
        }
        sendResponse(state)
        return
      }
      case 'UPDATE_SETTINGS': {
        await saveSettings(message.settings)
        sendResponse({ ok: true, schedule: await syncAlarms(message.settings) })
        return
      }
      case 'COMPLETE_REMINDER': {
        // A refusal still answers with the schedule, so a view that thought the
        // habit was ready corrects itself instead of sitting on a live button.
        sendResponse(await completeReminder(message.id))
        return
      }
      case 'SNOOZE_REMINDER': {
        sendResponse({ ok: true, schedule: await snoozeReminder(message.id, message.minutes) })
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

// A cold worker with nothing stored yet still deserves working alarms — and a
// respawned worker still owes the profile its action behaviour.
void (async () => {
  const bag = await chrome.storage.sync.get(SETTINGS_KEY)
  if (!bag[SETTINGS_KEY]) await saveSettings(defaultSettings())
  const settings = await loadSettings()
  await updateViewMode(settings.viewMode)
  await syncAlarms(settings)
})()
