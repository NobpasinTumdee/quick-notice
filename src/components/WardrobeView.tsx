import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import {
  equippedId,
  itemStatus,
  itemsForSlot,
  RARITY_META,
  SLOTS,
  SLOT_META,
  SOUNDS,
  soundUnlocked,
  type Item,
  type ItemStatus,
  type PurchaseError,
} from '../lib/gamification'
import type { Theme } from '../lib/themes'
import type { PlayerState, Slot } from '../lib/types'
import { GlassCard } from './GlassCard'
import { LevelBar } from './LevelBar'
import { Mascot } from './Mascot'

type Tab = Slot | 'sound'

interface WardrobeViewProps {
  theme: Theme
  player: PlayerState
  onEquip: (slot: Slot, itemId: number) => void
  onBuy: (itemId: number) => Promise<PurchaseError | null>
  onSelectSound: (soundId: number) => void
  onPreviewSound: (soundId: number) => void
}

const TABS: { id: Tab; label: string; emoji: string }[] = [
  ...SLOTS.map((slot) => ({ id: slot as Tab, ...SLOT_META[slot] })),
  { id: 'sound', label: 'Sound', emoji: '🔔' },
]

const PURCHASE_COPY: Record<PurchaseError, string> = {
  poor: 'Not enough coins yet!',
  locked: 'Level up to unlock this.',
  owned: 'Already in your wardrobe.',
  unknown: 'That item vanished.',
}

