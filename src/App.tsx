import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Header } from './components/Header'
import { HomeView } from './components/HomeView'
import { LevelUpOverlay } from './components/LevelUpOverlay'
import { SettingsView } from './components/SettingsView'
import { TabBar, type View } from './components/TabBar'
import { WardrobeView } from './components/WardrobeView'
import { useCompanion } from './hooks/useCompanion'
import { ITEMS, itemStatus } from './lib/gamification'
import { THEME_MAP } from './lib/themes'

const SUBTITLE: Record<View, string> = {
  home: 'your gentle buddy',
  wardrobe: 'dress momo up',
  settings: 'tune your nudges',
}

export default function App() {
  const c = useCompanion()
  const [view, setView] = useState<View>('home')
  const theme = THEME_MAP[c.settings.theme]

  // A dot on the shop tab whenever something is actually buyable right now.
  const shopHint = useMemo(
    () => ITEMS.some((item) => itemStatus(c.player, item) === 'buyable'),
    [c.player],
  )

  return (
    <div className="kw-shell relative flex h-full w-full flex-col overflow-hidden">
      <AuroraBackdrop />

      <Header streak={c.stats.streakDays} player={c.player} subtitle={SUBTITLE[view]} />

      <AnimatePresence mode="wait" initial={false}>
        {!c.ready ? (
          <motion.div
            key="loading"
            exit={{ opacity: 0 }}
            className="flex flex-1 items-center justify-center"
          >
            <motion.span
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-2xl"
            >
              🌱
            </motion.span>
          </motion.div>
        ) : (
          <motion.div
            key={view}
            initial={{ opacity: 0, x: view === 'settings' ? 18 : -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: view === 'settings' ? 18 : -18 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {view === 'home' && (
              <HomeView
                theme={theme}
                settings={c.settings}
                stats={c.stats}
                player={c.player}
                schedule={c.schedule}
                now={c.now}
                celebration={c.celebration}
                onComplete={c.complete}
                onSnooze={(id) => c.snooze(id, 5)}
              />
            )}
            {view === 'wardrobe' && (
              <WardrobeView
                theme={theme}
                player={c.player}
                onEquip={(slot, itemId) => void c.equip(slot, itemId)}
                onBuy={c.buy}
                onSelectSound={(id) => void c.selectSound(id)}
                onPreviewSound={c.previewSound}
              />
            )}
            {view === 'settings' && (
              <SettingsView
                settings={c.settings}
                stats={c.stats}
                player={c.player}
                onToggleReminder={c.toggleReminder}
                onSetInterval={c.setInterval}
                onSetTheme={c.setTheme}
                onPatch={c.patchSettings}
                onPreview={(id) => void c.preview(id)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <TabBar view={view} onChange={setView} shopHint={shopHint} />

      <LevelUpOverlay
        celebration={c.celebration}
        player={c.player}
        theme={theme}
        onDismiss={c.clearCelebration}
      />
    </div>
  )
}

/** Two slow-drifting blobs behind the glass; the reason blur reads as depth. */
function AuroraBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-16 -top-14 h-52 w-52 rounded-full blur-3xl"
        style={{ background: 'rgb(var(--kw-accent) / 0.38)' }}
        animate={{ x: [0, 26, 0], y: [0, 18, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-20 -right-14 h-56 w-56 rounded-full blur-3xl"
        style={{ background: 'rgb(var(--kw-blush) / 0.34)' }}
        animate={{ x: [0, -22, 0], y: [0, -16, 0], scale: [1.08, 1, 1.08] }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
