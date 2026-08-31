/**
 * Cooldown + interval tests.
 *
 * These cover the anti-farm rule end to end at the pure level: the ledger
 * (`mergeDue` / `retimeDue` / `dueAfter`), the guard the worker and the UI both
 * call (`checkClaim`), and the interval clamp that stands between a typed value
 * and `chrome.alarms`.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CLAIM_GRACE_MS, checkClaim } from '../src/lib/gamification.ts'
import {
  clampInterval,
  INTERVAL_FALLBACK,
  INTERVAL_MAX,
  INTERVAL_MIN,
} from '../src/lib/reminders.ts'
import {
  defaultSettings,
  dueAfter,
  mergeDue,
  mergeSettings,
  retimeDue,
} from '../src/lib/storage.ts'
import type { Settings } from '../src/lib/types.ts'

const NOW = 1_710_000_000_000
const MIN = 60_000

const withHydration = (patch: Partial<Settings['reminders']['hydration']>): Settings => {
  const base = defaultSettings()
  return {
    ...base,
    reminders: { ...base.reminders, hydration: { ...base.reminders.hydration, ...patch } },
  }
}

test('a habit still counting down cannot be claimed', () => {
  const check = checkClaim(true, NOW + 10 * MIN, NOW)
  assert.equal(check.ok, false)
  assert.equal(check.ok === false && check.reason, 'cooldown')
  assert.equal(check.ok === false && check.waitMs, 10 * MIN)
})

test('a habit whose timer is up can be claimed, and stays claimable', () => {
  assert.ok(checkClaim(true, NOW, NOW).ok)
  // Ignored for an hour: the claim is still owed, not expired.
  assert.ok(checkClaim(true, NOW - 60 * MIN, NOW).ok)
})

test('the guard tolerates the gap between painting "ready" and the click', () => {
  assert.ok(checkClaim(true, NOW + CLAIM_GRACE_MS - 1, NOW).ok)
  assert.equal(checkClaim(true, NOW + CLAIM_GRACE_MS + 1, NOW).ok, false)
})

test('a paused habit is never claimable, and neither is a missing timestamp', () => {
  const paused = checkClaim(false, NOW - MIN, NOW)
  assert.equal(paused.ok, false)
  assert.equal(paused.ok === false && paused.reason, 'paused')

  // A hole in the ledger must read as "not yet", never as free EXP.
  assert.equal(checkClaim(true, null, NOW).ok, false)
  assert.equal(checkClaim(true, undefined, NOW).ok, false)
  assert.equal(checkClaim(true, Number.NaN, NOW).ok, false)
})

test('spamming Done cannot outrun the interval', () => {
  const settings = withHydration({ intervalMinutes: 30 })
  let due = mergeDue({ hydration: NOW - MIN }, settings, NOW)
  assert.ok(checkClaim(true, due.hydration, NOW).ok, 'the first claim is allowed')

  // What the worker does on a successful claim.
  due = { ...due, hydration: dueAfter(30, NOW) }

  for (const t of [NOW, NOW + MIN, NOW + 29 * MIN]) {
    assert.equal(checkClaim(true, due.hydration, t).ok, false, `claimed again at +${t - NOW}ms`)
  }
  assert.ok(
    checkClaim(true, due.hydration, NOW + 30 * MIN).ok,
    'and allowed once the interval is up',
  )
})

test('switching a habit off and on again does not mint a claim', () => {
  const off = mergeDue({ hydration: NOW - MIN }, withHydration({ enabled: false }), NOW)
  assert.equal(off.hydration, null)

  const backOn = mergeDue(off, withHydration({ enabled: true, intervalMinutes: 45 }), NOW)
  assert.equal(backOn.hydration, NOW + 45 * MIN)
  assert.equal(checkClaim(true, backOn.hydration, NOW).ok, false)
})

test('a corrupt far-future timestamp cannot lock a habit away', () => {
  const settings = withHydration({ intervalMinutes: 20 })
  const due = mergeDue({ hydration: NOW + 500 * 24 * 60 * MIN }, settings, NOW)
  assert.equal(due.hydration, NOW + 20 * MIN, 'pulled back to one interval')

  assert.deepEqual(mergeDue('nonsense', settings, NOW).hydration, NOW + 20 * MIN)
  assert.deepEqual(mergeDue(undefined, settings, NOW).hydration, NOW + 20 * MIN)
})

test('retuning an interval restarts the countdown but never swallows a due claim', () => {
  const counting = retimeDue({ hydration: NOW + 40 * MIN }, 'hydration', 10, NOW)
  assert.equal(counting.hydration, NOW + 10 * MIN, 'a running timer restarts on the new interval')

  const owed = { hydration: NOW - 5 * MIN }
  assert.equal(retimeDue(owed, 'hydration', 90, NOW).hydration, NOW - 5 * MIN)
})

test('intervals are clamped to what chrome.alarms will actually honour', () => {
  assert.equal(clampInterval(0), INTERVAL_MIN)
  assert.equal(clampInterval(-30), INTERVAL_MIN)
  assert.equal(clampInterval(9_000), INTERVAL_MAX)
  assert.equal(clampInterval('45'), 45)
  assert.equal(clampInterval(12.7), 13, 'alarms take whole minutes')
  assert.equal(clampInterval(Number.POSITIVE_INFINITY), INTERVAL_MAX)
  assert.equal(clampInterval(Number.NEGATIVE_INFINITY), INTERVAL_MIN)
  // Unreadable must not become "nudge me every minute".
  assert.equal(clampInterval('abc'), INTERVAL_FALLBACK)
  assert.equal(clampInterval(undefined), INTERVAL_FALLBACK)
  assert.equal(clampInterval(null), INTERVAL_MIN, 'Number(null) is 0, which is simply too small')
})

test('a stored interval from any source is clamped on the way in', () => {
  const wild = mergeSettings({
    reminders: { hydration: { enabled: true, intervalMinutes: 100_000 } },
  })
  assert.equal(wild.reminders.hydration.intervalMinutes, INTERVAL_MAX)
  assert.equal(
    mergeSettings({ reminders: { eyes: { intervalMinutes: 0 } } }).reminders.eyes.intervalMinutes,
    INTERVAL_MIN,
  )
  // Every default must itself be inside the granular range.
  for (const conf of Object.values(defaultSettings().reminders)) {
    assert.equal(clampInterval(conf.intervalMinutes), conf.intervalMinutes)
  }
})

test('dueAfter and the alarm delay come from the same clamped minutes', () => {
  assert.equal(dueAfter(7, NOW), NOW + 7 * MIN)
  assert.equal(dueAfter(0, NOW), NOW + INTERVAL_MIN * MIN)
  assert.equal(dueAfter(10_000, NOW), NOW + INTERVAL_MAX * MIN)
})
