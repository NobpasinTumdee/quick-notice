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

      {/* The panel is user-resizable; past ~520px the column stops stretching
          and centres, so cards keep a comfortable measure. */}
      <div className="relative mx-auto flex h-full w-full max-w-[520px] flex-col">
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
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
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
      </div>

      <LevelUpOverlay
        celebration={c.celebration}
        player={c.player}
        theme={theme}
        onDismiss={c.clearCelebration}
      />
    </div>
  )
}

/**
 * Drifting glow behind the glass — the reason the blur reads as depth.
 * Sized in viewport units so a tall side panel gets proportional light instead
 * of two lonely blobs at the far corners.
 */
function AuroraBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-[18vh] -top-[12vh] h-[42vh] w-[42vh] min-h-[180px] min-w-[180px] rounded-full blur-3xl"
        style={{ background: 'rgb(var(--kw-accent) / 0.38)' }}
        animate={{ x: [0, 26, 0], y: [0, 18, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-[16vh] top-1/3 h-[38vh] w-[38vh] min-h-[160px] min-w-[160px] rounded-full blur-3xl"
        style={{ background: 'rgb(var(--kw-blush) / 0.26)' }}
        animate={{ x: [0, -18, 0], y: [0, 24, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-[16vh] -left-[12vh] h-[40vh] w-[40vh] min-h-[170px] min-w-[170px] rounded-full blur-3xl"
        style={{ background: 'rgb(var(--kw-accent) / 0.24)' }}
        animate={{ x: [0, 22, 0], y: [0, -16, 0], scale: [1.08, 1, 1.08] }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
