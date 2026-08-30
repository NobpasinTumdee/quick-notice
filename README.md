# 🌱 Kawaii Wellness Companion

A Chrome extension where **Momo**, a little mochi sprout, gently reminds you to hydrate,
sit up straight, rest your eyes and move — and levels up as you do. Glassmorphic popup,
five unlockable themes, a wardrobe of SVG wearables, and soft notifications that never
yank you out of flow.

![350×450 popup](public/icons/icon128.png)

## Features

| | |
|---|---|
| 💧 **Hydration** | every 15 min – 2 h |
| 🧘 **Posture** | every 15 min – 1.5 h |
| 👀 **Eye Rest** | the 20-20-20 rule |
| 🚶 **Stretch** | every 20 min – 2 h |

- **Animated mascot** — idle breathing, random blinks, a bouncy squash on poke, and a
  different face per reminder (thirsty, sleepy, stretching, happy, wink).
- **Wellness RPG** — every completed habit pays EXP and coins. EXP levels you up, levels put
  new gear on the shop shelf, and coins buy it. See [Progression](#progression).
- **Wardrobe** — 19 layered SVG wearables across three slots (head / outfit / prop), each
  previewed on Momo before you buy. Equipped items ride along on the mascot everywhere,
  including the level-up screen and notifications view.
- **Five themes** — Matcha Green, Sakura Pink, Ocean Blue, Midnight, Sunset Peach, unlocked
  by level. Every colour is a CSS variable, so switching repaints instantly and the mascot
  recolours with it.
- **Sound packs** — six notification sounds, synthesised at build time and unlocked as you
  level. Played through an offscreen document, since MV3 workers cannot play audio.
- **Per-reminder control** — toggle each habit and pick its interval on a snapped slider.
- **Quiet hours** — Momo stays silent overnight (or whenever you say) without losing the cycle.
- **Soft notifications** — silent, low priority, with **Done ✓** and **Snooze 5 min** buttons,
  illustrated with per-habit mascot art.
- **Streaks** — a daily streak and per-habit counters, kept in `chrome.storage`.

## Quick start

```bash
npm install
npm run build      # generates icons, typechecks, builds to dist/
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
select the `dist/` folder.

### Development

```bash
npm run dev
npm test           # economy + storage-schema tests, plain node --test
```

`@crxjs/vite-plugin` writes a live `dist/` with HMR — load it unpacked once and the popup
hot-reloads as you edit. Opening `http://localhost:5173/index.html` in a normal tab also
works: `src/lib/bridge.ts` falls back to mock state when no extension runtime is present,
so you can iterate on the UI without reloading the extension.

```bash
npm run icons      # redraw public/icons/*.png
npm run sounds     # re-synthesise src/lib/sounds.generated.ts
npm run typecheck  # tsc --noEmit
```

## How it works

```
src/
  manifest.config.ts        MV3 manifest (typed, version synced from package.json)
  background/
    service-worker.ts       owns every alarm, notification, badge and stat write
  offscreen/                the only context allowed to play audio in MV3
  components/
    Mascot.tsx              layered SVG character: 7 moods × 3 wearable slots
    mascot/parts.tsx        every wearable, as back/front draw calls in one viewBox
    HomeView.tsx            speech bubble, mascot, "next up" hero card, habit grid
    WardrobeView.tsx        the shop: level card, slot tabs, item grid, sound picker
    LevelUpOverlay.tsx      confetti, the new level, and exactly what it unlocked
    LevelBar.tsx            level badge + EXP bar + coin purse
    SettingsView.tsx        per-reminder toggles + sliders, theme picker, quiet hours
    ThemePicker.tsx         five themes as gradient chips, locked ones greyed
    TabBar.tsx              Momo / Shop / Setup, with a spring-shared pill
    Toggle.tsx              spring pill switch
    IntervalSlider.tsx      range input snapped to curated intervals
    GlassCard.tsx           the frosted surface everything is built from
    Header.tsx              level ring, title, streak, purse
    SpeechBubble.tsx        tail-pointed bubble with a pop transition
  hooks/useCompanion.ts     popup state: optimistic writes, debounced persistence
  lib/
    gamification.ts         the save format, level curve, item catalogue, shop rules
    audio.ts                sound selection + offscreen-document plumbing
    sounds.generated.ts     GENERATED base64 WAVs (npm run sounds)
    themes.ts               palettes + `applyTheme()` (writes CSS custom properties)
    reminders.ts            the habit catalogue: copy, tints, intervals, praise lines
    storage.ts              defaults, merges, streak maths, quiet-hours check
    bridge.ts               messaging to the worker, with a dev-mode mock
    format.ts               countdown / interval / hour formatting
scripts/generate-icons.mjs   draws every PNG from code (no binary assets in the repo)
scripts/generate-sounds.mjs  synthesises the sound pack into sounds.generated.ts
tests/economy.test.ts        13 tests over the economy and the storage schema
```

**The service worker owns all timing.** Popups are destroyed the moment they close, so the
UI only ever reads state and sends intents (`GET_STATE`, `UPDATE_SETTINGS`,
`COMPLETE_REMINDER`, `SNOOZE_REMINDER`, `PREVIEW_NOTIFICATION`). Alarms are reconciled
against settings on install, on startup, on every settings change, and on cold worker boot —
so an alarm set can never drift from what the user asked for.

**Marking a habit done restarts its cycle**, so an early sip means the next nudge is a full
interval away rather than seconds later.

**Settings live in `chrome.storage.sync`** (they follow the user across devices); stats and
the pending-badge list live in `chrome.storage.local`.

## Progression

| | |
|---|---|
| Habit completed | **+12 EXP**, **+6 coins**, plus a streak bonus of up to +10 EXP |
| Level-up | **+20 + 10×level** coins, and whatever that level unlocks |
| Curve | `60 × 1.15^(level-1)` EXP — level 2 lands on the 5th habit, level 10 around the 60th |
| Cap | level 50 |

Levels put items **on the shelf**; coins **buy** them. Themes and sound packs need only the
level. Buying an item equips it immediately, and tapping a worn item takes it off.

### The save format

The whole RPG state is one `chrome.storage.sync` item under `kw:p`, with single-character
keys and integer ids:

```ts
interface PlayerState {
  l: number                       // level
  e: number                       // EXP toward the next level (resets on level-up)
  c: number                       // coins
  eq: [number, number, number]    // equipped ids: [head, outfit, prop]; 0 = empty
  u: number[]                     // owned item ids
  t: number                       // unlocked-theme bitmask
  s: number                       // selected sound id
}
```

**A fully maxed save — every item owned, every theme unlocked — is 126 bytes**, about 1.5% of
the 8 KB per-item quota and 0.1% of the 100 KB total. `estimateBytes()` measures it and
`tests/economy.test.ts` fails the build if the schema ever grows past 400 bytes.

Nothing but ids is stored. SVG parts are React components in `components/mascot/parts.tsx`,
audio is base64 in the bundle, themes are CSS variables. `mergePlayer()` treats storage as
untrusted: unknown item ids are dropped, equips referencing unowned items are cleared, the
level is clamped, and level-derived unlocks are re-derived — so a synced save from a newer
build (or a corrupted one) can never equip art this build does not have.

## Permissions

| Permission | Why |
|---|---|
| `storage` | settings, streaks, daily counters |
| `alarms` | the reminder timers — MV3 workers cannot hold `setInterval` |
| `notifications` | the nudges themselves |
| `offscreen` | playing the selected sound — MV3 workers have no `Audio`/`AudioContext` |

No host permissions, no content scripts, no network calls: the extension never touches the
pages you browse.

## Notes

- Chrome enforces a **1-minute minimum** on alarm periods; every interval offered here is
  well above it.
- `chrome.action.openPopup()` (used when a notification body is clicked) needs Chrome 127+;
  it fails silently on older builds and the toolbar icon still works.
- `prefers-reduced-motion` disables the animations, including Momo's breathing.
- Notification sounds need an **offscreen document** (`chrome.offscreen`, Chrome 109+); the
  worker creates one on first sound and reuses it. Chrome's own notification chime stays off
  (`silent: true`) so the chosen pack is the only thing you hear.
- The sound pack is 8-bit mono PCM at 11 kHz (~42 KB of base64) and is code-split into its
  own chunk, so the popup paints without ever loading it.
- `npm test` runs on plain `node --test`; `scripts/ts-resolve.mjs` is a ~15-line hook that
  lets Node resolve the app's bundler-style imports.
