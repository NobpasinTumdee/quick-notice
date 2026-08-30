import type { HTMLMotionProps } from 'framer-motion'
import { motion } from 'framer-motion'
import { forwardRef } from 'react'

type GlassCardProps = HTMLMotionProps<'div'> & {
  /** `soft` for nested rows, `raised` for the hero surfaces. */
  tone?: 'soft' | 'raised'
}

/**
 * The frosted panel every surface in the popup is built from.
 * Translucency comes from a theme variable, so dark themes get a lighter
 * touch of white without a second set of classes.
 *
 * Refs are forwarded because AnimatePresence's popLayout mode measures the
 * outgoing node before it animates away.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { tone = 'soft', className = '', style, ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      {...rest}
      style={{
        background: `rgb(var(--kw-surface) / var(${
          tone === 'raised' ? '--kw-glass' : '--kw-glass-soft'
        }))`,
        ...style,
      }}
      className={`rounded-3xl border border-edge/40 backdrop-blur-xl ${
        tone === 'raised' ? 'shadow-glass' : 'shadow-pill'
      } ${className}`}
    />
  )
})
