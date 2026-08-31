/**
 * The catalogue: every wearable, sound pack and theme unlock in the game.
 *
 * STORAGE RULE
 * ------------
 * Nothing in this file is ever written to `chrome.storage`. The save holds
 * **integer ids only** — `eq: [head, outfit, prop]`, `u: number[]`, `s: number`,
 * and a theme bitmask. Names, blurbs, prices, SVG part keys and audio filenames
 * all live here in the bundle, so the catalogue can grow without the save
 * growing with it: these 30 items still cost the same bytes as the original 19.
 *
 * ID RANGES — permanent. Ids are the save format, so they are append-only and
 * never reused:
 *
 *   10-19  head        20-39  outfit        40-59  prop
 *
 * The blocks are dense and two-digit so `u` stays a short list of small numbers.
 * An id that disappears from this file is silently dropped from a save by
 * `mergePlayer`, which is the intended behaviour for a retired item — but it
 * takes the player's purchase with it, so retire nothing casually.
 */
import type { Rarity, Slot, ThemeId } from './types'

export const SLOTS: readonly Slot[] = ['head', 'outfit', 'prop'] as const

export const SLOT_INDEX: Record<Slot, 0 | 1 | 2> = { head: 0, outfit: 1, prop: 2 }

export const SLOT_META: Record<Slot, { label: string; emoji: string }> = {
  head: { label: 'Head', emoji: '🎀' },
  outfit: { label: 'Outfit', emoji: '🧣' },
  prop: { label: 'Prop', emoji: '✨' },
}

export const RARITY_META: Record<Rarity, { label: string; color: string; ring: string }> = {
  1: { label: 'Common', color: '#94a3b8', ring: 'rgb(148 163 184 / 0.45)' },
  2: { label: 'Rare', color: '#38bdf8', ring: 'rgb(56 189 248 / 0.45)' },
  3: { label: 'Epic', color: '#a78bfa', ring: 'rgb(167 139 250 / 0.5)' },
  4: { label: 'Legendary', color: '#fbbf24', ring: 'rgb(251 191 36 / 0.55)' },
}

export interface Item {
  id: number
  slot: Slot
  name: string
  rarity: Rarity
  /** Level that puts the item on the shop shelf. */
  level: number
  /** Coin price once unlocked. */
  price: number
  /** Key into the SVG part registry (`components/mascot/parts.tsx`). */
  part: string
  /** One-liner shown on the shop card. */
  blurb: string
}

/* ------------------------------------------------------------------ items */

export const ITEMS: Item[] = [
  // ---- head (10-19) -----------------------------------------------------
  { id: 10, slot: 'head', name: 'Sprout Crown', rarity: 1, level: 1, price: 30, part: 'sproutCrown', blurb: 'Momo, but leafier.' },
  { id: 11, slot: 'head', name: 'Ribbon Bow', rarity: 1, level: 1, price: 40, part: 'bow', blurb: 'A tidy little bow.' },
  { id: 12, slot: 'head', name: 'Straw Hat', rarity: 1, level: 3, price: 60, part: 'strawHat', blurb: 'For sunny window desks.' },
  { id: 13, slot: 'head', name: 'Cosy Beanie', rarity: 1, level: 5, price: 90, part: 'beanie', blurb: 'Knitted by a friend.' },
  { id: 14, slot: 'head', name: 'Flower Crown', rarity: 2, level: 7, price: 140, part: 'flowerCrown', blurb: 'Spring, worn on the head.' },
  { id: 15, slot: 'head', name: 'Cat Ears', rarity: 2, level: 9, price: 170, part: 'catEars', blurb: 'Momo insists they are real.' },
  { id: 16, slot: 'head', name: 'Wizard Hat', rarity: 3, level: 12, price: 260, part: 'wizardHat', blurb: 'Hydration is the true magic.' },
  { id: 18, slot: 'head', name: 'Audiophile IEMs', rarity: 3, level: 15, price: 320, part: 'iems', blurb: 'Lossless, obviously.' },
  { id: 17, slot: 'head', name: 'Tiny Halo', rarity: 4, level: 16, price: 420, part: 'halo', blurb: 'Awarded for perfect posture.' },
  { id: 19, slot: 'head', name: 'Mecha V-Fin', rarity: 4, level: 20, price: 520, part: 'vFin', blurb: 'Posture protocol engaged.' },

  // ---- outfit (20-39) ---------------------------------------------------
  { id: 27, slot: 'outfit', name: 'Plain Tee', rarity: 1, level: 1, price: 35, part: 'tee', blurb: 'Simple. Breathable. Fine.' },
  { id: 21, slot: 'outfit', name: 'Wool Scarf', rarity: 1, level: 2, price: 50, part: 'scarf', blurb: 'Warm and a bit dramatic.' },
  { id: 22, slot: 'outfit', name: 'Barista Apron', rarity: 1, level: 4, price: 80, part: 'apron', blurb: 'Matcha, obviously.' },
  { id: 23, slot: 'outfit', name: 'Comfy Hoodie', rarity: 2, level: 6, price: 130, part: 'hoodie', blurb: 'Deploy-day uniform.' },
  { id: 24, slot: 'outfit', name: 'Sailor Collar', rarity: 2, level: 8, price: 170, part: 'sailor', blurb: 'Ready to set sail.' },
  { id: 28, slot: 'outfit', name: 'Oversized Sweater', rarity: 2, level: 9, price: 190, part: 'sweater', blurb: 'Sleeves past the paws.' },
  { id: 25, slot: 'outfit', name: 'Star Cape', rarity: 3, level: 11, price: 240, part: 'cape', blurb: 'Swooshes when you stretch.' },
  { id: 29, slot: 'outfit', name: 'Ninja Suit', rarity: 3, level: 17, price: 340, part: 'ninja', blurb: 'Silent, like a good notification.' },
  { id: 30, slot: 'outfit', name: 'Hacker Hoodie', rarity: 3, level: 19, price: 360, part: 'hackerHoodie', blurb: 'sudo drink water' },
  { id: 26, slot: 'outfit', name: 'Frog Onesie', rarity: 4, level: 14, price: 380, part: 'onesie', blurb: 'Ribbit. Deeply comfortable.' },
  { id: 31, slot: 'outfit', name: 'Space Suit', rarity: 4, level: 24, price: 600, part: 'spaceSuit', blurb: 'Hydration is life support.' },

  // ---- prop (40-59) -----------------------------------------------------
  { id: 41, slot: 'prop', name: 'Water Bottle', rarity: 1, level: 2, price: 45, part: 'bottle', blurb: 'Never empty for long.' },
  { id: 47, slot: 'prop', name: 'Coffee Cup', rarity: 1, level: 3, price: 55, part: 'coffee', blurb: 'Second breakfast beverage.' },
  { id: 42, slot: 'prop', name: 'Matcha Cup', rarity: 1, level: 5, price: 70, part: 'teaCup', blurb: 'Steam included.' },
  { id: 43, slot: 'prop', name: 'Mini Dumbbell', rarity: 2, level: 7, price: 120, part: 'dumbbell', blurb: 'Two whole kilograms.' },
  { id: 44, slot: 'prop', name: 'Pocket Book', rarity: 2, level: 10, price: 180, part: 'book', blurb: 'Look away from the screen.' },
  { id: 45, slot: 'prop', name: 'Star Wand', rarity: 3, level: 13, price: 300, part: 'wand', blurb: 'Casts *remember to blink*.' },
  { id: 48, slot: 'prop', name: 'Gaming Mouse', rarity: 3, level: 16, price: 310, part: 'mouse', blurb: 'Ergonomic. Allegedly.' },
  { id: 49, slot: 'prop', name: 'Mech Keyboard', rarity: 3, level: 21, price: 380, part: 'keyboard', blurb: 'Thock. Thock. Thock.' },
  { id: 46, slot: 'prop', name: 'Rubber Duck', rarity: 4, level: 18, price: 460, part: 'duck', blurb: 'Debugs your posture.' },
]

