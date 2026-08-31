/**
 * Synthesises the notification sound pack into `public/sounds/*.wav`, plus a
 * tiny key manifest at `src/lib/sounds.generated.ts`.
 *
 *   node scripts/generate-sounds.mjs
 *
 * Two things worth knowing:
 *
 * 1. **No binary assets in the repo.** Every sound is generated from the maths
 *    below, so `public/sounds/` is build output and git-ignored, exactly like
 *    `public/icons/`. Nothing is licensed, downloaded or checked in.
 *
 * 2. **Files, not base64.** These used to be inlined as data URIs, which put the
 *    whole pack in the JS bundle whether or not the player ever heard it. As
 *    separate files Chrome fetches only the selected sound, and the format could
 *    move up to 16-bit/22.05 kHz — the bell and the guitar riff need the headroom.
 *
 * Nothing here ever reaches chrome.storage: the save holds a sound id, nothing more.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RATE = 22050
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = resolve(ROOT, 'public/sounds')
const MANIFEST = resolve(ROOT, 'src/lib/sounds.generated.ts')

const TAU = Math.PI * 2
const sine = (t, f) => Math.sin(TAU * f * t)
const square = (t, f) => (Math.sin(TAU * f * t) >= 0 ? 1 : -1)
const triangle = (t, f) => 2 * Math.abs(2 * ((t * f) % 1) - 1) - 1

/** Exponential decay with a short attack, so nothing clicks on either edge. */
const env = (t, dur, decay = 6, attack = 0.008) =>
  Math.min(1, t / attack) * Math.exp((-decay * t) / dur) * Math.min(1, (dur - t) / 0.01)

function render(dur, fn) {
  const n = Math.floor(dur * RATE)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = fn(i / RATE, dur)
  return out
}

/** Sequences notes into one buffer, mixing overlaps. */
function sequence(notes) {
  const dur = Math.max(...notes.map((n) => n.at + n.dur))
  const total = Math.floor(dur * RATE)
  const out = new Float32Array(total)
  for (const note of notes) {
    const start = Math.floor(note.at * RATE)
    const buf = note.buf ?? render(note.dur, note.fn)
    for (let i = 0; i < buf.length && start + i < total; i++) out[start + i] += buf[i]
  }
  return out
}

/**
 * Karplus-Strong plucked string: a noise burst circulated through a delay line
 * one period long, averaged each lap. Cheap, and it genuinely sounds like a
 * string being plucked — which a stack of sine waves does not.
 */
function pluck(freq, dur, { damping = 0.996, level = 0.5, seed = 1 } = {}) {
  const n = Math.floor(dur * RATE)
  const period = Math.max(2, Math.round(RATE / freq))
  const buf = new Float32Array(period)
  // Deterministic noise, so a rebuild produces byte-identical files.
  let rnd = seed
  for (let i = 0; i < period; i++) {
    rnd = (rnd * 1103515245 + 12345) & 0x7fffffff
    buf[i] = (rnd / 0x3fffffff - 1) * 0.9
  }
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const j = i % period
    const next = (buf[j] + buf[(j + 1) % period]) * 0.5 * damping
    out[i] = buf[j] * level * Math.min(1, (n - i) / (RATE * 0.03))
    buf[j] = next
  }
  return out
}

/** A tap/hammer-on: same string, but struck softly and higher up the neck. */
const tap = (freq, dur, at, level = 0.34) => ({
  at,
  dur,
  buf: pluck(freq, dur, { level, damping: 0.9945, seed: Math.round(freq * 7) }),
})

