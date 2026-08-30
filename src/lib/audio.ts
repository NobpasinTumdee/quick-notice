import { SOUND_MAP } from './gamification'
import type { SoundKey } from './sounds.generated'

/** Built path of the offscreen document (see `offscreen.html` at the project root). */
export const OFFSCREEN_URL = 'offscreen.html'

/** Messages aimed at the offscreen document, kept off the popup's message union. */
export interface AudioMessage {
  target: 'kw-offscreen'
  type: 'PLAY_SOUND'
  key: SoundKey
  volume: number
}

export function isAudioMessage(message: unknown): message is AudioMessage {
  return !!message && typeof message === 'object' && (message as AudioMessage).target === 'kw-offscreen'
}

/** Resolves a stored sound id to an asset key. `null` means "play nothing". */
export function soundKeyFor(soundId: number): SoundKey | null {
  const meta = SOUND_MAP.get(soundId)
  if (!meta || meta.key === 'silent') return null
  return meta.key as SoundKey
}

/**
 * Plays a sound in a DOM context (popup or offscreen document).
 * The 42KB base64 pack is imported dynamically so it never lands in the popup's
 * initial chunk — the UI paints long before anyone asks for a sound.
 */
export async function playSoundKey(key: SoundKey | null, volume = 0.5): Promise<void> {
  if (!key) return
  try {
    const { soundDataUri } = await import('./sounds.generated')
    const audio = new Audio(soundDataUri(key))
    audio.volume = Math.max(0, Math.min(1, volume))
    await audio.play()
  } catch (error) {
    // Autoplay policy, a missing key, or a closing popup: never worth throwing over.
    console.debug('[kawaii] sound skipped', error)
  }
}

export async function playSoundId(soundId: number, volume = 0.5): Promise<void> {
  await playSoundKey(soundKeyFor(soundId), volume)
}

/* ---------------------------------------------- service-worker side of things */

let creating: Promise<void> | null = null

async function hasOffscreenDocument(): Promise<boolean> {
  // getContexts landed in Chrome 116; older builds fall back to the create-and-catch path.
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
    })
    return contexts.length > 0
  }
  return false
}

/** Ensures exactly one offscreen document exists, even under concurrent alarms. */
async function ensureOffscreenDocument(): Promise<boolean> {
  if (!chrome.offscreen) return false
  if (await hasOffscreenDocument()) return true
  if (creating) {
    await creating
    return true
  }
  creating = chrome.offscreen
    .createDocument({
      url: OFFSCREEN_URL,
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Plays the selected notification sound for wellness reminders.',
    })
    .catch((error: unknown) => {
      // Two alarms firing together can race past the check above.
      if (!String(error).includes('single offscreen document')) throw error
    })
  try {
    await creating
    return true
  } finally {
    creating = null
  }
}

/**
 * Plays a notification sound from the service worker.
 * MV3 workers have no Audio/AudioContext, so playback is delegated to an
 * offscreen document, which is created on first use and then reused.
 */
export async function playSoundFromWorker(soundId: number, volume = 0.45): Promise<void> {
  await playKeyFromWorker(soundKeyFor(soundId), volume)
}

/** Same path, but for assets with no selectable id (the level-up jingle, coins). */
export async function playKeyFromWorker(key: SoundKey | null, volume = 0.45): Promise<void> {
  if (!key) return
  try {
    if (!(await ensureOffscreenDocument())) return
    const message: AudioMessage = { target: 'kw-offscreen', type: 'PLAY_SOUND', key, volume }
    await chrome.runtime.sendMessage(message)
  } catch (error) {
    console.debug('[kawaii] offscreen playback failed', error)
  }
}
