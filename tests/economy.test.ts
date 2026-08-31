/**
 * Economy + storage-schema tests.
 *
 *   npm test            (node --test, no browser, no build step)
 *
 * These run against the real modules — Node 24 strips the TypeScript types
 * natively. The point of most of them is the sync-storage contract: the save
 * must stay tiny, and it must survive garbage coming back from storage.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  addExp,
  buyItem,
  completionReward,
  defaultPlayer,
  equipItem,
  estimateBytes,
  grantCompletion,
  isThemeUnlocked,
  ITEMS,
  MAX_LEVEL,
  mergePlayer,
  soundUnlocked,
  SOUNDS,
  SYNC_ITEM_LIMIT,
  themeMaskForLevel,
  xpForLevel,
} from '../src/lib/gamification.ts'
import type { PlayerState } from '../src/lib/types.ts'

const maxedSave: PlayerState = {
  l: MAX_LEVEL,
  e: 412,
  c: 1_840,
  eq: [19, 31, 49],
  u: ITEMS.map((i) => i.id),
  t: 0b1111111111,
  s: 4,
}

test('a fully unlocked save is a rounding error against the sync quota', () => {
  const bytes = estimateBytes(maxedSave)
  assert.ok(bytes < SYNC_ITEM_LIMIT, `${bytes}B exceeds the 8KB per-item limit`)
  // Generous headroom check: if this ever trips, the schema grew a string field.
  assert.ok(bytes < 400, `${bytes}B is larger than the compressed schema should ever be`)
})

test('item ids stay small enough to keep `u` compact', () => {
  assert.ok(ITEMS.every((i) => i.id < 100))
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length, 'duplicate item id')
})

test('the level curve rises and terminates at the cap', () => {
  const curve = [1, 5, 10, 20, 49].map(xpForLevel)
  curve.forEach((need, i) => {
    if (i > 0) assert.ok(need > curve[i - 1], 'curve must be monotonic')
  })
  assert.equal(xpForLevel(MAX_LEVEL), Number.POSITIVE_INFINITY)
})

test('completions pay a base reward plus a capped streak bonus', () => {
  assert.deepEqual(completionReward(0), { exp: 12, coins: 6 })
  assert.deepEqual(completionReward(8), { exp: 20, coins: 10 })
  // A 400-day streak must not outrun the curve.
  assert.deepEqual(completionReward(400), completionReward(10))
})

test('the fifth habit of a fresh save is the first level-up', () => {
  let player = defaultPlayer()
  const levelledOn: number[] = []
  for (let i = 1; i <= 6; i++) {
    const result = grantCompletion(player, 0)
    player = result.player
    if (result.levelsGained > 0) levelledOn.push(i)
  }
  assert.deepEqual(levelledOn, [5])
  assert.equal(player.l, 2)
  assert.ok(player.c > 36, 'level-up should pay a coin bonus on top of the per-habit coins')
})

test('a single large grant cascades through levels and reports every unlock', () => {
  const result = addExp(defaultPlayer(), 5_000)
  assert.ok(result.levelsGained > 10)
  assert.ok(result.shopUnlocks.length > 5)
  assert.ok(result.unlockedThemes.includes('midnight'))
  assert.equal(result.player.t, themeMaskForLevel(result.player.l))
})

test('exp never overflows past the level cap', () => {
  const result = addExp({ ...defaultPlayer(), l: MAX_LEVEL }, 999_999)
  assert.equal(result.player.l, MAX_LEVEL)
  assert.equal(result.player.e, 0)
})

test('themes unlock by level, not by purchase', () => {
  const fresh = defaultPlayer()
  assert.ok(isThemeUnlocked(fresh, 'matcha'))
  assert.ok(!isThemeUnlocked(fresh, 'sakura'))
  assert.ok(isThemeUnlocked(addExp(fresh, 60).player, 'sakura'))
})

test('the shop refuses every invalid purchase', () => {
  const rich: PlayerState = { ...defaultPlayer(), l: 20, c: 1_000 }

  const bought = buyItem(rich, 11)
  assert.ok(bought.ok)
  assert.equal(bought.player.c, 960)
  assert.equal(bought.player.eq[0], 11, 'buying should equip immediately')

  assert.equal(buyItem(bought.player, 11).ok, false, 'cannot rebuy')
  assert.equal(buyItem({ ...defaultPlayer(), c: 9_999 }, 17).ok, false, 'cannot outspend the level gate')
  assert.equal(buyItem({ ...defaultPlayer(), l: 20, c: 5 }, 11).ok, false, 'cannot overdraw coins')
  assert.equal(buyItem(rich, 9_999).ok, false, 'unknown item')
})

test('equipping honours ownership and slots', () => {
  const owner: PlayerState = { ...defaultPlayer(), u: [11, 41] }
  assert.equal(equipItem(owner, 'head', 11).eq[0], 11)
  assert.equal(equipItem(owner, 'head', 12).eq[0], 0, 'unowned items cannot be worn')
  assert.equal(equipItem(owner, 'head', 41).eq[0], 0, 'a prop cannot go on the head')

  const worn = equipItem(owner, 'head', 11)
  assert.equal(equipItem(worn, 'head', 11).eq[0], 0, 'tapping the worn item takes it off')
})

test('a corrupted or downgraded save is rebuilt, never trusted', () => {
  const dirty = mergePlayer({
    l: 999,
    e: -5,
    c: 1e12,
    eq: [9_999, 21, 'x'],
    u: [11, 11, 4_242],
    t: 1,
    s: 4,
  })
  assert.equal(dirty.l, MAX_LEVEL)
  assert.equal(dirty.e, 0)
  assert.deepEqual(dirty.u, [11], 'unknown ids dropped, duplicates collapsed')
  assert.deepEqual(dirty.eq, [0, 0, 0], 'equips referencing unowned items are cleared')
  assert.equal(dirty.t, themeMaskForLevel(MAX_LEVEL), 'level-derived unlocks are restored')

  assert.deepEqual(mergePlayer(undefined), defaultPlayer())
  assert.deepEqual(mergePlayer('nonsense'), defaultPlayer())
  assert.deepEqual(mergePlayer(null), defaultPlayer())
})

test('a sound above the player level is not selectable', () => {
  assert.ok(!soundUnlocked(1, 4))
  assert.ok(soundUnlocked(9, 4))
  assert.equal(mergePlayer({ ...defaultPlayer(), s: 4 }).s, 0, 'locked selection falls back')
})

test('every selectable sound has a real file behind it', async () => {
  const { statSync } = await import('node:fs')
  const { SOUND_KEYS, soundPath } = await import('../src/lib/sounds.generated.ts')
  for (const sound of SOUNDS) {
    if (sound.key === 'silent') continue
    assert.ok(SOUND_KEYS.includes(sound.key as never), `${sound.name} is not in the audio manifest`)
    // The pack is build output, so this also catches a stale public/sounds.
    const bytes = statSync(`public/${soundPath(sound.key as never)}`).size
    assert.ok(bytes > 1_000, `${sound.name} has a suspiciously small file (${bytes}B)`)
  }
})

test('the maxed save still fits after the catalogue expansion', () => {
  // 30 items and 10 themes: the save grew by ids only, never by content.
  assert.ok(estimateBytes(maxedSave) < 400)
})
