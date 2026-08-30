/**
 * Wellness RPG — levels, coins, wardrobe items and the compressed save format.
 *
 * STORAGE CONTRACT (chrome.storage.sync: 100KB total, 8KB per item, 120 writes/min)
 * --------------------------------------------------------------------------------
 * The entire player save is one item under the key `kw:p`, using single-character
 * field names and small integer ids. Nothing here holds an asset: SVG parts live
 * in `components/mascot/parts.tsx`, audio lives in `lib/sounds.generated.ts`, and
 * themes are CSS variables. Storage keeps *ids only*.
 *
 * A maxed save — every item owned, every theme unlocked — serialises to roughly
 * 170 bytes, about 2% of a single item's quota. `estimateBytes()` measures it and
 * `assertBudget()` is the guard used in tests/dev.
 *
 * Item ids are deliberately dense per slot (10s = head, 20s = outfit, 40s = prop)
 * so `u` stays a short list of one- or two-digit numbers. With ≤30 items a bitmask
 * would be smaller still, but the array survives the catalogue outgrowing 31 items
 * without a migration, which is the cheaper long-term trade.
 */
import { THEMES } from './themes'
import type { PlayerState, Rarity, Slot, ThemeId } from './types'

export const SLOTS: readonly Slot[] = ['head', 'outfit', 'prop'] as const
export const MAX_LEVEL = 50
export const PLAYER_KEY = 'kw:p'

/* ------------------------------------------------------------ level curve */

/** EXP needed to clear `level` and reach the next one. */
export function xpForLevel(level: number): number {
  if (level >= MAX_LEVEL) return Number.POSITIVE_INFINITY
  return Math.round(60 * Math.pow(1.15, level - 1))
}

export interface LevelProgress {
  level: number
  exp: number
  need: number
  /** 0–1, ready for a progress bar width. */
  pct: number
  maxed: boolean
}

export function levelProgress(player: PlayerState): LevelProgress {
  const need = xpForLevel(player.l)
  const maxed = player.l >= MAX_LEVEL
  return {
    level: player.l,
    exp: player.e,
    need: maxed ? 0 : need,
    pct: maxed ? 1 : Math.min(1, player.e / need),
    maxed,
  }
}

/* ---------------------------------------------------------------- rewards */

export const REWARD = {
  /** Base EXP for finishing any habit. */
  exp: 12,
  /** Base coins for finishing any habit. */
  coins: 6,
  /** Extra EXP per streak day, capped so a long streak cannot trivialise the curve. */
  streakExpCap: 10,
  /** Coins handed out on level-up: flat + per level. */
  levelUpCoins: (level: number) => 20 + level * 10,
} as const

export interface CompletionReward {
  exp: number
  coins: number
}

export function completionReward(streakDays: number): CompletionReward {
  const streakBonus = Math.min(Math.max(streakDays, 0), REWARD.streakExpCap)
  return {
    exp: REWARD.exp + streakBonus,
    coins: REWARD.coins + Math.floor(streakBonus / 2),
  }
}

/* ------------------------------------------------------------- catalogue */

export interface Item {
  id: number
  slot: Slot
  name: string
  rarity: Rarity
  /** Level that puts the item on the shop shelf. */
  level: number
  /** Coin price once unlocked. */
  price: number
  /** Key into the SVG part registry — the art itself never touches storage. */
  part: string
  /** One-liner shown on the shop card. */
  blurb: string
}

export const RARITY_META: Record<Rarity, { label: string; color: string; ring: string }> = {
  1: { label: 'Common', color: '#94a3b8', ring: 'rgb(148 163 184 / 0.45)' },
  2: { label: 'Rare', color: '#38bdf8', ring: 'rgb(56 189 248 / 0.45)' },
  3: { label: 'Epic', color: '#a78bfa', ring: 'rgb(167 139 250 / 0.5)' },
  4: { label: 'Legendary', color: '#fbbf24', ring: 'rgb(251 191 36 / 0.55)' },
}

