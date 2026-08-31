/**
 * Service-worker tests — the anti-farm rule as the extension actually runs it.
 *
 * The pure guard is covered in `cooldown.test.ts`; this file exercises the real
 * `background/service-worker.ts` against an in-memory `chrome`, because the
 * exploit lives in the message handler, not in the helpers: what matters is that
 * a `COMPLETE_REMINDER` arriving off-cooldown mints nothing, no matter who sent
 * it. (Chrome 137+ dropped `--load-extension`, so a headless browser can no
 * longer host the real thing either.)
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mergePlayer, PLAYER_KEY } from '../src/lib/gamification.ts'
import { DUE_KEY, SETTINGS_KEY, STATS_KEY } from '../src/lib/storage.ts'
import type { PopupMessage, Schedule, Settings } from '../src/lib/types.ts'

/* ------------------------------------------------------------ fake chrome */

type Listener = (...args: any[]) => any

function event() {
  const listeners: Listener[] = []
  return {
    listeners,
    addListener: (fn: Listener) => listeners.push(fn),
    removeListener: () => {},
    emit: async (...args: any[]) => {
      for (const fn of listeners) await fn(...args)
    },
  }
}

function area() {
  const data: Record<string, unknown> = {}
  return {
    data,
    get: async (key?: string | string[] | null) => {
      const keys = key == null ? Object.keys(data) : Array.isArray(key) ? key : [key]
      const out: Record<string, unknown> = {}
      for (const k of keys) if (k in data) out[k] = structuredClone(data[k])
      return out
    },
    set: async (items: Record<string, unknown>) => {
      Object.assign(data, structuredClone(items))
    },
  }
}

interface FakeAlarm {
  name: string
  periodInMinutes?: number
  scheduledTime: number
}

const sync = area()
const local = area()
const alarms = new Map<string, FakeAlarm>()
const notifications: string[] = []
const onMessage = event()
const onAlarm = event()
const onButtonClicked = event()

const chromeStub = {
  runtime: {
    id: 'test',
    getURL: (p: string) => `chrome-extension://test/${p}`,
    sendMessage: async () => undefined,
    onMessage,
    onInstalled: event(),
    onStartup: event(),
  },
  storage: {
    sync,
    local,
    onChanged: event(),
  },
  alarms: {
    getAll: async () => [...alarms.values()],
    create: async (name: string, info: { delayInMinutes?: number; periodInMinutes?: number }) => {
      alarms.set(name, {
        name,
        periodInMinutes: info.periodInMinutes,
        scheduledTime: Date.now() + (info.delayInMinutes ?? 0) * 60_000,
      })
    },
    clear: async (name: string) => alarms.delete(name),
    onAlarm,
  },
  notifications: {
    create: async (id: string) => {
      notifications.push(id)
      return id
    },
    clear: async () => true,
    onButtonClicked,
    onClicked: event(),
  },
  action: {
    setBadgeBackgroundColor: async () => {},
    setBadgeText: async () => {},
    setPopup: async () => {},
    openPopup: async () => {},
  },
  sidePanel: { setPanelBehavior: async () => {}, open: async () => {} },
  windows: { getLastFocused: async () => ({ id: 1 }), WINDOW_ID_NONE: -1 },
}

;(globalThis as any).chrome = chromeStub

// Registers the listeners and runs the worker's cold-boot pass.
await import('../src/background/service-worker.ts')
await new Promise((r) => setTimeout(r, 50))

/* ---------------------------------------------------------------- helpers */

const send = <T,>(message: PopupMessage): Promise<T> =>
  new Promise((resolve) => {
    onMessage.listeners[0](message, {}, resolve as (value: unknown) => void)
  })

const settings = () => sync.data[SETTINGS_KEY] as Settings
const ledger = () => (local.data[DUE_KEY] ?? {}) as Schedule
const exp = () => mergePlayer(sync.data[PLAYER_KEY]).e
const minutesOut = (at: number | null | undefined) => Math.round(((at ?? 0) - Date.now()) / 60_000)

/** Puts a habit's cooldown in the past, the way an elapsed interval would. */
const makeDue = async (id: string) => {
  await local.set({ [DUE_KEY]: { ...ledger(), [id]: Date.now() - 2_000 } })
}

/* ------------------------------------------------------------------ tests */

test('a cold boot arms every habit with a cooldown, not with a free claim', () => {
  assert.ok(settings(), 'defaults were written')
  assert.equal(alarms.size, 4, 'one alarm per reminder')
  for (const id of ['hydration', 'posture', 'eyes', 'stretch'] as const) {
    assert.equal(
      minutesOut(ledger()[id]),
      settings().reminders[id].intervalMinutes,
      `${id} starts a full interval out`,
    )
  }
})

test('a habit that is not due mints nothing', async () => {
  const before = exp()
  const res = await send<{ ok: boolean; reason?: string; waitMs?: number }>({
    type: 'COMPLETE_REMINDER',
    id: 'hydration',
  })
  assert.equal(res.ok, false)
  assert.equal(res.reason, 'cooldown')
  assert.ok((res.waitMs ?? 0) > 0)
  assert.equal(exp(), before, 'EXP is untouched by a refused claim')
})