const SOUNDS = {
  /* ---- selectable packs ------------------------------------------------ */

  // Default Ping: two soft sine partials, a gentle "you have a nudge".
  ping: () => render(0.42, (t, d) => (sine(t, 880) * 0.6 + sine(t, 1320) * 0.25) * env(t, d, 7)),

  // Cute Pop: a fast downward pitch bend.
  pop: () => render(0.16, (t, d) => sine(t, 1500 - 1100 * (t / d)) * env(t, d, 9, 0.004) * 0.9),

  // Retro 8-bit: the classic arcade jump — a square wave sweeping upward.
  blip: () =>
    sequence([
      { at: 0, dur: 0.07, fn: (t, d) => square(t, 660) * env(t, d, 5, 0.002) * 0.35 },
      { at: 0.07, dur: 0.07, fn: (t, d) => square(t, 880) * env(t, d, 5, 0.002) * 0.35 },
      { at: 0.14, dur: 0.16, fn: (t, d) => square(t, 1320) * env(t, d, 6, 0.002) * 0.35 },
    ]),

  // Wind Chime: three struck bars with a long tail.
  chime: () =>
    sequence([
      { at: 0, dur: 0.7, fn: (t, d) => (sine(t, 1046) + sine(t, 2093) * 0.3) * env(t, d, 5) * 0.45 },
      {
        at: 0.12,
        dur: 0.6,
        fn: (t, d) => (sine(t, 1318) + sine(t, 2637) * 0.25) * env(t, d, 5) * 0.4,
      },
      {
        at: 0.26,
        dur: 0.55,
        fn: (t, d) => (sine(t, 1568) + sine(t, 3136) * 0.2) * env(t, d, 5) * 0.35,
      },
    ]),

  // Bubble: rising wobble, like something surfacing in water.
  bubble: () =>
    render(0.3, (t, d) => {
      const f = 420 + 900 * (t / d) + 60 * sine(t, 18)
      return triangle(t, f) * env(t, d, 7, 0.006) * 0.6
    }),

  /**
   * Zen Bell: a singing bowl. Bowls are *inharmonic* — the partials sit at
   * roughly 1 : 2.7 : 5.4 : 8.9 rather than at whole multiples, which is what
   * stops this reading as an organ note. The two detuned copies of the
   * fundamental give the slow beating you hear as a bowl rings out.
   */
  zen: () =>
    render(2.6, (t, d) => {
      const f = 220
      const body =
        (sine(t, f) + sine(t, f * 1.004)) * 0.5 * Math.exp(-1.1 * t) +
        sine(t, f * 2.71) * 0.34 * Math.exp(-1.9 * t) +
        sine(t, f * 5.42) * 0.16 * Math.exp(-3.2 * t) +
        sine(t, f * 8.93) * 0.07 * Math.exp(-5.5 * t)
      const strike = sine(t, 3200) * 0.12 * Math.exp(-90 * t)
      return (body + strike) * Math.min(1, t / 0.004) * Math.min(1, (d - t) / 0.15) * 0.62
    }),

  /**
   * Mecha Lock-on: three rising interrogation blips, then the confirmation tone.
   * The tiny FM wobble on the last note is what makes it read as machinery
   * rather than as a doorbell.
   */
  lockon: () =>
    sequence([
      { at: 0, dur: 0.05, fn: (t, d) => square(t, 1200) * env(t, d, 8, 0.001) * 0.22 },
      { at: 0.09, dur: 0.05, fn: (t, d) => square(t, 1500) * env(t, d, 8, 0.001) * 0.22 },
      { at: 0.18, dur: 0.05, fn: (t, d) => square(t, 1800) * env(t, d, 8, 0.001) * 0.22 },
      {
        at: 0.29,
        dur: 0.42,
        fn: (t, d) => {
          const wobble = 1 + 0.012 * sine(t, 70)
          const partials = sine(t, 2400 * wobble) * 0.5 + sine(t, 3600 * wobble) * 0.18
          return partials * env(t, d, 4, 0.004) * 0.5
        },
      },
    ]),

  /**
   * Math Rock Riff: two seconds of tapped harmonics in a 7/8-ish grouping,
   * plucked strings over an open drone. Deliberately odd-metered — that is the
   * genre joke, and it also keeps it from sounding like a ringtone.
   */
  mathrock: () =>
    sequence([
      // open drone underneath
      { at: 0, dur: 1.9, buf: pluck(146.83, 1.9, { level: 0.16, damping: 0.9975, seed: 5 }) },
      tap(587.33, 0.5, 0.0), // D5
      tap(880.0, 0.45, 0.16), // A5
      tap(1174.66, 0.5, 0.3), // D6
      tap(987.77, 0.45, 0.46), // B5
      tap(659.25, 0.55, 0.62), // E5
      tap(1318.51, 0.5, 0.84), // E6
      tap(1108.73, 0.45, 0.98), // C#6
      tap(880.0, 0.6, 1.12), // A5
      tap(1174.66, 0.7, 1.34, 0.3),
      tap(1479.98, 0.75, 1.46, 0.26), // F#6 — the resolve
    ]),

  /**
   * Cat Meow: a pitch arc (up, then down) through a couple of vocal-tract
   * resonances. A meow is mostly *contour* — get the arc right and a very crude
   * source sounds convincingly feline.
   */
  meow: () =>
    render(0.52, (t, d) => {
      const x = t / d
      // rise into the vowel, then fall away
      const f0 = 620 + 300 * Math.sin(Math.PI * Math.min(1, x * 1.15)) - 180 * x
      const vibrato = 1 + 0.02 * sine(t, 16)
      const f = f0 * vibrato
      const source = triangle(t, f) * 0.5 + sine(t, f) * 0.5
      // two formants sweeping "eee" -> "ow"
      const formant = sine(t, f * (2 + 0.6 * x)) * 0.28 + sine(t, f * (3.4 - 1.2 * x)) * 0.14
      const shape = Math.min(1, t / 0.05) * Math.min(1, (d - t) / 0.12) * Math.exp(-1.4 * x)
      return (source + formant) * shape * 0.5
    }),

  /* ---- system sounds (not selectable) ---------------------------------- */

  // Level-up fanfare: a major arpeggio that lands on the octave.
  levelup: () =>
    sequence([
      { at: 0, dur: 0.1, fn: (t, d) => square(t, 523) * env(t, d, 4, 0.003) * 0.3 },
      { at: 0.1, dur: 0.1, fn: (t, d) => square(t, 659) * env(t, d, 4, 0.003) * 0.3 },
      { at: 0.2, dur: 0.1, fn: (t, d) => square(t, 784) * env(t, d, 4, 0.003) * 0.3 },
      {
        at: 0.3,
        dur: 0.42,
        fn: (t, d) => (square(t, 1046) * 0.7 + sine(t, 1568) * 0.4) * env(t, d, 4, 0.003) * 0.32,
      },
    ]),

  // Short two-tone tick for a purchase.
  coin: () =>
    sequence([
      { at: 0, dur: 0.06, fn: (t, d) => square(t, 988) * env(t, d, 6, 0.002) * 0.32 },
      { at: 0.06, dur: 0.16, fn: (t, d) => square(t, 1319) * env(t, d, 5, 0.002) * 0.32 },
    ]),
}

