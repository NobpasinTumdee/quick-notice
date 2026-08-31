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
import {
  ITEM_MAP,
  ITEMS,
  SLOT_INDEX,
  SLOTS,
  SOUND_MAP,
  SOUNDS,
  THEME_UNLOCK_LEVEL,
  type Item,
  type SoundMeta,
} from './inventory'
import { THEMES } from './themes'
import type { PlayerState, Slot, ThemeId } from './types'

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

/* --------------------------------------------------------------- cooldown */

/**
 * Slack allowed when comparing "now" against a due timestamp.
 *
 * The panel's clock and the worker's clock are the same clock, but a click is
 * dispatched a few frames after the countdown paints "ready". Without a small
 * grace the user could tap a button the UI has already enabled and be told to
 * wait — the guard exists to stop farming, not to punish a fast finger.
 */
export const CLAIM_GRACE_MS = 1_500

export type ClaimDenial = 'paused' | 'cooldown'

export type ClaimCheck =
  | { ok: true }
  | {
      ok: false
      reason: ClaimDenial
      /** ms until the habit unlocks; 0 when it is simply switched off. */
      waitMs: number
    }

/**
 * Decides whether a habit may be claimed for EXP right now.
 *
 * This is the whole anti-farm rule, and it is deliberately a pure function of
 * (enabled, dueAt, now): the UI calls it to grey the button out, and the service
 * worker calls it again before minting anything. The UI copy is a courtesy — the
 * worker's call is the one that counts, because a crafted `COMPLETE_REMINDER`
 * message from a console can skip the button entirely.
 */
export function checkClaim(
  enabled: boolean,
  dueAt: number | null | undefined,
  now: number,
): ClaimCheck {
  if (!enabled) return { ok: false, reason: 'paused', waitMs: 0 }
  // No timestamp yet (fresh install, repaired save): treat it as still counting
  // down rather than as free EXP.
  if (typeof dueAt !== 'number' || !Number.isFinite(dueAt)) {
    return { ok: false, reason: 'cooldown', waitMs: 0 }
  }
  const waitMs = dueAt - now
  if (waitMs > CLAIM_GRACE_MS) return { ok: false, reason: 'cooldown', waitMs }
  return { ok: true }
}

/* --------------------------------------------------------------- catalogue */

/**
 * The catalogue itself lives in `inventory.ts` — items, sound packs and theme
 * unlock levels. It is re-exported here so callers keep importing "the game"
 * from one place, while this module stays about *rules* and the save format.
 */
export {
  ITEM_MAP,
  ITEMS,
  itemsForSlot,
  RARITY_META,
  SLOT_INDEX,
  SLOT_META,
  SLOTS,
  SOUND_MAP,
  SOUNDS,
  SYSTEM_SOUND_KEYS,
  THEME_UNLOCK_LEVEL,
  type Item,
  type SoundMeta,
} from './inventory'

/* ------------------------------------------------------------------ themes */

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