test('spamming Done grants exactly one reward per interval', async () => {
  await makeDue('hydration')
  const before = exp()

  const first = await send<{ ok: boolean; player: { e: number } }>({
    type: 'COMPLETE_REMINDER',
    id: 'hydration',
  })
  assert.equal(first.ok, true)
  assert.ok(first.player.e > before, 'the honest claim pays out')

  const earned = exp()
  for (let i = 0; i < 8; i++) {
    const spam = await send<{ ok: boolean; reason?: string }>({
      type: 'COMPLETE_REMINDER',
      id: 'hydration',
    })
    assert.equal(spam.ok, false, `spam #${i + 1} was accepted`)
    assert.equal(spam.reason, 'cooldown')
  }
  assert.equal(exp(), earned, 'eight extra taps added nothing')

  const stats = (local.data[STATS_KEY] as { totalCompleted: number }).totalCompleted
  assert.equal(stats, 1, 'and only one completion was recorded')
})

test('claiming rearms the alarm and the cooldown from the same interval', () => {
  const minutes = settings().reminders.hydration.intervalMinutes
  assert.equal(minutesOut(ledger().hydration), minutes)
  assert.equal(alarms.get('kw:hydration')?.periodInMinutes, minutes)
})

test('the notification button obeys the cooldown too', async () => {
  const before = exp()
  await onButtonClicked.emit('kw:hydration:1710000000000', 0)
  assert.equal(exp(), before, 'a stale "Done ✓" on a notification cannot re-claim')

  await makeDue('hydration')
  await onButtonClicked.emit('kw:hydration:1710000000001', 0)
  assert.ok(exp() > before, 'but it still works when the habit is genuinely due')
})

test('a fired alarm unlocks the habit even while notifications are muted', async () => {
  const muted: Settings = { ...settings(), notificationsEnabled: false }
  await send({ type: 'UPDATE_SETTINGS', settings: muted })
  assert.ok(minutesOut(ledger().posture) > 0, 'still counting down')

  await onAlarm.emit({ name: 'kw:posture', scheduledTime: Date.now() })
  assert.ok(ledger().posture! <= Date.now(), 'the elapsed interval is owed regardless')
  assert.equal(notifications.length, 0, 'but nothing was shown')

  const res = await send<{ ok: boolean }>({ type: 'COMPLETE_REMINDER', id: 'posture' })
  assert.equal(res.ok, true)
})

test('a paused habit cannot be claimed at all', async () => {
  const current = settings()
  const off: Settings = {
    ...current,
    reminders: {
      ...current.reminders,
      stretch: { ...current.reminders.stretch, enabled: false },
    },
  }
  await send({ type: 'UPDATE_SETTINGS', settings: off })
  assert.equal(ledger().stretch, null)
  assert.equal(alarms.has('kw:stretch'), false, 'its alarm is gone')

  const res = await send<{ ok: boolean; reason?: string }>({
    type: 'COMPLETE_REMINDER',
    id: 'stretch',
  })
  assert.equal(res.ok, false)
  assert.equal(res.reason, 'paused')
})

test('a typed interval reaches the alarm exactly as entered', async () => {
  const current = settings()
  const tuned: Settings = {
    ...current,
    reminders: {
      ...current.reminders,
      eyes: { enabled: true, intervalMinutes: 7 },
      hydration: { enabled: true, intervalMinutes: 173 },
    },
  }
  const res = await send<{ schedule: Schedule }>({ type: 'UPDATE_SETTINGS', settings: tuned })

  assert.equal(alarms.get('kw:eyes')?.periodInMinutes, 7, 'no snapping to a curated stop')
  assert.equal(alarms.get('kw:hydration')?.periodInMinutes, 173)
  assert.equal(minutesOut(res.schedule.eyes), 7, 'and the countdown matches the alarm')
  assert.equal(minutesOut(res.schedule.hydration), 173)
})

test('retuning an interval does not swallow a claim the user has already earned', async () => {
  await makeDue('eyes')
  const current = settings()
  const slower: Settings = {
    ...current,
    reminders: { ...current.reminders, eyes: { enabled: true, intervalMinutes: 120 } },
  }
  await send({ type: 'UPDATE_SETTINGS', settings: slower })

  assert.ok(ledger().eyes! <= Date.now(), 'the owed claim survives the new interval')
  assert.equal((await send<{ ok: boolean }>({ type: 'COMPLETE_REMINDER', id: 'eyes' })).ok, true)
  assert.equal(minutesOut(ledger().eyes), 120, 'and the next one uses the new interval')
})

test('snoozing pushes the claim out with the nudge', async () => {
  await makeDue('hydration')
  const res = await send<{ schedule: Schedule }>({
    type: 'SNOOZE_REMINDER',
    id: 'hydration',
    minutes: 5,
  })
  assert.equal(minutesOut(res.schedule.hydration), 5)
  assert.equal(
    (await send<{ ok: boolean }>({ type: 'COMPLETE_REMINDER', id: 'hydration' })).ok,
    false,
    'a snooze is not a shortcut to the reward',
  )
})
