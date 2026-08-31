import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Mascot } from '../components/Mascot'
import { REMINDER_MAP } from '../lib/reminders'
import { THEME_MAP } from '../lib/themes'
import type { MascotMood, ToastMessage } from '../lib/types'

export type ToastOutcome = 'done' | 'snoozed' | 'dismissed'

interface ToastWidgetProps {
  message: ToastMessage
  onClose: (outcome: ToastOutcome) => void
}

/** Past this much horizontal travel (or this much flick), the card is gone. */
const DISMISS_DISTANCE = 110
const DISMISS_VELOCITY = 420

type Phase = 'live' | 'claimed' | 'refused'

export function ToastWidget({ message, onClose }: ToastWidgetProps) {
  const meta = REMINDER_MAP[message.habit]
  const theme = THEME_MAP[message.theme] ?? THEME_MAP.matcha

  const [phase, setPhase] = useState<Phase>('live')
  const [paused, setPaused] = useState(false)
  const [remaining, setRemaining] = useState(message.durationMs)

  const x = useMotionValue(0)
  // The card fades as it is flung, so the gesture reads as "throwing it away"
  // rather than "dragging a thing that then vanishes".
  const opacity = useTransform(x, [-260, -40, 0, 40, 260], [0, 1, 1, 1, 0])
  const rotate = useTransform(x, [-260, 0, 260], [-8, 0, 8])

  /**
   * Countdown. `durationMs` of 0 means "wait to be dismissed", so the timer
   * never starts and no progress bar is drawn. Hovering pauses it — a nudge you
   * are reading should not evaporate mid-sentence.
   */
  const deadline = useRef(Date.now() + message.durationMs)
  useEffect(() => {
    if (message.durationMs <= 0 || phase !== 'live') return
    if (paused) return

    deadline.current = Date.now() + remaining
    const tick = window.setInterval(() => {
      const left = deadline.current - Date.now()
      setRemaining(Math.max(0, left))
      if (left <= 0) {
        window.clearInterval(tick)
        onClose('dismissed')
      }
    }, 100)
    return () => window.clearInterval(tick)
    // `remaining` is deliberately not a dependency: it is the value this effect
    // writes, and re-running on every tick would restart the deadline forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, phase, message.durationMs, onClose])

  const act = async (kind: 'done' | 'snooze') => {
    try {
      const response = (await chrome.runtime.sendMessage(
        kind === 'done'
          ? { type: 'COMPLETE_REMINDER', id: message.habit }
          : { type: 'SNOOZE_REMINDER', id: message.habit, minutes: 5 },
      )) as { ok?: boolean } | undefined

      if (kind === 'snooze') {
        onClose('snoozed')
        return
      }
      // The worker owns the cooldown, so a claim can legitimately be refused —
      // a stale toast on a habit already ticked off in the panel, for instance.
      if (response?.ok) {
        setPhase('claimed')
        window.setTimeout(() => onClose('done'), 1100)
      } else {
        setPhase('refused')
        window.setTimeout(() => onClose('dismissed'), 1400)
      }
    } catch {
      // Worker asleep or extension reloaded under us: close quietly.
      onClose('dismissed')
    }
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const flung =
      Math.abs(info.offset.x) > DISMISS_DISTANCE || Math.abs(info.velocity.x) > DISMISS_VELOCITY
    if (flung) onClose('dismissed')
  }

  const mood: MascotMood = phase === 'claimed' ? 'happy' : phase === 'refused' ? 'dizzy' : meta.mood
  const progress = message.durationMs > 0 ? remaining / message.durationMs : 0

  return (
    <motion.div
      layout
      drag="x"
      dragSnapToOrigin={false}
      dragElastic={0.9}
      dragMomentum={false}
      onDragEnd={onDragEnd}
      style={{ x, opacity, rotate }}
      initial={{ opacity: 0, x: 40, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.22 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onHoverStart={() => setPaused(true)}
      onHoverEnd={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      role="alert"
      aria-live="polite"
      className="kw-toast pointer-events-auto relative w-[320px] overflow-hidden rounded-3xl border border-edge/40"
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="-my-1 shrink-0">
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Mascot
              mood={mood}
              palette={theme.mascot}
              equipped={message.equipped}
              size={56}
              animated={false}
            />
          </motion.div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-[13px] font-bold leading-tight text-ink">
            <span aria-hidden>{meta.emoji}</span>
            {phase === 'claimed'
              ? 'Nice one!'
              : phase === 'refused'
                ? 'Already done'
                : message.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-inkSoft">
            {phase === 'claimed'
              ? `+${message.expReward} EXP earned.`
              : phase === 'refused'
                ? 'This one is still on cooldown.'
                : message.body}
          </p>
        </div>

        {phase === 'live' && (
          <div className="flex shrink-0 flex-col gap-1">
            <button
              type="button"
              onClick={() => void act('done')}
              className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-pill transition-transform hover:-translate-y-px active:scale-95"
              style={{ background: 'rgb(var(--kw-accent))' }}
            >
              Done ✓
            </button>
            <button
              type="button"
              onClick={() => void act('snooze')}
              className="rounded-full border border-edge/50 px-2.5 py-1 text-[10.5px] font-bold text-inkSoft transition-transform hover:-translate-y-px active:scale-95"
              style={{ background: 'rgb(var(--kw-surface) / var(--kw-glass-soft))' }}
            >
              Snooze
            </button>
          </div>
        )}
      </div>

      {/* Countdown rail. Only drawn when there is actually a countdown. */}
      {message.durationMs > 0 && phase === 'live' && (
        <div className="h-[3px] w-full bg-ink/10">
          <div
            className="h-full origin-left rounded-full transition-[width] duration-100 ease-linear"
            style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${meta.tint.from}, ${meta.tint.to})`,
            }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => onClose('dismissed')}
        aria-label="Dismiss reminder"
        className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-inkFaint opacity-0 transition-opacity hover:bg-ink/10 focus:opacity-100 group-hover:opacity-100"
        style={{ opacity: paused ? 1 : undefined }}
      >
        ✕
      </button>
    </motion.div>
  )
}