export const ITEMS: Item[] = [
  // ---- head (10s) -------------------------------------------------------
  { id: 11, slot: 'head', name: 'Ribbon Bow', rarity: 1, level: 1, price: 40, part: 'bow', blurb: 'A tidy little bow.' },
  { id: 12, slot: 'head', name: 'Straw Hat', rarity: 1, level: 3, price: 60, part: 'strawHat', blurb: 'For sunny window desks.' },
  { id: 13, slot: 'head', name: 'Cosy Beanie', rarity: 2, level: 5, price: 110, part: 'beanie', blurb: 'Knitted by a friend.' },
  { id: 14, slot: 'head', name: 'Flower Crown', rarity: 2, level: 7, price: 140, part: 'flowerCrown', blurb: 'Spring, worn on the head.' },
  { id: 15, slot: 'head', name: 'Cat Ears', rarity: 3, level: 9, price: 200, part: 'catEars', blurb: 'Momo insists they are real.' },
  { id: 16, slot: 'head', name: 'Wizard Hat', rarity: 3, level: 12, price: 260, part: 'wizardHat', blurb: 'Hydration is the true magic.' },
  { id: 17, slot: 'head', name: 'Tiny Halo', rarity: 4, level: 16, price: 420, part: 'halo', blurb: 'Awarded for perfect posture.' },

  // ---- outfit (20s) -----------------------------------------------------
  { id: 21, slot: 'outfit', name: 'Wool Scarf', rarity: 1, level: 2, price: 50, part: 'scarf', blurb: 'Warm and a bit dramatic.' },
  { id: 22, slot: 'outfit', name: 'Barista Apron', rarity: 1, level: 4, price: 80, part: 'apron', blurb: 'Matcha, obviously.' },
  { id: 23, slot: 'outfit', name: 'Comfy Hoodie', rarity: 2, level: 6, price: 130, part: 'hoodie', blurb: 'Deploy-day uniform.' },
  { id: 24, slot: 'outfit', name: 'Sailor Collar', rarity: 2, level: 8, price: 170, part: 'sailor', blurb: 'Ready to set sail.' },
  { id: 25, slot: 'outfit', name: 'Star Cape', rarity: 3, level: 11, price: 240, part: 'cape', blurb: 'Swooshes when you stretch.' },
  { id: 26, slot: 'outfit', name: 'Frog Onesie', rarity: 4, level: 14, price: 380, part: 'onesie', blurb: 'Ribbit. Deeply comfortable.' },

  // ---- prop (40s) -------------------------------------------------------
  { id: 41, slot: 'prop', name: 'Water Bottle', rarity: 1, level: 2, price: 45, part: 'bottle', blurb: 'Never empty for long.' },
  { id: 42, slot: 'prop', name: 'Matcha Cup', rarity: 1, level: 5, price: 70, part: 'teaCup', blurb: 'Steam included.' },
  { id: 43, slot: 'prop', name: 'Mini Dumbbell', rarity: 2, level: 7, price: 120, part: 'dumbbell', blurb: 'Two whole kilograms.' },
  { id: 44, slot: 'prop', name: 'Pocket Book', rarity: 2, level: 10, price: 180, part: 'book', blurb: 'Look away from the screen.' },
  { id: 45, slot: 'prop', name: 'Star Wand', rarity: 3, level: 13, price: 300, part: 'wand', blurb: 'Casts *remember to blink*.' },
  { id: 46, slot: 'prop', name: 'Rubber Duck', rarity: 4, level: 18, price: 460, part: 'duck', blurb: 'Debugs your posture.' },
]

export const ITEM_MAP: ReadonlyMap<number, Item> = new Map(ITEMS.map((i) => [i.id, i]))

export function itemsForSlot(slot: Slot): Item[] {
  return ITEMS.filter((i) => i.slot === slot)
}

export const SLOT_INDEX: Record<Slot, 0 | 1 | 2> = { head: 0, outfit: 1, prop: 2 }

export const SLOT_META: Record<Slot, { label: string; emoji: string }> = {
  head: { label: 'Head', emoji: '🎀' },
  outfit: { label: 'Outfit', emoji: '🧣' },
  prop: { label: 'Prop', emoji: '✨' },
}

/* ----------------------------------------------------------- sound packs */

export interface SoundMeta {
  id: number
  name: string
  level: number
  /** Key into the generated base64 audio table. */
  key: string
}

export const SOUNDS: SoundMeta[] = [
  { id: 0, name: 'Soft Ping', level: 1, key: 'ping' },
  { id: 1, name: 'Cute Pop', level: 1, key: 'pop' },
  { id: 2, name: '8-bit Blip', level: 3, key: 'blip' },
  { id: 3, name: 'Wind Chime', level: 6, key: 'chime' },
  { id: 4, name: 'Bubble', level: 9, key: 'bubble' },
  { id: 5, name: 'Silent', level: 1, key: 'silent' },
]