export const ITEM_MAP: ReadonlyMap<number, Item> = new Map(ITEMS.map((i) => [i.id, i]))

/** Shop order: cheapest first, so a slot's shelf reads as a ladder. */
export function itemsForSlot(slot: Slot): Item[] {
  return ITEMS.filter((i) => i.slot === slot).sort((a, b) => a.level - b.level || a.price - b.price)
}

/* ------------------------------------------------------------ sound packs */

export interface SoundMeta {
  id: number
  name: string
  level: number
  /** Basename of the file in `public/sounds/` — also the key in the audio manifest. */
  key: string
  /** Shown under the name in the shop's sound tab. */
  blurb: string
}

/**
 * Sound ids are save data (`PlayerState['s']`), so they are append-only too.
 * `silent` keeps id 5 rather than moving to the end for that reason.
 */
export const SOUNDS: SoundMeta[] = [
  { id: 0, name: 'Default Ping', level: 1, key: 'ping', blurb: 'Soft and unobtrusive.' },
  { id: 1, name: 'Cute Pop', level: 1, key: 'pop', blurb: 'A little mouth pop.' },
  { id: 5, name: 'Silent', level: 1, key: 'silent', blurb: 'Notifications, no sound.' },
  { id: 2, name: 'Retro 8-bit', level: 3, key: 'blip', blurb: 'Classic arcade jump.' },
  { id: 3, name: 'Wind Chime', level: 6, key: 'chime', blurb: 'Three struck bars.' },
  { id: 4, name: 'Bubble', level: 9, key: 'bubble', blurb: 'Something surfacing.' },
  { id: 6, name: 'Zen Bell', level: 12, key: 'zen', blurb: 'A deep singing bowl.' },
  { id: 9, name: 'Cat Meow', level: 14, key: 'meow', blurb: 'Momo says hello.' },
  { id: 7, name: 'Mecha Lock-on', level: 18, key: 'lockon', blurb: 'Target acquired: water.' },
  { id: 8, name: 'Math Rock Riff', level: 22, key: 'mathrock', blurb: 'Two seconds of tapping.' },
]

export const SOUND_MAP: ReadonlyMap<number, SoundMeta> = new Map(SOUNDS.map((s) => [s.id, s]))

/** Sounds the worker plays for its own events; never selectable, always present. */
export const SYSTEM_SOUND_KEYS = ['levelup', 'coin'] as const

/* ---------------------------------------------------------- theme unlocks */

/**
 * Level at which each theme unlocks. The bit *position* comes from the order of
 * `THEMES`; this table only decides when it lights up.
 */
export const THEME_UNLOCK_LEVEL: Record<ThemeId, number> = {
  matcha: 1,
  sakura: 2,
  ocean: 4,
  midnight: 6,
  sunset: 9,
  cafe: 12,
  lofi: 15,
  nebula: 18,
  mecha: 22,
  cyber: 26,
}
