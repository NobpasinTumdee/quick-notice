import { motion } from 'framer-motion'

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  size?: 'sm' | 'md'
}

/** A springy pill switch. Tactile on press, obvious at a glance. */
export function Toggle({ checked, onChange, label, size = 'md' }: ToggleProps) {
  const w = size === 'sm' ? 38 : 46
  const h = size === 'sm' ? 22 : 26
  const knob = h - 6

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.92 }}
      className="relative shrink-0 rounded-full p-[3px] transition-colors duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25"
      style={{
        width: w,
        height: h,
        backgroundColor: checked ? 'rgb(var(--kw-accent))' : 'rgb(var(--kw-ink-faint) / 0.35)',
        boxShadow: checked
          ? '0 4px 12px -4px rgb(var(--kw-accent) / 0.75), inset 0 1px 2px rgb(255 255 255 / 0.35)'
          : 'inset 0 1px 3px rgb(var(--kw-shadow) / 0.25)',
      }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 620, damping: 32 }}
        className="block rounded-full bg-white shadow-sm"
        style={{ width: knob, height: knob, marginLeft: checked ? w - knob - 6 : 0 }}
      />
    </motion.button>
  )
}
