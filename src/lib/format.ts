/** "45 min" / "1 h" / "1 h 30" — short enough for a 350px popup. */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m}`
}

/** Countdown to an epoch-ms timestamp, rounded up so it never shows "0 s". */
export function formatCountdown(target: number, now = Date.now()): string {
  const ms = target - now
  if (ms <= 0) return 'now'
  const totalSeconds = Math.ceil(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, '0')}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`
}

/**
 * Coarse wording for prose ("in 12 min"), as opposed to `formatCountdown`'s
 * ticking display. Changes at most once a minute, so text that embeds it does
 * not churn on every clock tick.
 */
export function formatApprox(target: number, now = Date.now()): string {
  const ms = target - now
  if (ms <= 0) return 'right now'
  const minutes = Math.round(ms / 60_000)
  if (minutes < 1) return 'in under a minute'
  if (minutes < 60) return `in ${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) return `in ${hours} h`
  return `in ${hours} h ${rest} min`
}

export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  if (h < 22) return 'Good evening'
  return 'Winding down'
}

export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24
  const suffix = h < 12 ? 'AM' : 'PM'
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display} ${suffix}`
}
