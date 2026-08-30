import { useCallback, useEffect, useRef, useState } from 'react'
import { playSoundId, playSoundKey } from '../lib/audio'
import { send } from '../lib/bridge'
import {
  completionReward,
  defaultPlayer,
  mergePlayer,
  PLAYER_KEY,
  type PurchaseError,
} from '../lib/gamification'
import { defaultSettings, defaultStats } from '../lib/storage'
import { applyTheme } from '../lib/themes'
import type {
  CompanionState,
  PlayerState,
  ReminderId,
  Schedule,
  Settings,
  Slot,
  Stats,
  ThemeId,
} from '../lib/types'

/** What the UI should celebrate after an action, consumed once and cleared. */
export interface Celebration {
  /** Stable per-event id, so animations key on the event and not on a re-render. */
  id: number
  exp: number
  coins: number
  levelsGained: number
  level: number
}

interface UseCompanion {
  ready: boolean
  settings: Settings
  stats: Stats
  player: PlayerState
  schedule: Schedule
  /** Ticks once a second so countdowns stay live while the popup is open. */
  now: number
  celebration: Celebration | null
  clearCelebration: () => void
  setTheme: (theme: ThemeId) => void
  toggleReminder: (id: ReminderId, enabled: boolean) => void
  setInterval: (id: ReminderId, minutes: number) => void
  patchSettings: (patch: Partial<Settings>) => void
  complete: (id: ReminderId) => Promise<void>
  snooze: (id: ReminderId, minutes?: number) => Promise<void>
  preview: (id: ReminderId) => Promise<void>
  equip: (slot: Slot, itemId: number) => Promise<void>
  buy: (itemId: number) => Promise<PurchaseError | null>
  selectSound: (soundId: number) => Promise<void>
  previewSound: (soundId: number) => void
}

export function useCompanion(): UseCompanion {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [stats, setStats] = useState<Stats>(defaultStats)
  const [player, setPlayer] = useState<PlayerState>(defaultPlayer)
  const [schedule, setSchedule] = useState<Schedule>({})
  const [ready, setReady] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [celebration, setCelebration] = useState<Celebration | null>(null)
  const saveTimer = useRef<number | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      const state = await send<CompanionState>({ type: 'GET_STATE' })
      if (!alive || !state) {
        setReady(true)
        return
      }
      setSettings(state.settings)
      setStats(state.stats)
      setPlayer(state.player)
      setSchedule(state.schedule)
      applyTheme(state.settings.theme)
      setReady(true)
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // The save can change while the popup is open — a "Done ✓" tapped on a
  // notification pays out in the worker. Mirror it rather than going stale.
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== 'sync' || !changes[PLAYER_KEY]) return
      setPlayer(mergePlayer(changes[PLAYER_KEY].newValue))
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  /** Optimistic: paint immediately, persist on a short debounce. */
  const commit = useCallback((next: Settings) => {
    setSettings(next)
    applyTheme(next.theme)
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      void send<{ schedule: Schedule }>({ type: 'UPDATE_SETTINGS', settings: next }).then((res) => {
        if (res?.schedule) setSchedule(res.schedule)
      })
    }, 220)
  }, [])

  // A popup can close mid-debounce; flush so nothing is lost.
  useEffect(() => {
    const flush = () => {
      if (!saveTimer.current) return
      window.clearTimeout(saveTimer.current)
      saveTimer.current = null
      void send({ type: 'UPDATE_SETTINGS', settings })
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [settings])

  const patchSettings = useCallback(
    (patch: Partial<Settings>) => commit({ ...settings, ...patch }),
    [commit, settings],
  )

  const setTheme = useCallback(
    (theme: ThemeId) => commit({ ...settings, theme }),
    [commit, settings],
  )

  const toggleReminder = useCallback(
    (id: ReminderId, enabled: boolean) =>
      commit({
        ...settings,
        reminders: { ...settings.reminders, [id]: { ...settings.reminders[id], enabled } },
      }),
    [commit, settings],
  )

  const setIntervalMinutes = useCallback(
    (id: ReminderId, intervalMinutes: number) =>
      commit({
        ...settings,
        reminders: { ...settings.reminders, [id]: { ...settings.reminders[id], intervalMinutes } },
      }),
    [commit, settings],
  )

  const complete = useCallback(
    async (id: ReminderId) => {
      const before = player
      const expected = completionReward(stats.streakDays)
      const res = await send<{ stats: Stats; player: PlayerState; schedule: Schedule }>({
        type: 'COMPLETE_REMINDER',
        id,
      })
      if (res?.stats) setStats(res.stats)
      if (res?.schedule) setSchedule(res.schedule)

      const after = res?.player
      if (after) {
        setPlayer(after)
        const levelsGained = after.l - before.l
        setCelebration({
          id: Date.now(),
          exp: expected.exp,
          coins: after.c - before.c,
          levelsGained,
          level: after.l,
        })
        void playSoundKey(levelsGained > 0 ? 'levelup' : 'pop', levelsGained > 0 ? 0.5 : 0.35)
      }
    },
    [player, stats.streakDays],
  )

  const snooze = useCallback(async (id: ReminderId, minutes = 5) => {
    const res = await send<{ schedule: Schedule }>({ type: 'SNOOZE_REMINDER', id, minutes })
    if (res?.schedule) setSchedule(res.schedule)
  }, [])

  const preview = useCallback(async (id: ReminderId) => {
    await send({ type: 'PREVIEW_NOTIFICATION', id })
  }, [])

  const equip = useCallback(async (slot: Slot, itemId: number) => {
    const res = await send<{ player: PlayerState }>({ type: 'EQUIP_ITEM', slot, itemId })
    if (res?.player) setPlayer(res.player)
    void playSoundKey('pop', 0.3)
  }, [])

  const buy = useCallback(async (itemId: number): Promise<PurchaseError | null> => {
    const res = await send<{ ok: boolean; player?: PlayerState; reason?: PurchaseError }>({
      type: 'BUY_ITEM',
      itemId,
    })
    if (res?.ok && res.player) {
      setPlayer(res.player)
      void playSoundKey('coin', 0.4)
      return null
    }
    return res?.reason ?? 'unknown'
  }, [])

  const selectSound = useCallback(async (soundId: number) => {
    const res = await send<{ player: PlayerState }>({ type: 'SET_SOUND', soundId })
    if (res?.player) setPlayer(res.player)
    void playSoundId(soundId, 0.45)
  }, [])

  const previewSound = useCallback((soundId: number) => {
    void playSoundId(soundId, 0.45)
  }, [])

  return {
    ready,
    settings,
    stats,
    player,
    schedule,
    now,
    celebration,
    clearCelebration: useCallback(() => setCelebration(null), []),
    setTheme,
    toggleReminder,
    setInterval: setIntervalMinutes,
    patchSettings,
    complete,
    snooze,
    preview,
    equip,
    buy,
    selectSound,
    previewSound,
  }
}