/** Float32 (-1..1) -> 16-bit signed PCM WAV. */
function toWav(samples) {
  const header = Buffer.alloc(44)
  const data = Buffer.alloc(samples.length * 2)
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    data.writeInt16LE(Math.round(clamped * 32767), i * 2)
  }
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16) // subchunk size
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(RATE, 24)
  header.writeUInt32LE(RATE * 2, 28) // byte rate = rate * blockAlign
  header.writeUInt16LE(2, 32) // block align
  header.writeUInt16LE(16, 34) // bits per sample
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

mkdirSync(OUT_DIR, { recursive: true })
// Clear stale files so a renamed or retired sound cannot linger in a build.
for (const file of readdirSync(OUT_DIR)) {
  if (file.endsWith('.wav')) rmSync(resolve(OUT_DIR, file))
}

const written = Object.entries(SOUNDS).map(([key, make]) => {
  const wav = toWav(make())
  writeFileSync(resolve(OUT_DIR, `${key}.wav`), wav)
  return [key, wav.length]
})

const keys = written.map(([k]) => k)
writeFileSync(
  MANIFEST,
  `/* eslint-disable */
/**
 * GENERATED FILE — do not edit by hand.
 * Run \`npm run sounds\` (scripts/generate-sounds.mjs) to rebuild.
 *
 * Only the *names* live here. The audio itself is ${keys.length} WAV files in
 * \`public/sounds/\`, fetched one at a time by \`lib/audio.ts\`, so the bundle
 * carries none of it — and chrome.storage carries only a sound id.
 */

export type SoundKey = ${keys.map((k) => `'${k}'`).join(' | ')}

/** Every key with a file on disk, in generation order. */
export const SOUND_KEYS: readonly SoundKey[] = [${keys.map((k) => `'${k}'`).join(', ')}] as const

/** Path of a sound, relative to the extension root. */
export function soundPath(key: SoundKey): string {
  return \`sounds/\${key}.wav\`
}
`,
  'utf8',
)

const total = written.reduce((sum, [, bytes]) => sum + bytes, 0)
console.log(written.map(([k, bytes]) => `${k}: ${(bytes / 1024).toFixed(0)}KB`).join(', '))
console.log(`${written.length} files, ${(total / 1024).toFixed(0)}KB total -> ${OUT_DIR}`)
