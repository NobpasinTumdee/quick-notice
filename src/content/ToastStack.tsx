import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import type { ToastMessage } from '../lib/types'
import { ToastWidget } from './ToastWidget'

export interface ToastApi {
  show: (message: ToastMessage) => void
}

interface ToastStackProps {
  /** Handed the imperative API once React has committed. */
  onReady: (api: ToastApi) => void
  /** Fired after the last card's exit animation, so the host can unmount. */
  onEmpty: () => void
}

interface Entry {
  /** Stable per-toast key; the habit id is not enough because it can repeat. */
  key: number
  message: ToastMessage
}

/** More than a couple of stacked cards stops being a nudge and starts being a wall. */
const MAX_VISIBLE = 2

let counter = 0

export function ToastStack({ onReady, onEmpty }: ToastStackProps) {
  const [entries, setEntries] = useState<Entry[]>([])

  const show = useCallback((message: ToastMessage) => {
    setEntries((current) => {
      // A repeat nudge for the same habit replaces its card rather than stacking
      // a second identical one — the alarm can fire again while the first is up.
      const others = current.filter((entry) => entry.message.habit !== message.habit)
      return [...others, { key: ++counter, message }].slice(-MAX_VISIBLE)
    })
  }, [])

  useEffect(() => {
    onReady({ show })
  }, [onReady, show])

  const dismiss = useCallback((key: number) => {
    setEntries((current) => current.filter((entry) => entry.key !== key))
  }, [])

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 flex flex-col items-end gap-2"
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      <AnimatePresence
        onExitComplete={() => {
          // Only tear the host down once nothing is left on screen.
          setEntries((current) => {
            if (current.length === 0) onEmpty()
            return current
          })
        }}
      >
        {entries.map((entry) => (
          <ToastWidget key={entry.key} message={entry.message} onClose={() => dismiss(entry.key)} />
        ))}
      </AnimatePresence>
    </div>
  )
}
