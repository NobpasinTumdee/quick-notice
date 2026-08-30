import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultSettings, isQuiet, mergeSettings, VIEW_MODES } from '../src/lib/storage.ts'

test('a fresh profile opens in the side panel', () => {
  assert.equal(defaultSettings().viewMode, 'sidepanel')
})

test('view mode survives a round trip through storage', () => {
  for (const mode of VIEW_MODES) {
    assert.equal(mergeSettings({ ...defaultSettings(), viewMode: mode }).viewMode, mode)
  }
})

test('an unknown view mode falls back instead of stranding the action', () => {
  // A bad value here would leave the toolbar icon wired to neither surface.
  assert.equal(mergeSettings({ viewMode: 'tab' }).viewMode, 'sidepanel')
  assert.equal(mergeSettings({ viewMode: 42 }).viewMode, 'sidepanel')
  assert.equal(mergeSettings({ viewMode: null }).viewMode, 'sidepanel')
})

test('settings saved before view mode existed still load', () => {
  // Shape of a save written by the pre-side-panel build.
  const legacy = {
    theme: 'ocean',
    notificationsEnabled: false,
    quietHours: { enabled: true, from: 22, to: 7 },
    reminders: { hydration: { enabled: false, intervalMinutes: 90 } },
  }
  const merged = mergeSettings(legacy)
  assert.equal(merged.viewMode, 'sidepanel', 'missing field takes the default')
  assert.equal(merged.theme, 'ocean', 'existing fields are preserved')
  assert.equal(merged.reminders.hydration.intervalMinutes, 90)
  assert.equal(merged.reminders.stretch.enabled, true, 'absent reminders fall back to defaults')
})

test('garbage settings yield a usable object', () => {
  assert.deepEqual(mergeSettings(undefined), defaultSettings())
  assert.deepEqual(mergeSettings('nope'), defaultSettings())
})

test('quiet hours wrap around midnight', () => {
  const s = { ...defaultSettings(), quietHours: { enabled: true, from: 22, to: 8 } }
  const at = (hour: number) => new Date(2026, 0, 1, hour, 0, 0)
  assert.ok(isQuiet(s, at(23)))
  assert.ok(isQuiet(s, at(3)))
  assert.ok(!isQuiet(s, at(12)))
  assert.ok(!isQuiet({ ...s, quietHours: { ...s.quietHours, enabled: false } }, at(23)))
})
