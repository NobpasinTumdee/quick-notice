import { motion } from 'framer-motion'

export type View = 'home' | 'wardrobe' | 'settings'

const TABS: { id: View; label: string; icon: string }[] = [
  { id: 'home', label: 'Momo', icon: '🌱' },
  { id: 'wardrobe', label: 'Shop', icon: '🎁' },
  { id: 'settings', label: 'Setup', icon: '⚙️' },
]

interface TabBarProps {
  view: View
  onChange: (view: View) => void
  /** Shows a dot on the shop when something new is affordable or unlocked. */
  shopHint?: boolean
}

export function TabBar({ view, onChange, shopHint = false }: TabBarProps) {
  return (
    <nav
      className="relative mx-3 mb-3 flex gap-1 rounded-3xl border border-edge/40 p-1 shadow-glass backdrop-blur-xl"
      style={{ background: 'rgb(var(--kw-surface) / var(--kw-glass))' }}
    >
      {TABS.map((tab) => {
        const active = tab.id === view
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={active ? 'page' : undefined}
            className="relative flex flex-1 items-center justify-center gap-1.5 rounded-[1.25rem] px-2 py-1.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25"
          >
            {active && (
              <motion.span
                layoutId="tab-pill"
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                className="absolute inset-0 rounded-[1.25rem]"
                style={{ background: 'rgb(var(--kw-accent))' }}
              />
            )}
            <motion.span
              animate={{ scale: active ? 1.12 : 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 20 }}
              className="relative text-[13px] leading-none"
            >
              {tab.icon}
              {tab.id === 'wardrobe' && shopHint && !active && (
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full ring-2"
                  style={{
                    background: 'rgb(var(--kw-blush))',
                    // ring in the bar colour so the dot reads as a badge on the icon
                    ['--tw-ring-color' as string]: 'rgb(var(--kw-surface) / var(--kw-glass))',
                  }}
                />
              )}
            </motion.span>
            <span
              className={`relative text-[11px] font-bold ${active ? 'text-white' : 'text-inkSoft'}`}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
