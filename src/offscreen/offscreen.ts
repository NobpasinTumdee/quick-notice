/**
 * Offscreen document: the extension's only place that can actually play audio.
 * MV3 service workers have no `Audio` or `AudioContext`, so the worker posts
 * `PLAY_SOUND` here and this page does the work.
 */
import { isAudioMessage, playSoundKey } from '../lib/audio'

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isAudioMessage(message)) return false
  void playSoundKey(message.key, message.volume)
  return false // nothing to respond with; keeps the channel from hanging open
})