export const SOUND_MAP: ReadonlyMap<number, SoundMeta> = new Map(SOUNDS.map((s) => [s.id, s]))

/* ---------------------------------------------------------------- themes */

/** Level at which each theme unlocks, indexed like `THEMES`. */
export const THEME_UNLOCK_LEVEL: Record<ThemeId, number> = {
  matcha: 1,
  sakura: 2,
  ocean: 4,
  midnight: 6,
  sunset: 9,
}

export const themeBit = (index: number) => 1 << index

export function themeIndex(id: ThemeId): number {
  return THEMES.findIndex((t) => t.id === id)
}

export function isThemeUnlocked(player: PlayerState, id: ThemeId): boolean {
  const index = themeIndex(id)
  return index >= 0 && (player.t & themeBit(index)) !== 0
}

/** Bitmask of every theme available at `level`. */
export function themeMaskForLevel(level: number): number {
  return THEMES.reduce(
    (mask, theme, index) => (level >= THEME_UNLOCK_LEVEL[theme.id] ? mask | themeBit(index) : mask),
    0,
  )
}

/* ------------------------------------------------------------ save format */

export function defaultPlayer(): PlayerState {
  return {
    l: 1,
    e: 0,
    c: 0,
    eq: [0, 0, 0],
    u: [],
    t: themeMaskForLevel(1),
    s: 0,
  }
}

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback
  return Math.min(max, Math.max(min, n))
}

/**
 * Rebuilds a valid save from whatever storage returned. Unknown ids are dropped
 * rather than trusted, so a downgrade (or a corrupted sync) cannot equip an item
 * the running build has no art for.
 */
export function mergePlayer(raw: unknown): PlayerState {
  const base = defaultPlayer()
  if (!raw || typeof raw !== 'object') return base
  const p = raw as Partial<PlayerState>

  const level = clampInt(p.l, 1, MAX_LEVEL, base.l)
  const owned = Array.isArray(p.u)
    ? [...new Set(p.u.filter((id): id is number => typeof id === 'number' && ITEM_MAP.has(id)))]
    : []

  const equipped = SLOTS.map((slot, i) => {
    const id = Array.isArray(p.eq) ? p.eq[i] : 0
    if (typeof id !== 'number' || id === 0) return 0
    const item = ITEM_MAP.get(id)
    // Equipping something unowned or slot-mismatched is not representable.
    return item && item.slot === slot && owned.includes(id) ? id : 0
  }) as PlayerState['eq']

  const sound = SOUND_MAP.has(clampInt(p.s, 0, 99, base.s)) ? clampInt(p.s, 0, 99, base.s) : base.s

  return {
    l: level,
    e: clampInt(p.e, 0, 1_000_000, 0),
    c: clampInt(p.c, 0, 9_999_999, 0),
    eq: equipped,
    u: owned.sort((a, b) => a - b),
    // Level-based unlocks are re-derived, so a curve change never strands a theme.
    t: clampInt(p.t, 0, 0xffff, 0) | themeMaskForLevel(level),
    s: soundUnlocked(level, sound) ? sound : 0,
  }
}

export function soundUnlocked(level: number, soundId: number): boolean {
  const sound = SOUND_MAP.get(soundId)
  return !!sound && level >= sound.level
}

/** Serialised size of the save — the number that matters against the 8KB cap. */
export function estimateBytes(player: PlayerState): number {
  return new TextEncoder().encode(JSON.stringify({ [PLAYER_KEY]: player })).length
}

export const SYNC_ITEM_LIMIT = 8192

export function assertBudget(player: PlayerState): void {
  const bytes = estimateBytes(player)
  if (bytes > SYNC_ITEM_LIMIT / 2) {
    console.warn(`[kawaii] player save is ${bytes}B, over half the sync item quota`)
  }
}

/* ------------------------------------------------------------- transitions
 * All pure: they take a save and return a new one plus what the UI should
 * celebrate. The service worker owns when they run; nothing here touches
 * chrome.* so it stays trivially testable.
 */

export interface LevelUpResult {
  player: PlayerState
  levelsGained: number
  coinsAwarded: number
  /** Themes and sounds that became available at the new level. */
  unlockedThemes: ThemeId[]
  unlockedSounds: SoundMeta[]
  /** Shop items that just appeared on the shelf (still cost coins). */
  shopUnlocks: Item[]
}

