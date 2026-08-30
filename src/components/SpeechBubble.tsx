import { AnimatePresence, motion } from 'framer-motion'

interface SpeechBubbleProps {
  text: string
  /**
   * Identity of the *message*, not its wording. The pop animation replays only
   * when this changes, so a live countdown inside `text` updates in place
   * instead of re-animating the bubble every second.
   */
  animationKey?: string
}

/** A little tail-pointed bubble above Momo. Swaps messages with a bouncy pop. */
export function SpeechBubble({ text, animationKey }: SpeechBubbleProps) {
  return (
    <div className="relative flex h-[42px] items-end justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={animationKey ?? text}
          initial={{ opacity: 0, y: 8, scale: 0.86 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 460, damping: 26 }}
          className="relative max-w-[250px] rounded-2xl border border-edge/50 px-3 py-1.5 text-center text-[12px] font-semibold leading-snug text-ink shadow-pill backdrop-blur-xl"
          style={{ background: 'rgb(var(--kw-surface) / var(--kw-glass))' }}
        >
          {text}
          <span
            className="absolute -bottom-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[3px] border-b border-r border-edge/50"
            style={{ background: 'rgb(var(--kw-surface) / var(--kw-glass))' }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
