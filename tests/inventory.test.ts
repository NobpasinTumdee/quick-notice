/**
 * Catalogue tests.
 *
 * The expansion made the item list, the theme list and the sound list all much
 * longer, and every one of them is indexed by something the save format depends
 * on: item ids, the theme bit position, the sound id. These are the invariants
 * that keep a five-year-old save loading correctly.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  ITEMS,
  itemsForSlot,
  RARITY_META,
  SLOTS,
  SOUNDS,
  THEME_UNLOCK_LEVEL,
} from '../src/lib/inventory.ts'
import { MAX_LEVEL, themeBit, themeIndex, themeMaskForLevel } from '../src/lib/gamification.ts'
import { THEMES } from '../src/lib/themes.ts'

/** Documented id blocks — permanent, because ids are the save format. */
const SLOT_RANGE: Record<string, [number, number]> = {
  head: [10, 19],
  outfit: [20, 39],
  prop: [40, 59],
}

test('item ids are unique and inside their slot block', () => {
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length, 'duplicate item id')
  for (const item of ITEMS) {
    const [lo, hi] = SLOT_RANGE[item.slot]
    assert.ok(
      item.id >= lo && item.id <= hi,
      `${item.name} (${item.id}) is outside the ${item.slot} block ${lo}-${hi}`,
    )
    assert.ok(item.id < 100, 'ids stay two digits so `u` stays compact')
  }
})

test('every slot has a full ladder of rarities', () => {
  for (const slot of SLOTS) {
    const shelf = itemsForSlot(slot)
    assert.ok(shelf.length >= 9, `${slot} only has ${shelf.length} items`)
    const rarities = new Set(shelf.map((i) => i.rarity))
    assert.ok(rarities.has(1), `${slot} has no common item`)
    assert.ok(rarities.has(4), `${slot} has no legendary item`)
    // The shelf is what the shop renders, so it must come out cheapest-first.
    const levels = shelf.map((i) => i.level)
    assert.deepEqual(
      levels,
      [...levels].sort((a, b) => a - b),
      `${slot} shelf is out of order`,
    )
  }
})

test('rarer items cost more and unlock later', () => {
  for (const rarity of [1, 2, 3] as const) {
    const cheaper = ITEMS.filter((i) => i.rarity === rarity)
    const dearer = ITEMS.filter((i) => i.rarity === rarity + 1)
    const maxCheap = Math.max(...cheaper.map((i) => i.price))
    const maxDear = Math.max(...dearer.map((i) => i.price))
    assert.ok(maxDear > maxCheap, `${RARITY_META[rarity].label} is not cheaper than the next tier`)
  }
  assert.ok(ITEMS.every((i) => i.level >= 1 && i.level <= MAX_LEVEL))
  assert.ok(ITEMS.every((i) => i.price > 0))
})

test('every item points at a part that actually exists', () => {
  // parts.tsx is JSX, so it cannot be imported here — the registry is read as
  // text instead. Still catches the failure that matters: an item whose art was
  // never written, which renders as a silently empty slot.
  const source = readFileSync('src/components/mascot/parts.tsx', 'utf8')
  const registry = source.slice(source.indexOf('export const PARTS'))
  for (const item of ITEMS) {
    assert.match(registry, new RegExp(`\\b${item.part}:\\s*\\{`), `no art for ${item.name}`)
  }
})

test('sound ids and keys are unique, and levels are reachable', () => {
  assert.equal(new Set(SOUNDS.map((s) => s.id)).size, SOUNDS.length, 'duplicate sound id')
  assert.equal(new Set(SOUNDS.map((s) => s.key)).size, SOUNDS.length, 'duplicate sound key')
  assert.ok(SOUNDS.every((s) => s.level >= 1 && s.level <= MAX_LEVEL))
  assert.ok(
    SOUNDS.some((s) => s.level === 1 && s.key !== 'silent'),
    'a fresh player must have something audible',
  )
})

test('theme bit positions never move', () => {
  // A save stores unlocked themes as a bitmask over THEMES' order. If these
  // indices ever shift, every existing player silently gets someone else's
  // unlocks — so the original five are pinned here on purpose.
  assert.equal(themeIndex('matcha'), 0)
  assert.equal(themeIndex('sakura'), 1)
  assert.equal(themeIndex('ocean'), 2)
  assert.equal(themeIndex('midnight'), 3)
  assert.equal(themeIndex('sunset'), 4)
})

test('every theme is fully configured and unlockable', () => {
  const VARS = Object.keys(THEMES[0].vars)
  for (const theme of THEMES) {
    assert.ok(THEME_UNLOCK_LEVEL[theme.id] >= 1, `${theme.name} has no unlock level`)
    assert.deepEqual(Object.keys(theme.vars), VARS, `${theme.name} is missing CSS variables`)
    assert.ok(['light', 'dark'].includes(theme.scheme), `${theme.name} has no colour scheme`)
    assert.equal(theme.swatch.length, 2)
    // A theme whose ink matches its background would be unreadable.
    assert.notEqual(theme.vars['--kw-ink'], theme.vars['--kw-bg-start'], theme.name)
  }
  assert.equal(new Set(THEMES.map((t) => t.id)).size, THEMES.length, 'duplicate theme id')
})

test('the level cap unlocks every theme, and level 1 unlocks exactly one', () => {
  const all = THEMES.reduce((mask, _, i) => mask | themeBit(i), 0)
  assert.equal(themeMaskForLevel(MAX_LEVEL), all)

  const starter = themeMaskForLevel(1)
  const count = THEMES.filter((_, i) => (starter & themeBit(i)) !== 0).length
  assert.equal(count, 1, 'a new player should start with matcha and nothing else')
})

test('the expansion is reachable before the level cap', () => {
  const latest = Math.max(
    ...ITEMS.map((i) => i.level),
    ...SOUNDS.map((s) => s.level),
    ...Object.values(THEME_UNLOCK_LEVEL),
  )
  assert.ok(latest < MAX_LEVEL, `nothing should unlock at the cap itself (latest: ${latest})`)
})
