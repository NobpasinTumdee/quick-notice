import { motion, useAnimationControls } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { ITEM_MAP } from '../lib/gamification'
import type { MascotPalette } from '../lib/themes'
import type { MascotMood, PlayerState } from '../lib/types'
import { PARTS, type PartDef } from './mascot/parts'

interface MascotProps {
  mood: MascotMood
  palette: MascotPalette
  /** Equipped item ids: [head, outfit, prop]. 0 leaves the slot empty. */
  equipped?: PlayerState['eq']
  size?: number
  /** Off for shop thumbnails, where 20 breathing mascots would be a lot. */
  animated?: boolean
  onPoke?: () => void
}

/**
 * Momo — a mochi sprout, drawn as stacked layers so wearables compose cleanly:
 *
 *   shadow → outfit.back → headwear.back → sprout → arms → BODY → face
 *          → outfit.front → headwear.front → prop → mood FX
 *
 * Every layer shares the same 120×120 viewBox, so a part is authored once and
 * scales with the whole character. Storage only ever holds the three item ids.
 */
export function Mascot({
  mood,
  palette,
  equipped = [0, 0, 0],
  size = 132,
  animated = true,
  onPoke,
}: MascotProps) {
  const controls = useAnimationControls()
  const [blinking, setBlinking] = useState(false)
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), [])

  const [head, outfit, prop] = useMemo(
    () =>
      equipped.map((id) => (id ? (PARTS[ITEM_MAP.get(id)?.part ?? ''] ?? null) : null)) as [
        PartDef | null,
        PartDef | null,
        PartDef | null,
      ],
    [equipped],
  )

  // Random blinks feel alive; a fixed interval reads as a machine.
  useEffect(() => {
    if (!animated) return
    let timer: number
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          setBlinking(true)
          window.setTimeout(() => setBlinking(false), 130)
          schedule()
        },
        2200 + Math.random() * 3200,
      )
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [animated])

  const poke = () => {
    void controls.start({
      scale: [1, 0.88, 1.12, 0.97, 1],
      rotate: [0, -6, 5, -2, 0],
      transition: { duration: 0.62, ease: [0.34, 1.56, 0.64, 1] },
    })
    onPoke?.()
  }

  const eyesClosed = blinking || mood === 'stretching'
  const armsUp = mood === 'stretching' || mood === 'excited'
  const partProps = { palette, uid }
  const showSprout = !head?.hidesSprout

  const art = (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="Momo the sprout">
      <defs>
        <radialGradient id={`body-${uid}`} cx="38%" cy="28%" r="82%">
          <stop offset="0%" stopColor={palette.bodyFrom} />
          <stop offset="100%" stopColor={palette.bodyTo} />
        </radialGradient>
        <linearGradient id={`leaf-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.leaf} stopOpacity="0.75" />
          <stop offset="100%" stopColor={palette.leaf} />
        </linearGradient>
        <filter id={`soft-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="3.4"
            floodColor={palette.eye}
            floodOpacity="0.18"
          />
        </filter>
      </defs>

      {/* ground shadow */}
      <motion.ellipse
        cx="60"
        cy="108"
        rx="26"
        ry="5"
        fill={palette.eye}
        opacity="0.14"
        style={{ originX: '60px', originY: '108px' }}
        animate={animated ? { scaleX: [1, 0.84, 1], opacity: [0.14, 0.09, 0.14] } : undefined}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* layers behind the body: capes, hoods, cat ears */}
      {outfit?.back && <outfit.back {...partProps} />}
      {head?.back && <head.back {...partProps} />}

      {showSprout && (
        <motion.g
          style={{ originX: '60px', originY: '34px' }}
          animate={animated ? { rotate: [-4, 4, -4] } : undefined}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M60 34c0-6 0-11 0-15"
            stroke={palette.leaf}
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M60 22c-9-1-14-6-14-11 6-2 13 2 14 11z" fill={`url(#leaf-${uid})`} />
          <path d="M60 26c8-2 12-7 12-12-6-1-11 3-12 12z" fill={`url(#leaf-${uid})`} opacity="0.85" />
        </motion.g>
      )}

      {/* arms */}
      <motion.g
        animate={
          animated
            ? armsUp
              ? { rotate: [0, -12, 0], y: [0, -3, 0] }
              : { rotate: [0, 4, 0], y: [0, 1, 0] }
            : undefined
        }
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '60px', originY: '70px' }}
      >
        <g transform={armsUp ? 'rotate(-30 20 58)' : 'rotate(-10 20 74)'}>
          <ellipse cx="20" cy={armsUp ? 58 : 74} rx="8.5" ry="10" fill={palette.bodyTo} />
          {/* a touch of the eye colour keeps limbs from reading as stray bubbles */}
          <ellipse cx="20" cy={armsUp ? 58 : 74} rx="8.5" ry="10" fill={palette.eye} opacity="0.09" />
        </g>
        <g transform={armsUp ? 'rotate(30 100 58)' : 'rotate(10 100 74)'}>
          <ellipse cx="100" cy={armsUp ? 58 : 74} rx="8.5" ry="10" fill={palette.bodyTo} />
          <ellipse cx="100" cy={armsUp ? 58 : 74} rx="8.5" ry="10" fill={palette.eye} opacity="0.09" />
        </g>
      </motion.g>

      {/* body */}
      <path
        d="M60 32c22 0 34 15 34 34 0 21-14 33-34 33S26 87 26 66c0-19 12-34 34-34z"
        fill={`url(#body-${uid})`}
        filter={`url(#soft-${uid})`}
      />
      <ellipse cx="45" cy="52" rx="10" ry="7" fill={palette.shine} opacity="0.5" />

      {/* face */}
      <g>
        <Eyes closed={eyesClosed} mood={mood} color={palette.eye} />
        <ellipse cx="38" cy="76" rx="7" ry="4.6" fill={palette.cheek} opacity="0.7" />
        <ellipse cx="82" cy="76" rx="7" ry="4.6" fill={palette.cheek} opacity="0.7" />
        <Mouth mood={mood} color={palette.eye} />
      </g>

      {/* layers over the body */}
      {outfit?.front && <outfit.front {...partProps} />}
      {head?.front && <head.front {...partProps} />}
      {prop?.front && (
        <motion.g
          animate={animated ? { y: [0, -2.5, 0], rotate: [-2, 2, -2] } : undefined}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '104px', originY: '76px' }}
        >
          <prop.front {...partProps} />
        </motion.g>
      )}

      {/* mood effects — the held droplet steps aside when a real prop is equipped */}
      {mood === 'thirsty' && !prop && (
        <motion.g
          animate={animated ? { y: [0, -3, 0], rotate: [-6, 6, -6] } : undefined}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '98px', originY: '46px' }}
        >
          <path d="M98 34c5 7 8 11 8 15a8 8 0 11-16 0c0-4 3-8 8-15z" fill="#7dd3fc" opacity="0.95" />
          <ellipse cx="95" cy="46" rx="1.8" ry="2.6" fill="#ffffff" opacity="0.8" />
        </motion.g>
      )}

      {(mood === 'happy' || mood === 'excited') && (
        <motion.g
          animate={animated ? { opacity: [0, 1, 0], scale: [0.6, 1, 0.6] } : undefined}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '60px', originY: '60px' }}
        >
          <Sparkle x={22} y={38} c={palette.leaf} />
          <Sparkle x={98} y={44} c={palette.cheek} />
          <Sparkle x={88} y={26} c={palette.leaf} />
        </motion.g>
      )}

      {mood === 'sleepy' && (
        <motion.text
          x="92"
          y="34"
          fontSize="13"
          fontWeight="700"
          fill={palette.eye}
          opacity="0.55"
          animate={animated ? { y: [34, 24], opacity: [0, 0.55, 0] } : undefined}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
        >
          z
        </motion.text>
      )}
    </svg>
  )

  // Thumbnails render as inert art: no button semantics, no timers, no springs.
  if (!animated) {
    return (
      <span className="block" style={{ width: size, height: size }} aria-hidden>
        {art}
      </span>
    )
  }

  return (
    <motion.button
      type="button"
      aria-label="Poke Momo"
      onClick={poke}
      animate={controls}
      whileTap={{ scale: 0.94 }}
      className="relative block cursor-pointer select-none rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/30"
      style={{ width: size, height: size }}
    >
      {/* Idle breathing lives on a wrapper so the poke spring can own `controls`. */}
      <motion.div
        animate={{ y: [0, -4, 0], scale: [1, 1.025, 1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {art}
      </motion.div>
    </motion.button>
  )
}

function Eyes({ closed, mood, color }: { closed: boolean; mood: MascotMood; color: string }) {
  const stroke = { stroke: color, strokeWidth: 3.4, strokeLinecap: 'round' as const, fill: 'none' }

  if (closed || mood === 'happy') {
    return (
      <g {...stroke}>
        <path d="M36 64c3-4 9-4 12 0" />
        <path d="M72 64c3-4 9-4 12 0" />
      </g>
    )
  }
  if (mood === 'sleepy') {
    return (
      <g {...stroke}>
        <path d="M36 66c3 3 9 3 12 0" />
        <path d="M72 66c3 3 9 3 12 0" />
      </g>
    )
  }
  if (mood === 'wink') {
    return (
      <g>
        <ellipse cx="42" cy="65" rx="4.6" ry="5.4" fill={color} />
        <circle cx="43.6" cy="63" r="1.7" fill="#fff" opacity="0.9" />
        <path d="M72 66c3-4 9-4 12 0" {...stroke} />
      </g>
    )
  }
  const r = mood === 'excited' ? 5.6 : 4.6
  const lookX = mood === 'thirsty' ? 1.8 : 0
  return (
    <g>
      <ellipse cx={42 + lookX} cy="65" rx={r} ry={r + 0.8} fill={color} />
      <ellipse cx={78 + lookX} cy="65" rx={r} ry={r + 0.8} fill={color} />
      <circle cx={43.8 + lookX} cy="63" r="1.7" fill="#fff" opacity="0.9" />
      <circle cx={79.8 + lookX} cy="63" r="1.7" fill="#fff" opacity="0.9" />
    </g>
  )
}

function Mouth({ mood, color }: { mood: MascotMood; color: string }) {
  const stroke = { stroke: color, strokeWidth: 3, strokeLinecap: 'round' as const, fill: 'none' }
  switch (mood) {
    case 'happy':
    case 'excited':
      return <path d="M53 76c3 5 11 5 14 0" fill={color} opacity="0.9" />
    case 'sleepy':
      return <ellipse cx="60" cy="78" rx="3.2" ry="3.8" fill={color} opacity="0.75" />
    case 'thirsty':
      return (
        <g>
          <path d="M54 76c3 4 9 4 12 0" {...stroke} />
          <path d="M60 79c0 3 2 4 4 3" stroke="#fb7185" strokeWidth="2.6" fill="none" />
        </g>
      )
    case 'stretching':
      return <path d="M55 75c2 6 8 6 10 0" fill={color} opacity="0.85" />
    default:
      return <path d="M55 76c2 3 8 3 10 0" {...stroke} />
  }
}

function Sparkle({ x, y, c }: { x: number; y: number; c: string }) {
  return (
    <path
      d={`M${x} ${y - 5}c1 3.4 1.6 4 5 5-3.4 1-4 1.6-5 5-1-3.4-1.6-4-5-5 3.4-1 4-1.6 5-5z`}
      fill={c}
    />
  )
}
