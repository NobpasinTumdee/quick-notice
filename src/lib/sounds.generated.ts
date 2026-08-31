/* eslint-disable */
/**
 * GENERATED FILE — do not edit by hand.
 * Run `npm run sounds` (scripts/generate-sounds.mjs) to rebuild.
 *
 * Only the *names* live here. The audio itself is 11 WAV files in
 * `public/sounds/`, fetched one at a time by `lib/audio.ts`, so the bundle
 * carries none of it — and chrome.storage carries only a sound id.
 */

export type SoundKey = 'ping' | 'pop' | 'blip' | 'chime' | 'bubble' | 'zen' | 'lockon' | 'mathrock' | 'meow' | 'levelup' | 'coin'

/** Every key with a file on disk, in generation order. */
export const SOUND_KEYS: readonly SoundKey[] = ['ping', 'pop', 'blip', 'chime', 'bubble', 'zen', 'lockon', 'mathrock', 'meow', 'levelup', 'coin'] as const

/** Path of a sound, relative to the extension root. */
export function soundPath(key: SoundKey): string {
  return `sounds/${key}.wav`
}
