/**
 * Synthesises the notification sound pack and writes it as base64 data URIs
 * into `src/lib/sounds.generated.ts`.
 *
 *   node scripts/generate-sounds.mjs
 *
 * Format is 8-bit unsigned mono PCM at 11.025 kHz — deliberately lo-fi, because
 * these are 200 ms blips shipped inside a JS bundle. 16-bit/44.1k would sound
 * marginally cleaner and cost ~8× the bytes; the decay envelopes hide most of
 * the quantisation. The whole pack lands around 30 KB of base64.
 *
 * Nothing here ever reaches chrome.storage — storage holds the selected id only.
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RATE = 11025
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/lib/sounds.generated.ts')

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
    const buf = render(note.dur, note.fn)
    for (let i = 0; i < buf.length && start + i < total; i++) out[start + i] += buf[i]
  }
  return out
}

const SOUNDS = {
  // Two soft sine partials, a gentle "you have a nudge".
  ping: () =>
    render(0.42, (t, d) => (sine(t, 880) * 0.6 + sine(t, 1320) * 0.25) * env(t, d, 7)),

  // Mouth-pop: a fast downward pitch bend.
  pop: () =>
    render(0.16, (t, d) => sine(t, 1500 - 1100 * (t / d)) * env(t, d, 9, 0.004) * 0.9),

  // Chiptune arpeggio on a square wave.
  blip: () =>
    sequence([
      { at: 0, dur: 0.07, fn: (t, d) => square(t, 660) * env(t, d, 5, 0.002) * 0.35 },
      { at: 0.07, dur: 0.07, fn: (t, d) => square(t, 880) * env(t, d, 5, 0.002) * 0.35 },
      { at: 0.14, dur: 0.14, fn: (t, d) => square(t, 1320) * env(t, d, 6, 0.002) * 0.35 },
    ]),

  // Three struck bars with a long tail.
  chime: () =>
    sequence([
      { at: 0, dur: 0.7, fn: (t, d) => (sine(t, 1046) + sine(t, 2093) * 0.3) * env(t, d, 5) * 0.45 },
      { at: 0.12, dur: 0.6, fn: (t, d) => (sine(t, 1318) + sine(t, 2637) * 0.25) * env(t, d, 5) * 0.4 },
      { at: 0.26, dur: 0.55, fn: (t, d) => (sine(t, 1568) + sine(t, 3136) * 0.2) * env(t, d, 5) * 0.35 },
    ]),

  // Rising wobble, like something surfacing in water.
  bubble: () =>
    render(0.3, (t, d) => {
      const f = 420 + 900 * (t / d) + 60 * sine(t, 18)
      return triangle(t, f) * env(t, d, 7, 0.006) * 0.6
    }),

  // Level-up fanfare: a major arpeggio that lands on the octave.
  levelup: () =>
    sequence([
      { at: 0, dur: 0.1, fn: (t, d) => square(t, 523) * env(t, d, 4, 0.003) * 0.3 },
      { at: 0.1, dur: 0.1, fn: (t, d) => square(t, 659) * env(t, d, 4, 0.003) * 0.3 },
      { at: 0.2, dur: 0.1, fn: (t, d) => square(t, 784) * env(t, d, 4, 0.003) * 0.3 },
      { at: 0.3, dur: 0.42, fn: (t, d) => (square(t, 1046) * 0.7 + sine(t, 1568) * 0.4) * env(t, d, 4, 0.003) * 0.32 },
    ]),

  // Short two-tone tick for a purchase.
  coin: () =>
    sequence([
      { at: 0, dur: 0.06, fn: (t, d) => square(t, 988) * env(t, d, 6, 0.002) * 0.32 },
      { at: 0.06, dur: 0.16, fn: (t, d) => square(t, 1319) * env(t, d, 5, 0.002) * 0.32 },
    ]),
}

/** Float32 (-1..1) -> 8-bit unsigned PCM WAV. */
function toWav(samples) {
  const header = Buffer.alloc(44)
  const data = Buffer.alloc(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    data[i] = Math.round((clamped * 0.5 + 0.5) * 255)
  }
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16) // subchunk size
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(RATE, 24)
  header.writeUInt32LE(RATE, 28) // byte rate = rate * blockAlign
  header.writeUInt16LE(1, 32) // block align
  header.writeUInt16LE(8, 34) // bits per sample
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

const entries = Object.entries(SOUNDS).map(([key, make]) => {
  const wav = toWav(make())
  return [key, wav.toString('base64'), wav.length]
})

const body = entries
  .map(([key, b64]) => `  ${key}: '${b64}',`)
  .join('\n')

writeFileSync(
  OUT,
  `/* eslint-disable */
/**
 * GENERATED FILE — do not edit by hand.
 * Run \`npm run sounds\` (scripts/generate-sounds.mjs) to rebuild.
 *
 * 8-bit mono PCM WAV at ${RATE} Hz, base64-encoded. Lives in the bundle, never
 * in chrome.storage — the save format stores a sound id, nothing more.
 */

export type SoundKey = ${entries.map(([k]) => `'${k}'`).join(' | ')}

/** Raw base64 WAV payloads, keyed by sound. */
export const SOUND_DATA: Record<SoundKey, string> = {
${body}
}

export function soundDataUri(key: SoundKey): string {
  return \`data:audio/wav;base64,\${SOUND_DATA[key]}\`
}
`,
  'utf8',
)

const total = entries.reduce((sum, [, b64]) => sum + b64.length, 0)
console.log(
  entries.map(([k, , bytes]) => `${k}: ${(bytes / 1024).toFixed(1)}KB`).join(', '),
)
console.log(`total base64: ${(total / 1024).toFixed(1)}KB -> ${OUT}`)