export function WardrobeView({
  theme,
  player,
  onEquip,
  onBuy,
  onSelectSound,
  onPreviewSound,
}: WardrobeViewProps) {
  const [tab, setTab] = useState<Tab>('head')
  const [toast, setToast] = useState<string | null>(null)

  const items = useMemo(() => (tab === 'sound' ? [] : itemsForSlot(tab)), [tab])

  const flash = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 1800)
  }

  const handleBuy = async (item: Item) => {
    const error = await onBuy(item.id)
    flash(error ? PURCHASE_COPY[error] : `${item.name} equipped! ✨`)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 px-4 pb-2">
      <GlassCard tone="raised" className="flex items-center gap-3 px-3 py-2.5">
        <div className="-my-2 shrink-0">
          <Mascot mood="happy" palette={theme.mascot} equipped={player.eq} size={62} />
        </div>
        <div className="min-w-0 flex-1">
          <LevelBar player={player} showBadge={false} showCoins={false} />
        </div>
      </GlassCard>

      <div className="flex gap-1.5">
        {TABS.map((entry) => {
          const active = entry.id === tab
          return (
            <motion.button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              whileTap={{ scale: 0.94 }}
              className={`flex flex-1 items-center justify-center gap-1 rounded-2xl border px-1.5 py-1.5 text-[10.5px] font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 ${
                active ? 'text-white' : 'text-inkSoft'
              }`}
              style={{
                background: active
                  ? 'rgb(var(--kw-accent))'
                  : 'rgb(var(--kw-surface) / var(--kw-glass-soft))',
                borderColor: active ? 'rgb(var(--kw-accent))' : 'rgb(var(--kw-edge) / 0.4)',
              }}
            >
              <span className="text-[11px] leading-none">{entry.emoji}</span>
              {entry.label}
            </motion.button>
          )
        })}
      </div>

      <div className="kw-scroll relative min-h-0 flex-1 overflow-y-auto pb-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            {tab === 'sound' ? (
              <SoundList
                player={player}
                onSelect={onSelectSound}
                onPreview={onPreviewSound}
                onLocked={(level) => flash(`Unlocks at level ${level}`)}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {items.map((item, i) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={i}
                    theme={theme}
                    status={itemStatus(player, item)}
                    onEquip={() => onEquip(item.slot, item.id)}
                    onBuy={() => void handleBuy(item)}
                    onLocked={() => flash(`Unlocks at level ${item.level}`)}
                  />
                ))}
                <UnequipCard
                  active={equippedId(player, tab as Slot) === 0}
                  label={SLOT_META[tab as Slot].label}
                  onClick={() => onEquip(tab as Slot, equippedId(player, tab as Slot))}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            className="pointer-events-none absolute inset-x-6 bottom-14 z-20 rounded-2xl border border-edge/50 px-3 py-2 text-center text-[11px] font-bold text-ink shadow-float backdrop-blur-xl"
            style={{ background: 'rgb(var(--kw-surface) / 0.85)' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ItemCard({
  item,
  index,
  theme,
  status,
  onEquip,
  onBuy,
  onLocked,
}: {
  item: Item
  index: number
  theme: Theme
  status: ItemStatus
  onEquip: () => void
  onBuy: () => void
  onLocked: () => void
}) {
  const rarity = RARITY_META[item.rarity]
  const locked = status === 'locked'
  const owned = status === 'owned' || status === 'equipped'

  // Preview shows the item on Momo, alone in its slot — nothing else equipped.
  const previewEquip = useMemo(
    () =>
      [
        item.slot === 'head' ? item.id : 0,
        item.slot === 'outfit' ? item.id : 0,
        item.slot === 'prop' ? item.id : 0,
      ] as PlayerState['eq'],
    [item.id, item.slot],
  )

  const click = () => {
    if (locked) return onLocked()
    if (owned) return onEquip()
    if (status === 'unaffordable') return onBuy() // surfaces the "not enough coins" toast
    return onBuy()
  }

  return (
    <motion.button
      type="button"
      onClick={click}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.025, type: 'spring', stiffness: 380, damping: 28 }}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className="relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl border px-2 py-2 text-center backdrop-blur-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25"
      style={{
        background: 'rgb(var(--kw-surface) / var(--kw-glass-soft))',
        borderColor: status === 'equipped' ? rarity.color : 'rgb(var(--kw-edge) / 0.4)',
        boxShadow: status === 'equipped' ? `0 0 0 3px ${rarity.ring}` : undefined,
      }}
      title={item.blurb}
    >
      <span
        className="absolute left-0 top-0 h-1 w-full"
        style={{ background: rarity.color, opacity: 0.85 }}
      />

      <div className={`-my-1 ${locked ? 'opacity-30 grayscale' : ''}`}>
        <Mascot
          mood="idle"
          palette={theme.mascot}
          equipped={previewEquip}
          size={58}
          animated={false}
        />
      </div>

      <span className="w-full truncate text-[10.5px] font-bold leading-tight text-ink">
        {item.name}
      </span>

      {locked ? (
        <span className="flex items-center gap-1 rounded-full bg-ink/10 px-2 py-0.5 text-[9.5px] font-bold text-inkSoft">
          🔒 Lv {item.level}
        </span>
      ) : status === 'equipped' ? (
        <span
          className="rounded-full px-2 py-0.5 text-[9.5px] font-black text-white"
          style={{ background: rarity.color }}
        >
          WORN
        </span>
      ) : status === 'owned' ? (
        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[9.5px] font-bold text-inkSoft">
          Equip
        </span>
      ) : (
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-black ${
            status === 'buyable' ? 'text-white' : 'text-inkFaint'
          }`}
          style={{
            background: status === 'buyable' ? 'rgb(var(--kw-accent))' : 'rgb(var(--kw-ink) / 0.1)',
          }}
        >
          <span className="grid h-3 w-3 place-items-center rounded-full bg-amber-300 text-[7px] font-black text-amber-800">
            ¢
          </span>
          {item.price}
        </span>
      )}
    </motion.button>
  )
}

function UnequipCard({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed px-2 py-4 text-center focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25"
      style={{
        borderColor: active ? 'rgb(var(--kw-accent))' : 'rgb(var(--kw-ink) / 0.25)',
        background: 'rgb(var(--kw-surface) / var(--kw-glass-soft))',
      }}
    >
      <span className="text-[18px] leading-none">🚫</span>
      <span className="text-[10.5px] font-bold text-inkSoft">
        {active ? `No ${label.toLowerCase()}` : `Remove ${label.toLowerCase()}`}
      </span>
    </motion.button>
  )
}

function SoundList({
  player,
  onSelect,
  onPreview,
  onLocked,
}: {
  player: PlayerState
  onSelect: (id: number) => void
  onPreview: (id: number) => void
  onLocked: (level: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {SOUNDS.map((sound, i) => {
        const unlocked = soundUnlocked(player.l, sound.id)
        const active = player.s === sound.id
        return (
          <motion.div
            key={sound.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, type: 'spring', stiffness: 380, damping: 30 }}
            className="flex items-center gap-2 rounded-2xl border px-3 py-2 backdrop-blur-xl"
            style={{
              background: 'rgb(var(--kw-surface) / var(--kw-glass-soft))',
              borderColor: active ? 'rgb(var(--kw-accent))' : 'rgb(var(--kw-edge) / 0.4)',
              boxShadow: active ? '0 0 0 3px rgb(var(--kw-accent) / 0.18)' : undefined,
            }}
          >
            <button
              type="button"
              onClick={() => (unlocked ? onPreview(sound.id) : onLocked(sound.level))}
              aria-label={`Preview ${sound.name}`}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] text-white shadow-pill focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25"
              style={{ background: unlocked ? 'rgb(var(--kw-accent))' : 'rgb(var(--kw-ink) / 0.25)' }}
            >
              {unlocked ? '▶' : '🔒'}
            </button>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-bold leading-tight text-ink">
                {sound.name}
              </span>
              <span className="block text-[10px] font-medium text-inkFaint">
                {unlocked ? (active ? 'Now playing on nudges' : 'Tap to use') : `Unlocks at level ${sound.level}`}
              </span>
            </span>

            <motion.button
              type="button"
              disabled={!unlocked || active}
              onClick={() => onSelect(sound.id)}
              whileTap={unlocked && !active ? { scale: 0.93 } : undefined}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 ${
                active ? 'text-white' : 'border border-edge/50 text-inkSoft'
              } ${!unlocked ? 'opacity-40' : ''}`}
              style={
                active
                  ? { background: 'rgb(var(--kw-accent))' }
                  : { background: 'rgb(var(--kw-surface) / var(--kw-glass-soft))' }
              }
            >
              {active ? 'Active' : 'Use'}
            </motion.button>
          </motion.div>
        )
      })}
    </div>
  )
}