export interface GrantResult extends LevelUpResult {
  expGained: number
  coinsGained: number
}

/** Applies a habit completion: EXP, coins, and any level-ups it cascades into. */
export function grantCompletion(player: PlayerState, streakDays: number): GrantResult {
  const reward = completionReward(streakDays)
  const gained = addExp(player, reward.exp)
  return {
    ...gained,
    player: { ...gained.player, c: gained.player.c + reward.coins },
    expGained: reward.exp,
    coinsGained: reward.coins + gained.coinsAwarded,
  }
}

/** Adds EXP and rolls over as many levels as it earns. */
export function addExp(player: PlayerState, exp: number): LevelUpResult {
  let level = player.l
  let pool = player.e + Math.max(0, Math.trunc(exp))
  let coinsAwarded = 0

  while (level < MAX_LEVEL && pool >= xpForLevel(level)) {
    pool -= xpForLevel(level)
    level += 1
    coinsAwarded += REWARD.levelUpCoins(level)
  }
  if (level >= MAX_LEVEL) pool = 0

  const beforeMask = player.t
  const afterMask = beforeMask | themeMaskForLevel(level)

  const next: PlayerState = {
    ...player,
    l: level,
    e: pool,
    c: player.c + coinsAwarded,
    t: afterMask,
  }

  const levelsGained = level - player.l
  return {
    player: next,
    levelsGained,
    coinsAwarded,
    unlockedThemes: THEMES.filter(
      (_, i) => (afterMask & themeBit(i)) !== 0 && (beforeMask & themeBit(i)) === 0,
    ).map((t) => t.id),
    unlockedSounds: SOUNDS.filter((s) => s.level > player.l && s.level <= level),
    shopUnlocks: ITEMS.filter((i) => i.level > player.l && i.level <= level),
  }
}

export type PurchaseError = 'unknown' | 'owned' | 'locked' | 'poor'

export type PurchaseResult =
  | { ok: true; player: PlayerState; item: Item }
  | { ok: false; reason: PurchaseError }

/** Buys an item and equips it immediately — nobody buys a hat to leave it in a drawer. */
export function buyItem(player: PlayerState, itemId: number): PurchaseResult {
  const item = ITEM_MAP.get(itemId)
  if (!item) return { ok: false, reason: 'unknown' }
  if (player.u.includes(itemId)) return { ok: false, reason: 'owned' }
  if (player.l < item.level) return { ok: false, reason: 'locked' }
  if (player.c < item.price) return { ok: false, reason: 'poor' }

  const owned = [...player.u, itemId].sort((a, b) => a - b)
  const eq = [...player.eq] as PlayerState['eq']
  eq[SLOT_INDEX[item.slot]] = itemId

  return { ok: true, player: { ...player, c: player.c - item.price, u: owned, eq }, item }
}

/** Equips an owned item, or clears the slot when `itemId` is 0. */
export function equipItem(player: PlayerState, slot: Slot, itemId: number): PlayerState {
  if (itemId !== 0) {
    const item = ITEM_MAP.get(itemId)
    if (!item || item.slot !== slot || !player.u.includes(itemId)) return player
  }
  const eq = [...player.eq] as PlayerState['eq']
  const index = SLOT_INDEX[slot]
  // Tapping the equipped item again takes it off.
  eq[index] = eq[index] === itemId ? 0 : itemId
  return { ...player, eq }
}

export function equippedId(player: PlayerState, slot: Slot): number {
  return player.eq[SLOT_INDEX[slot]] ?? 0
}

export function ownsItem(player: PlayerState, itemId: number): boolean {
  return player.u.includes(itemId)
}

export type ItemStatus = 'equipped' | 'owned' | 'buyable' | 'unaffordable' | 'locked'

export function itemStatus(player: PlayerState, item: Item): ItemStatus {
  if (equippedId(player, item.slot) === item.id) return 'equipped'
  if (ownsItem(player, item.id)) return 'owned'
  if (player.l < item.level) return 'locked'
  return player.c >= item.price ? 'buyable' : 'unaffordable'
}

/* ---------------------------------------------------------------- storage */

export async function loadPlayer(): Promise<PlayerState> {
  const bag = await chrome.storage.sync.get(PLAYER_KEY)
  return mergePlayer(bag[PLAYER_KEY])
}

export async function savePlayer(player: PlayerState): Promise<void> {
  assertBudget(player)
  await chrome.storage.sync.set({ [PLAYER_KEY]: player })
}
