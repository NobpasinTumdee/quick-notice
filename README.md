# 🌱 Kawaii Wellness Companion

A Chrome extension where **Momo**, a little mochi sprout, gently reminds you to hydrate,
sit up straight, rest your eyes and move — and levels up as you do. Glassmorphic popup,
five unlockable themes, a wardrobe of SVG wearables, and soft notifications that never
yank you out of flow.

Opens in the Chrome **side panel** or as a classic **popup** — your choice, switchable in
settings at any time.

![Momo](public/icons/icon128.png)

## Features

| | |
|---|---|
| 💧 **Hydration** | every 15 min – 2 h |
| 🧘 **Posture** | every 15 min – 1.5 h |
| 👀 **Eye Rest** | the 20-20-20 rule |
| 🚶 **Stretch** | every 20 min – 2 h |

- **Animated mascot** — idle breathing, random blinks, a bouncy squash on poke, and ten
  expressions: a face per reminder (thirsty, sleepy, stretching), plus happy, wink, **focused**
  (headband on, shown once you are a few habits into the day), **cool** (shades) and **dizzy**
  (swirl eyes, when three nudges are stacked up waiting). Expressions are state, never
  inventory — they cost nothing and are stored nowhere. Try them in the wardrobe's *Face* strip.
- **Wellness RPG** — every completed habit pays EXP and coins. EXP levels you up, levels put
  new gear on the shop shelf, and coins buy it. See [Progression](#progression).
- **Wardrobe** — 30 layered SVG wearables across three slots (head / outfit / prop), each
  previewed on Momo before you buy, and each ranked Common → Legendary. Recent arrivals include
  Audiophile IEMs, a Mecha V-Fin, an Oversized Sweater, a Ninja Suit, a Hacker Hoodie, a Space
  Suit, a Gaming Mouse and a Mechanical Keyboard. Equipped items ride along on the mascot
  everywhere, including the level-up screen and notifications view.
- **Ten themes** — Matcha Green, Sakura Pink, Ocean Blue, Midnight, Sunset Peach, Cozy Cafe,
  Lofi Chill, Galactic Nebula, Mecha Strike and Cyber Hacker, unlocked by level. Every colour
  is a CSS variable, so switching repaints instantly, the mascot recolours with it, and the
  dark themes also flip `color-scheme` so the browser's own canvas follows.
- **Sound packs** — ten notification sounds, unlocked as you level: Default Ping, Cute Pop,
  Retro 8-bit, Wind Chime, Bubble, Zen Bell, Cat Meow, Mecha Lock-on, Math Rock Riff, and
  Silent. All synthesised at build time — see [Sound](#sound) — and played through an offscreen
  document, since MV3 workers cannot play audio.
- **Per-reminder control** — toggle each habit and set its interval to the exact minute, from
  1 to 180, by dragging or by typing.
- **One reward per interval** — **Done ✓** unlocks when a habit falls due and re-locks the
  moment it is claimed, so the button cannot be farmed. See [Cooldowns](#cooldowns).
- **Quiet hours** — Momo stays silent overnight (or whenever you say) without losing the cycle.
- **Soft notifications** — silent, low priority, with **Done ✓** and **Snooze 5 min** buttons,
  illustrated with per-habit mascot art.
- **In-page toast** — a glass card in the corner of the page you are already reading, with
  Momo, the nudge, and the same two buttons. Swipe it away, or let it time itself out. It
  lives in a shadow root and cannot touch the page's styling. See [In-page toast](#in-page-toast).
- **Streaks** — a daily streak and per-habit counters, kept in `chrome.storage`.
- **Your choice of surface** — side panel (stays open beside your tabs) or popup, picked in
  Settings → *Open as*. See [Surfaces](#surfaces-side-panel-or-popup).

## Quick start

```bash
npm install
npm run build      # generates icons, typechecks, builds to dist/
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
select the `dist/` folder. **Click the toolbar icon** to open Momo — in the side panel by
default, or as a popup once you switch modes in Settings.

### Development

```bash
npm run dev
npm test           # economy + storage-schema tests, plain node --test
```

`@crxjs/vite-plugin` writes a live `dist/` with HMR — load it unpacked once and the panel
hot-reloads as you edit. Opening `http://localhost:5173/index.html` in a normal tab also
works: `src/lib/bridge.ts` falls back to mock state when no extension runtime is present,
so you can iterate on the UI without reloading the extension. Narrow the browser window to
~320–420px to preview panel widths.

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
    ViewModePicker.tsx      side panel vs popup, with a diagram of each
    TabBar.tsx              Momo / Shop / Setup, with a spring-shared pill
    Toggle.tsx              spring pill switch
    NumberSlider.tsx        range input paired with a typed number box (intervals, duration)
    GlassCard.tsx           the frosted surface everything is built from
    Header.tsx              level ring, title, streak, purse
    SpeechBubble.tsx        tail-pointed bubble with a pop transition
  content/
    index.ts                content script: a listener and nothing else until a nudge lands
    mount.tsx               shadow root, style injection, React root, teardown
    ToastStack.tsx          queue, replacement and exit sequencing
    ToastWidget.tsx         the card: drag to dismiss, countdown, Done / Snooze
    toast.css               Tailwind for the shadow root only (`?inline`, never the page)
  hooks/useCompanion.ts     popup state: optimistic writes, debounced persistence
  lib/
    gamification.ts         the save format, level curve, cooldown guard, shop rules
    inventory.ts            THE CATALOGUE: 30 items, 10 sound packs, theme unlock levels
    audio.ts                sound selection + offscreen-document plumbing
    sounds.generated.ts     GENERATED key manifest for public/sounds (npm run sounds)
    surface.ts              reads the ?surface flag: popup vs side panel
    themes.ts               palettes + `applyTheme()` (writes CSS custom properties)
    reminders.ts            the habit catalogue: copy, tints, intervals, praise lines
    storage.ts              defaults, merges, streak maths, quiet-hours check
    bridge.ts               messaging to the worker, with a dev-mode mock
    format.ts               countdown / interval / hour formatting
scripts/generate-icons.mjs   draws every PNG from code (no binary assets in the repo)
scripts/generate-sounds.mjs  synthesises 11 WAVs into public/sounds (no binary assets either)
tests/economy.test.ts        13 tests over the economy and the storage schema
tests/settings.test.ts       6 tests over settings migration and view-mode validation
tests/cooldown.test.ts       11 tests over the claim guard, the ledger and interval clamping
tests/worker.test.ts         10 tests driving the real worker against an in-memory chrome
tests/inventory.test.ts      9 tests pinning ids, id ranges, theme bits and item/art pairing
```

**The service worker owns all timing.** The UI only ever reads state and sends intents
(`GET_STATE`, `UPDATE_SETTINGS`, `COMPLETE_REMINDER`, `SNOOZE_REMINDER`,
`PREVIEW_NOTIFICATION`, `EQUIP_ITEM`, `BUY_ITEM`, `SET_SOUND`). Alarms are reconciled against
settings on install, on startup, on every settings change, and on cold worker boot — so an
alarm set can never drift from what the user asked for.

## Surfaces: side panel or popup

Both surfaces load the same `index.html`. Which one the toolbar icon opens is a setting
(`viewMode`, default `sidepanel`), applied by the worker rather than fixed in the manifest.

**MV3 gives the popup priority**: if an action popup is set, the icon opens it and
`openPanelOnActionClick` never gets a look in. So `updateViewMode()` always writes both
halves as a pair — clearing one is what lets the other work:

```ts
// side panel                        // popup
setPopup({ popup: '' })              setPanelBehavior({ openPanelOnActionClick: false })
setPanelBehavior({ ...: true })      setPopup({ popup: POPUP_PATH })
```

That state belongs to the profile, not the manifest, and **`action.setPopup` does not survive
a browser restart** — so `updateViewMode()` runs on install, on startup, on cold worker boot
(an MV3 worker can be respawned without either event firing), and from the
`storage.onChanged` listener whenever `viewMode` actually changes.

The popup path carries a flag — `index.html?surface=popup` — because the two surfaces are
otherwise indistinguishable from inside the page, and they need different sizing. A side
panel fills a real viewport, so `height: 100%` works. A popup's viewport is derived from its
*content*, so percentage heights have nothing to resolve against and collapse the window;
`main.tsx` stamps `data-surface` before first paint and the popup gets fixed dimensions,
within the 800×600 ceiling Chrome enforces:

| Surface | Sizing |
|---|---|
| Side panel | `width: 100%`, `min-width: 300px`, full viewport height |
| Popup | `380 × 600px`, `max-height: 600px` |

The move is not just a resize. A popup was destroyed on every close, so mounting was enough
to guarantee fresh state; a panel can sit open for hours beside the tabs. `useCompanion` now
keeps itself current from four directions:

| Trigger | Catches |
|---|---|
| `storage.onChanged` (sync `kw:p`) | EXP, coins and gear — including a **Done ✓** tapped on a notification |
| `storage.onChanged` (sync `kw:settings`) | edits from another window, ignoring the echo of its own debounced write |
| `storage.onChanged` (local `kw:stats`) | a habit completing or a nudge firing, which also moves the schedule |
| `visibilitychange` + a 45s poll | anything storage cannot announce, such as a snooze that only shifted an alarm |

Layout-wise the panel is the viewport: the document is fluid with a 300px floor, the column
centres past 520px so a widened panel does not stretch cards, Momo stays **pinned at the top**
while the habit list scrolls under her with a frosted fade, habits became full-width rows, and
the shop grows to three columns past 430px.

**Settings live in `chrome.storage.sync`** (they follow the user across devices); stats, the
pending-badge list and the cooldown ledger live in `chrome.storage.local`.

## Cooldowns

Each habit carries a `nextDue` timestamp — the moment its nudge fires and its **Done ✓**
button unlocks. They live together in one local item, `kw:due`:

```json
{ "hydration": 1710000000000, "posture": 1710000600000, "eyes": null, "stretch": 1710002400000 }
```

`null` means the reminder is switched off. Local rather than sync: these move on every
completion, snooze and alarm, which is far too churny for sync's 1800-writes-per-hour ceiling,
and a cooldown belongs to the machine you are sitting at rather than to the account.

The rule itself is one pure function, `checkClaim(enabled, dueAt, now)` in `gamification.ts`.
The UI calls it to grey the button out; **the worker calls it again before minting anything**,
which is the call that counts — a crafted `COMPLETE_REMINDER` message skips the button
entirely, so a refused claim must leave the save untouched. Claiming rearms the alarm and the
cooldown from the same interval, so the countdown on screen is the one the nudge will honour.

A few consequences worth knowing:

- An ignored nudge stays claimable. The periodic alarm rolls forward on its own; the ledger
  does not, so a habit that came due an hour ago is still owed — but it is owed **once**,
  not once per missed cycle.
- Muted notifications and quiet hours silence the nudge without withholding the reward: the
  interval still elapsed.
- Switching a habit off and back on starts a fresh interval, so toggling cannot mint a claim.
- Retuning an interval restarts a running countdown, but never swallows a claim you have
  already earned.
- Snoozing pushes the claim out with the nudge — otherwise it would just be a slower **Done**.

## The catalogue

Items, sound packs and theme unlock levels all live in `src/lib/inventory.ts`, and **none of it
is ever written to storage**. The save holds integer ids only — `eq: [head, outfit, prop]`,
`u: number[]`, a sound id, and a theme bitmask — so the catalogue can keep growing without the
save growing with it. Expanding from 19 items and 5 themes to 30 items and 10 themes cost the
save exactly zero extra bytes per item owned beyond the id itself; a fully maxed save is still
under 400 bytes, which `tests/economy.test.ts` enforces.

Three things in there are permanent, because they *are* the save format:

| | Why it can never change |
|---|---|
| **Item ids** (head 10-19, outfit 20-39, prop 40-59) | An id that disappears is dropped from every save that owned it |
| **Sound ids** | `PlayerState['s']` stores the number, not the name — which is why `Silent` keeps id 5 instead of moving to the end of the list |
| **Theme order in `THEMES`** | Unlocks are a bitmask indexed by position, so new themes are only ever appended. `tests/inventory.test.ts` pins the original five indices |

Rarity runs Common → Rare → Epic → Legendary, and the tests check that each slot offers a full
ladder, that dearer tiers really are dearer, that every item's `part` key has art behind it in
`components/mascot/parts.tsx`, and that nothing unlocks at the level cap itself.

## Sound

The pack is **generated, not licensed**: `scripts/generate-sounds.mjs` synthesises all eleven
WAVs from scratch (16-bit mono, 22.05 kHz) into `public/sounds/`, which is git-ignored build
output exactly like `public/icons/`. Nothing binary is checked in, and nothing is downloaded.

They used to be base64 data URIs inlined in the bundle — every player shipped 43 KB of audio
whether or not they ever changed the sound. As files, Chrome fetches only the one that plays.

A couple of them are more than beeps:

- **Zen Bell** uses *inharmonic* partials (roughly 1 : 2.7 : 5.4 : 8.9, the ratios a singing
  bowl actually rings at) with two slightly detuned copies of the fundamental, which is where
  the slow beating comes from. Whole-number harmonics would just sound like an organ.
- **Math Rock Riff** is Karplus-Strong: a noise burst circulated through a delay line one
  period long and averaged each lap, which genuinely behaves like a plucked string. The taps
  are grouped in 7/8 over an open drone, because of course they are.
- **Cat Meow** is mostly *contour* — a pitch arc up and back down through two sweeping
  formants. Get the arc right and a crude source reads as feline.

Sounds are deterministic: the noise generator is seeded, so a rebuild produces byte-identical
files.

## In-page toast

When a nudge fires, the worker also sends a `SHOW_TOAST` message to the active tab, and a
glass card slides in at the bottom right of whatever page you are reading — Momo in your
current outfit, the reminder, **Done ✓** and **Snooze**. Swipe it sideways to throw it away,
or leave it: it counts itself out along the rail at the bottom.

Off by nobody's default but yours: *Settings → Notifications → In-page toast*, with a duration
slider from 1 to 60 seconds, or **0 for "stays until dismissed"**.

### It cannot break the pages you visit

This is the part worth being careful about. Injecting Tailwind into a host page's `<head>`
would restyle every site you browse — Preflight alone resets margins, headings, lists and form
controls. So the toast lives in a **shadow root**, and its stylesheet is imported with Vite's
`?inline` and injected *into that root*:

```ts
import css from './toast.css?inline'      // a string, not a <style> in the page
const shadow = host.attachShadow({ mode: 'open' })
shadow.append(Object.assign(document.createElement('style'), { textContent: css }))
```

Two details that follow from being in a shadow tree: theme variables go on `:host` rather than
`:root` (a shadow tree cannot see the document element), and the host element gets
`all: initial` plus a few `!important`s so a page's own `div { position: static !important }`
cannot relocate it.

The test for this drives a deliberately hostile page — `* { font-family: Comic Sans !important }`,
`div { position: static !important }`, a `content-box` reset — and compares nine computed
styles before and after the toast mounts. Nothing moves, the page's head gains no stylesheet,
and the card still renders in Baloo 2 at 320px with its blur intact.

### Cost on pages you visit

The content script that runs everywhere is **1.6 KB**. React, Framer Motion, the mascot art and
the stylesheet are behind a dynamic `import()` that only runs the first time a nudge actually
arrives, and the whole thing unmounts and removes its host element once the last card leaves.
A browsing session with no reminders in it pays for a message listener and nothing more.

### What it costs you in permissions

`content_scripts` on `<all_urls>` is what makes Chrome say *"Read and change all your data on
all websites"* at install. That is the honest price of drawing on arbitrary pages, and it is
the only reason the extension asks for it — there is no host permission, no `tabs` permission,
and no page reading of any kind. `chrome.tabs.query` is used for the active tab's **id** and
nothing else, and `chrome.tabs.sendMessage` only ever talks to our own content script. If you
would rather not grant that, turning the toast off leaves the desktop notification doing the
same job.

### Failure modes it expects

- **A tab with no content script** — `chrome://` pages, the Web Store, PDFs, and every tab that
  was already open when the extension was installed. `sendMessage` rejects; the toast is
  skipped and the desktop notification still lands.
- **A stale card** — the worker re-checks the cooldown when **Done ✓** is pressed, so a habit
  already ticked off elsewhere is refused, and the card says so rather than silently failing.
- **Quiet hours and muted notifications** silence the toast along with the banner.

## Progression

| | |
|---|---|
| Habit completed | **+12 EXP**, **+6 coins**, plus a streak bonus of up to +10 EXP |
| Level-up | **+20 + 10×level** coins, and whatever that level unlocks |
| Curve | `60 × 1.15^(level-1)` EXP — level 2 lands on the 5th habit, level 10 around the 60th |
| Cap | level 50 |

Levels put items **on the shelf**; coins **buy** them. Themes and sound packs need only the
level. Buying an item equips it immediately, and tapping a worn item takes it off. The
catalogue runs to level 26 (Cyber Hacker), so there is something to unlock most of the way to
the cap — see [The catalogue](#the-catalogue).

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

**A fully maxed save — all 30 items owned, all 10 themes unlocked — is 161 bytes**, about 2% of
the 8 KB per-item quota and 0.16% of the 100 KB total. `estimateBytes()` measures it and
`tests/economy.test.ts` fails the build if the schema ever grows past 400 bytes.

Nothing but ids is stored. The catalogue is `lib/inventory.ts`, SVG parts are React components
in `components/mascot/parts.tsx`, audio is WAV files in `public/sounds/`, themes are CSS
variables. `mergePlayer()` treats storage as
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
| `sidePanel` | the UI itself |
| `content_scripts` on `<all_urls>` | drawing the in-page toast; no host permissions, no page reading |

No host permissions and no network calls. The only thing that reaches a page you browse is the
toast, which draws into its own shadow root and reads nothing — see
[In-page toast](#in-page-toast).

## Notes

- Chrome enforces a **1-minute minimum** on alarm periods, which is exactly the floor the
  interval control offers; anything reaching an alarm goes through `clampInterval()`, since a
  non-finite period would throw and take the whole cycle down with it.
- `chrome.action.openPopup()` (used when a notification body is clicked) needs Chrome 127+;
  it fails silently on older builds and the toolbar icon still works.
- `prefers-reduced-motion` disables the animations, including Momo's breathing.
- The side panel needs **Chrome 114+**. Switching modes takes effect on the next icon click;
  an already-open panel or popup stays as it is.
- The side panel entry stays registered in popup mode, so it can still be opened from Chrome's
  own side-panel menu — the setting governs what the *icon* does.
- `sidePanel.open()` (used when a notification body is clicked) requires a user gesture and a
  target window; it is best-effort and fails quietly on older builds, where the toolbar icon
  still opens the panel.
- Notification sounds need an **offscreen document** (`chrome.offscreen`, Chrome 109+); the
  worker creates one on first sound and reuses it. Chrome's own notification chime stays off
  (`silent: true`) so the chosen pack is the only thing you hear.
- The sound pack is 8-bit mono PCM at 11 kHz (~42 KB of base64) and is code-split into its
  own chunk, so the popup paints without ever loading it.
- `npm test` runs on plain `node --test`; `scripts/ts-resolve.mjs` is a ~15-line hook that
  lets Node resolve the app's bundler-style imports.
