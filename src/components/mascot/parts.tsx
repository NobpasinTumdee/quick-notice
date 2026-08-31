import type { FC } from 'react'
import type { MascotPalette } from '../../lib/themes'

export interface PartProps {
  palette: MascotPalette
  /** Unique suffix for gradient/filter ids — several mascots can share a page. */
  uid: string
}

/**
 * A wearable is up to two draw calls: `back` renders behind Momo's body (hoods,
 * capes), `front` renders over it. Everything lives in the same 120×120 viewBox
 * as the base character, so parts never need per-size tuning.
 */
export interface PartDef {
  back?: FC<PartProps>
  front?: FC<PartProps>
  /** Hats that would sit exactly where the sprout grows. */
  hidesSprout?: boolean
}

/* ------------------------------------------------------------------- head */

const Bow: FC<PartProps> = () => (
  <g>
    <path d="M60 28c-5-7-14-9-17-4s3 11 17 8z" fill="#f4749b" />
    <path d="M60 28c5-7 14-9 17-4s-3 11-17 8z" fill="#ff8fb0" />
    <circle cx="60" cy="29" r="4" fill="#e05c86" />
    <circle cx="58.5" cy="27.6" r="1.3" fill="#ffd7e3" />
  </g>
)

const StrawHat: FC<PartProps> = () => (
  <g>
    <ellipse cx="60" cy="40" rx="35" ry="9.5" fill="#e6bd7a" />
    <ellipse cx="60" cy="38.5" rx="35" ry="9" fill="#f5d69a" />
    <path d="M42 39c0-13 6-21 18-21s18 8 18 21z" fill="#f0cb87" />
    <path d="M42 37c6 3 30 3 36 0l1 3c-8 3-30 3-38 0z" fill="#d9776b" />
  </g>
)

const Beanie: FC<PartProps> = () => (
  <g>
    <path d="M31 44c2-16 13-25 29-25s27 9 29 25z" fill="#7f9cf5" />
    <path d="M31 44c0 0 12 4 29 4s29-4 29-4l1 7c-9 4-51 4-60 0z" fill="#5a78e0" />
    <circle cx="60" cy="16" r="6.5" fill="#c7d2fe" />
    <path
      d="M45 26c3-4 7-6 11-7M66 20c4 2 7 5 9 9"
      stroke="#9db2ff"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </g>
)

const FlowerCrown: FC<PartProps> = () => {
  const flower = (x: number, y: number, c: string, r = 4.2) => (
    <g key={`${x}-${y}`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          cx={x + Math.cos((a * Math.PI) / 180) * r * 0.8}
          cy={y + Math.sin((a * Math.PI) / 180) * r * 0.8}
          rx={r * 0.62}
          ry={r * 0.62}
          fill={c}
        />
      ))}
      <circle cx={x} cy={y} r={r * 0.5} fill="#ffd85e" />
    </g>
  )
  return (
    <g>
      <path
        d="M31 44c4-10 15-16 29-16s25 6 29 16"
        stroke="#7fbf6a"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {flower(34, 42, '#ffd1e3')}
      {flower(46, 33, '#fff2c2', 3.6)}
      {flower(60, 29, '#ffc0d4', 4.6)}
      {flower(74, 33, '#e5d4ff', 3.6)}
      {flower(86, 42, '#ffd1e3')}
    </g>
  )
}

const CatEars: FC<PartProps> = ({ palette }) => (
  <g>
    <path d="M33 44c-2-11-1-18 1-19s9 4 14 11z" fill={palette.bodyTo} />
    <path d="M35 41c-1-7-1-11 0-12s5 3 8 8z" fill={palette.cheek} opacity="0.85" />
    <path d="M87 44c2-11 1-18-1-19s-9 4-14 11z" fill={palette.bodyTo} />
    <path d="M85 41c1-7 1-11 0-12s-5 3-8 8z" fill={palette.cheek} opacity="0.85" />
  </g>
)

const WizardHat: FC<PartProps> = ({ uid }) => (
  <g>
    <defs>
      <linearGradient id={`wiz-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8b7bd8" />
        <stop offset="100%" stopColor="#5b4bb0" />
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="42" rx="33" ry="8.5" fill="#6a58c0" />
    <path d="M60 2c6 10 13 27 16 40-10 4-22 4-32 0C47 29 54 12 60 2z" fill={`url(#wiz-${uid})`} />
    <path d="M44 36c10 4 22 4 32 0l1.5 6c-11 4-24 4-35 0z" fill="#ffd85e" />
    <path d="M60 6l1.8 4.4 4.7.4-3.6 3 1.1 4.6-4-2.5-4 2.5 1.1-4.6-3.6-3 4.7-.4z" fill="#ffe9a8" />
  </g>
)

const Halo: FC<PartProps> = ({ uid }) => (
  <g>
    <defs>
      <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
        <stop offset="55%" stopColor="#ffe9a8" stopOpacity="0" />
        <stop offset="100%" stopColor="#ffd85e" stopOpacity="0.85" />
      </radialGradient>
    </defs>
    <ellipse cx="60" cy="18" rx="20" ry="6.5" fill={`url(#halo-${uid})`} />
    <ellipse
      cx="60"
      cy="18"
      rx="17"
      ry="5"
      fill="none"
      stroke="#ffd85e"
      strokeWidth="3.4"
      opacity="0.95"
    />
  </g>
)

/* ----------------------------------------------------------------- outfit */

const Scarf: FC<PartProps> = () => (
  <g transform="translate(0 -7)">
    <path d="M36 84c8 6 40 6 48 0l2 8c-9 7-43 7-52 0z" fill="#e2606a" />
    <path d="M78 90c5 2 8 8 7 14-4 1-8 0-10-2z" fill="#c94a56" />
    <path d="M40 88c10 5 30 5 40 0" stroke="#ffffff" strokeWidth="1.6" opacity="0.35" fill="none" />
  </g>
)

const Apron: FC<PartProps> = () => (
  <g transform="translate(0 -8)">
    <path d="M46 82h28c4 8 5 13 4 18-9 4-27 4-36 0-1-5 0-10 4-18z" fill="#6f9e63" />
    <path d="M50 82c2-4 6-6 10-6s8 2 10 6" stroke="#5b8452" strokeWidth="2.6" fill="none" />
    <rect x="53" y="90" width="14" height="9" rx="2.4" fill="#8fbb82" />
  </g>
)

const Hoodie: FC<PartProps> = () => (
  <g transform="translate(0 -7)">
    <path d="M34 86c6 7 46 7 52 0l3 9c-11 7-47 7-58 0z" fill="#f0a3b7" />
    <circle cx="52" cy="93" r="2" fill="#fff" opacity="0.85" />
    <circle cx="68" cy="93" r="2" fill="#fff" opacity="0.85" />
    <path
      d="M52 92c-3 4-4 8-3 11M68 92c3 4 4 8 3 11"
      stroke="#ffffff"
      strokeWidth="1.8"
      opacity="0.7"
      fill="none"
    />
  </g>
)

const HoodieBack: FC<PartProps> = () => (
  <path
    d="M60 26c19 0 32 14 32 32 0 6-2 9-4 9-3 0-4-6-6-12-3-10-11-16-22-16s-19 6-22 16c-2 6-3 12-6 12-2 0-4-3-4-9 0-18 13-32 32-32z"
    fill="#f7bccb"
  />
)

const Sailor: FC<PartProps> = () => (
  <g transform="translate(0 -7)">
    <path d="M36 82c8 6 40 6 48 0l3 10c-4 3-11 5-16 5l-11 8-11-8c-5 0-12-2-16-5z" fill="#eef3fb" />
    <path d="M39 86c8 4 34 4 42 0l1.4 4c-9 4-35 4-44 0z" fill="#5b86c9" />
    <path d="M55 94l5 5 5-5-5-3z" fill="#e2606a" />
  </g>
)

const Cape: FC<PartProps> = ({ uid }) => (
  <g>
    <defs>
      <linearGradient id={`cape-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6d5bc4" />
        <stop offset="100%" stopColor="#3f327f" />
      </linearGradient>
    </defs>
    <path d="M40 74c-9 8-16 20-18 32 26 6 50 6 76 0-2-12-9-24-18-32z" fill={`url(#cape-${uid})`} />
    <path d="M34 96l3-1 2 5-3 1zM84 95l3 1-2 5-3-1z" fill="#ffd85e" opacity="0.8" />
  </g>
)

const CapeClasp: FC<PartProps> = () => (
  <g transform="translate(0 -6)">
    <path d="M40 78c8 5 32 5 40 0l1 5c-10 5-32 5-42 0z" fill="#4b3d94" />
    <circle cx="60" cy="82" r="3.4" fill="#ffd85e" />
  </g>
)

const OnesieHood: FC<PartProps> = () => (
  <g>
    <path
      d="M60 24c19 0 31 13 31 30 0 4-1 7-2 7-2 0-3-4-4-8-3-11-12-17-25-17s-22 6-25 17c-1 4-2 8-4 8-1 0-2-3-2-7 0-17 12-30 31-30z"
      fill="#7dc45e"
    />
    <circle cx="38" cy="34" r="7.5" fill="#8fd36e" />
    <circle cx="38" cy="34" r="3.4" fill="#2f4f24" />
    <circle cx="39.4" cy="32.6" r="1.2" fill="#fff" />
    <circle cx="82" cy="34" r="7.5" fill="#8fd36e" />
    <circle cx="82" cy="34" r="3.4" fill="#2f4f24" />
    <circle cx="83.4" cy="32.6" r="1.2" fill="#fff" />
  </g>
)

const OnesieBelly: FC<PartProps> = () => (
  <g transform="translate(0 -7)">
    <path d="M34 84c8 8 44 8 52 0l3 11c-11 7-47 7-58 0z" fill="#7dc45e" />
    <ellipse cx="60" cy="93" rx="13" ry="5" fill="#e9f6c9" opacity="0.9" />
  </g>
)

/* ------------------------------------------------------------------- prop */

const Bottle: FC<PartProps> = () => (
  <g>
    <rect x="98" y="60" width="15" height="26" rx="6" fill="#8ed3f5" />
    <rect x="98" y="70" width="15" height="16" rx="5" fill="#4fb6ea" />
    <rect x="102" y="54" width="7" height="7" rx="2.2" fill="#3d6f8f" />
    <rect x="100.5" y="63" width="3" height="12" rx="1.5" fill="#ffffff" opacity="0.6" />
  </g>
)

const TeaCup: FC<PartProps> = () => (
  <g>
    <path d="M97 68h18l-2 12a7 7 0 01-7 6h-0a7 7 0 01-7-6z" fill="#f6f1e4" />
    <path d="M98.5 72h15l-1 6c-4 2-9 2-13 0z" fill="#8bbf62" />
    <path d="M115 71c4 0 6 2 6 5s-2 5-6 5" stroke="#f6f1e4" strokeWidth="2.6" fill="none" />
    <path
      d="M103 62c-2-3 2-5 0-8M109 62c-2-3 2-5 0-8"
      stroke="#cfd8dc"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      opacity="0.85"
    />
  </g>
)

const Dumbbell: FC<PartProps> = () => (
  <g>
    <rect x="96" y="72" width="22" height="4.5" rx="2" fill="#9aa5b1" />
    <rect x="93" y="66" width="7" height="17" rx="3" fill="#4b5563" />
    <rect x="114" y="66" width="7" height="17" rx="3" fill="#4b5563" />
    <rect x="95" y="68" width="2.4" height="8" rx="1.2" fill="#ffffff" opacity="0.35" />
  </g>
)

const Book: FC<PartProps> = () => (
  <g>
    <path d="M94 66l12 4v18l-12-4z" fill="#e2606a" />
    <path d="M118 66l-12 4v18l12-4z" fill="#f0808a" />
    <path d="M106 70v18" stroke="#b8434f" strokeWidth="1.6" />
    <path
      d="M97 72l6 2M97 76l6 2M109 74l6-2M109 78l6-2"
      stroke="#ffffff"
      strokeWidth="1.2"
      opacity="0.6"
    />
  </g>
)

const Wand: FC<PartProps> = () => (
  <g>
    <rect
      x="103"
      y="64"
      width="4"
      height="26"
      rx="2"
      fill="#c8b6ff"
      transform="rotate(14 105 77)"
    />
    <path
      d="M104 52l2.6 6.2 6.7.6-5.1 4.4 1.5 6.5-5.7-3.5-5.7 3.5 1.5-6.5-5.1-4.4 6.7-.6z"
      fill="#ffd85e"
    />
    <path d="M104 57l1 2.4 2.6.2-2 1.7.6 2.5-2.2-1.4-2.2 1.4.6-2.5-2-1.7 2.6-.2z" fill="#fff6d6" />
  </g>
)

const Duck: FC<PartProps> = () => (
  <g>
    <ellipse cx="105" cy="80" rx="11" ry="8.5" fill="#ffd85e" />
    <circle cx="112" cy="71" r="6.5" fill="#ffd85e" />
    <path d="M117 70c4-1 6 1 6 2s-2 3-6 2z" fill="#f59e0b" />
    <circle cx="113.4" cy="69.4" r="1.5" fill="#3f3a2f" />
    <path d="M97 79c3 2 7 3 10 2" stroke="#f0c33c" strokeWidth="1.6" fill="none" />
  </g>
)


/* --------------------------------------------------- head (expansion pack) */

/** A fuller sprout than the one Momo grows: three leaves and a berry bud. */
const SproutCrown: FC<PartProps> = ({ palette, uid }) => (
  <g>
    <defs>
      <linearGradient id={`sprc-${uid}`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor={palette.leaf} stopOpacity="0.8" />
        <stop offset="100%" stopColor={palette.leaf} />
      </linearGradient>
    </defs>
    <path
      d="M60 34c0-8 0-14 0-19"
      stroke={palette.leaf}
      strokeWidth="3.4"
      strokeLinecap="round"
      fill="none"
    />
    {/* Bigger and three-lobed, so it still reads as "more sprout" at 24px. */}
    <path d="M60 21c-15-2-23-10-23-18 11-3 22 4 23 18z" fill={`url(#sprc-${uid})`} />
    <path d="M60 27c14-2 21-10 21-18-10-2-20 4-21 18z" fill={`url(#sprc-${uid})`} opacity="0.92" />
    <path d="M60 32c-10 0-16-5-16-11 7-2 15 2 16 11z" fill={`url(#sprc-${uid})`} opacity="0.78" />
    <circle cx="60" cy="11" r="5.4" fill={palette.cheek} />
    <circle cx="58" cy="9.4" r="1.8" fill="#ffffff" opacity="0.8" />
  </g>
)

/**
 * Audiophile IEMs. Momo has no ears, so the shells sit where ears would be and
 * the cable does the explaining: an over-ear hook, then a braided run down.
 */
const Iems: FC<PartProps> = ({ uid }) => {
  const shell = (x: number, flip: number) => (
    <g transform={`translate(${x} 60) scale(${flip} 1)`}>
      <path
        d="M2 -4c4-6 10-7 13-3"
        stroke="#c9ced8"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M0 6c1 8 -1 14 -4 19"
        stroke="#aeb6c2"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="0" cy="1" rx="7.4" ry="8.6" fill={`url(#iem-${uid})`} />
      <ellipse cx="0" cy="1" rx="7.4" ry="8.6" fill="none" stroke="#8f97a6" strokeWidth="1.1" />
      <ellipse cx="-1.6" cy="-2.4" rx="2.6" ry="3" fill="#ffffff" opacity="0.55" />
      <circle cx="1.4" cy="3" r="1.5" fill="#2a3140" opacity="0.65" />
      <path d="M5 4c4 1 6 3 6 5s-3 2-5 1z" fill="#d7dbe2" />
    </g>
  )
  return (
    <g>
      <defs>
        <linearGradient id={`iem-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5b6472" />
          <stop offset="55%" stopColor="#2f3743" />
          <stop offset="100%" stopColor="#161c25" />
        </linearGradient>
      </defs>
      {shell(28, 1)}
      {shell(92, -1)}
    </g>
  )
}

/** Mecha V-fin: the crest, a forehead sensor, and a blue brow vent. */
const VFin: FC<PartProps> = ({ uid }) => (
  <g>
    <defs>
      <linearGradient id={`vfin-${uid}`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#f2f4f8" />
        <stop offset="100%" stopColor="#c7cedb" />
      </linearGradient>
    </defs>
    <path d="M60 34L36 6l7-3 20 24z" fill="#d81f30" />
    <path d="M60 34L84 6l-7-3-20 24z" fill="#e8394a" />
    <path d="M43 4l3-1 16 20-3 3z" fill="#ffffff" opacity="0.35" />
    {/* The crest sits on a white-ish head on most themes, so it needs its own
        outline to stay legible rather than dissolving into the body. */}
    <path d="M46 34c2-8 6-12 14-12s12 4 14 12z" fill={`url(#vfin-${uid})`} />
    <path d="M46 34c2-8 6-12 14-12s12 4 14 12z" fill="none" stroke="#5b6472" strokeWidth="1.6" />
    <circle cx="60" cy="29" r="3.6" fill="#f2b705" />
    <circle cx="60" cy="29" r="1.6" fill="#fff6d6" opacity="0.9" />
    <path d="M50 31h20" stroke="#1f6fd8" strokeWidth="2" strokeLinecap="round" />
  </g>
)

/* ------------------------------------------------- outfit (expansion pack) */

/** A plain tee still has to be visible against a near-white mochi body. */
const Tee: FC<PartProps> = () => (
  <g transform="translate(0 -6)">
    <path d="M36 82c8 6 40 6 48 0l3 15c-11 6-43 6-54 0z" fill="#cfd8e6" />
    <path d="M36 82c8 6 40 6 48 0" stroke="#a9b6c9" strokeWidth="1.6" fill="none" />
    <path d="M51 81c2 5 5 7 9 7s7-2 9-7l-3-1c-1 3-3 5-6 5s-5-2-6-5z" fill="#8fa0b8" />
    <path d="M37 84l-5 7 7 3 3-7z" fill="#dbe3ee" />
    <path d="M83 84l5 7-7 3-3-7z" fill="#dbe3ee" />
    <path d="M52 92h16" stroke="#e9eef6" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
  </g>
)

/** Oversized knit: longer body, ribbed hem, cuffs past the paws. */
const Sweater: FC<PartProps> = () => (
  <g transform="translate(0 -6)">
    <path d="M33 78c10 8 44 8 54 0l4 22c-13 7-49 7-62 0z" fill="#c8b6a0" />
    <path d="M33 92c13 6 41 6 54 0" stroke="#b09b83" strokeWidth="1.6" fill="none" opacity="0.8" />
    <path d="M35 86c13 6 37 6 50 0" stroke="#b09b83" strokeWidth="1.6" fill="none" opacity="0.6" />
    <path d="M31 98c13 7 45 7 58 0l1 5c-14 7-46 7-60 0z" fill="#b09b83" />
    <path
      d="M40 99v5M50 101v5M60 102v5M70 101v5M80 99v5"
      stroke="#9c8770"
      strokeWidth="1.2"
      opacity="0.7"
    />
    {/* No separate cuff shapes: the arms sit *behind* the body, so anything
        drawn out there reads as a detached blob rather than as a sleeve. */}
    <path d="M53 79c3 4 11 4 14 0" stroke="#b09b83" strokeWidth="2.4" fill="none" />
    <path d="M36 80l-4 6 6 3 3-6z" fill="#c8b6a0" />
    <path d="M84 80l4 6-6 3-3-6z" fill="#c8b6a0" />
  </g>
)

const NinjaScarf: FC<PartProps> = () => (
  <g>
    <path d="M40 76c-10 3-22 12-26 22 9 4 20 1 26-6z" fill="#2f3b52" />
    <path d="M38 80c-8 3-16 9-19 16" stroke="#46577a" strokeWidth="1.6" fill="none" opacity="0.8" />
  </g>
)

/** Ninja suit: dark gi, crossed straps, knotted belt. The face stays visible. */
const Ninja: FC<PartProps> = () => (
  <g transform="translate(0 -6)">
    <path d="M35 80c9 7 41 7 50 0l4 19c-12 7-46 7-58 0z" fill="#232c3d" />
    <path d="M46 80l14 11 14-11 3 3-17 13-17-13z" fill="#161d2a" />
    <path d="M33 92c13 6 41 6 54 0l1.6 5c-14 6-43 6-57 0z" fill="#8c1f2c" />
    <path d="M58 94l-6 8 4 1 3-6 3 6 4-1-6-8z" fill="#6f1622" />
    <circle cx="72" cy="95" r="2.2" fill="#c9ced8" opacity="0.9" />
  </g>
)

const HackerHood: FC<PartProps> = () => (
  <path
    d="M60 26c19 0 32 14 32 32 0 6-2 9-4 9-3 0-4-6-6-12-3-10-11-16-22-16s-19 6-22 16c-2 6-3 12-6 12-2 0-4-3-4-9 0-18 13-32 32-32z"
    fill="#1b2230"
  />
)

/** Hacker hoodie: black, drawstrings, and a prompt printed on the chest. */
const HackerHoodie: FC<PartProps> = () => (
  <g transform="translate(0 -6)">
    <path d="M34 84c6 7 46 7 52 0l3 15c-11 7-47 7-58 0z" fill="#232b3a" />
    <circle cx="52" cy="90" r="1.9" fill="#22ff88" opacity="0.9" />
    <circle cx="68" cy="90" r="1.9" fill="#22ff88" opacity="0.9" />
    <path
      d="M52 89c-3 4-4 8-3 11M68 89c3 4 4 8 3 11"
      stroke="#3c4759"
      strokeWidth="1.8"
      fill="none"
    />
    <path
      d="M55 95l3 3-3 3"
      stroke="#22ff88"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M60 98h5" stroke="#22ff88" strokeWidth="1.8" strokeLinecap="round" />
  </g>
)

const SpacePack: FC<PartProps> = () => (
  <g>
    <rect x="30" y="52" width="60" height="40" rx="12" fill="#b9c2d0" />
    <rect x="36" y="58" width="48" height="26" rx="9" fill="#95a0b2" />
    <rect x="86" y="44" width="3" height="16" rx="1.5" fill="#9aa5b5" />
    <circle cx="87.5" cy="42" r="3" fill="#f2b705" />
  </g>
)

/** Space suit: neck ring, chest console, mission patch. Legendary kit. */
const SpaceSuit: FC<PartProps> = ({ uid }) => (
  <g transform="translate(0 -6)">
    <defs>
      <linearGradient id={`suit-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#dbe2ec" />
      </linearGradient>
    </defs>
    <path d="M33 78c10 8 44 8 54 0l4 21c-13 7-49 7-62 0z" fill={`url(#suit-${uid})`} />
    <path d="M42 78c6 5 30 5 36 0l1 5c-8 5-30 5-38 0z" fill="#c3ccd9" />
    <path d="M42 80c6 4 30 4 36 0" stroke="#9aa5b5" strokeWidth="1.2" fill="none" />
    <rect x="49" y="86" width="22" height="12" rx="3" fill="#2b3446" />
    <rect x="51.5" y="88.5" width="4" height="3" rx="1" fill="#22ff88" />
    <rect x="57" y="88.5" width="4" height="3" rx="1" fill="#f2b705" />
    <rect x="62.5" y="88.5" width="4" height="3" rx="1" fill="#ff5f6d" />
    <path d="M51.5 94h17" stroke="#5d6a80" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="79" cy="90" r="4.4" fill="#1f6fd8" />
    <path d="M79 87l1 2.2 2.4.2-1.8 1.6.6 2.4-2.2-1.3-2.2 1.3.6-2.4-1.8-1.6 2.4-.2z" fill="#ffe08a" />
    <path d="M36 84l-4 6 5 3 3-6z" fill="#d81f30" />
  </g>
)

/* --------------------------------------------------- prop (expansion pack) */

const Coffee: FC<PartProps> = () => (
  <g>
    <path
      d="M94 62c-2-3 2-5 0-8M100 62c-2-3 2-5 0-8"
      stroke="#cfd8dc"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      opacity="0.8"
    />
    {/* Cup body, outlined: white-on-white loses the whole silhouette. */}
    <path d="M94 67h20l-3 21a6 6 0 01-6 5h-2a6 6 0 01-6-5z" fill="#fbf7f0" />
    <path
      d="M94 67h20l-3 21a6 6 0 01-6 5h-2a6 6 0 01-6-5z"
      fill="none"
      stroke="#c4b5a3"
      strokeWidth="1.3"
    />
    <path d="M95.4 75h17.2l-1.4 9c-4.6 2-9.8 2-14.4 0z" fill="#a9714b" />
    <path d="M97 78h14" stroke="#8a5b3a" strokeWidth="1.3" opacity="0.85" />
    <path d="M91 62h26a3 3 0 010 6H91a3 3 0 010-6z" fill="#4a3323" />
    <ellipse cx="104" cy="63" rx="7" ry="1.8" fill="#5d4130" />
    <circle cx="104" cy="63" r="1.6" fill="#2f2015" />
  </g>
)

/** Ergonomic gaming mouse, with the obligatory RGB underglow. */
const Mouse: FC<PartProps> = ({ uid }) => (
  <g>
    <defs>
      <linearGradient id={`mouse-${uid}`} x1="0" y1="0" x2="0" y2="1">
        {/* Light enough to keep its silhouette against a dark theme's panel. */}
        <stop offset="0%" stopColor="#8b93a3" />
        <stop offset="60%" stopColor="#5a6272" />
        <stop offset="100%" stopColor="#333a47" />
      </linearGradient>
      <linearGradient id={`rgb-${uid}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#f43f5e" />
      </linearGradient>
    </defs>
    <ellipse cx="105" cy="88" rx="14" ry="3" fill="#0f1218" opacity="0.25" />
    <path d="M96 84c0-12 3-20 9-20s9 8 9 20c0 5-4 7-9 7s-9-2-9-7z" fill={`url(#mouse-${uid})`} />
    <path
      d="M96 84c0-12 3-20 9-20s9 8 9 20c0 5-4 7-9 7s-9-2-9-7z"
      fill="none"
      stroke="#20252f"
      strokeWidth="1.4"
    />
    {/* The split between the two click buttons is what makes it read as a mouse. */}
    <path d="M105 64.5v13" stroke="#20252f" strokeWidth="1.6" />
    <path d="M96.4 77.5c5 2 12 2 17 0" stroke="#20252f" strokeWidth="1.3" fill="none" />
    <rect x="103.2" y="67" width="3.6" height="6.4" rx="1.8" fill="#cfd5df" />
    <rect x="103.2" y="68.8" width="3.6" height="1.6" fill={`url(#rgb-${uid})`} />
    <path d="M97 85c4 3 12 3 16 0" stroke={`url(#rgb-${uid})`} strokeWidth="2.4" fill="none" />
    <path d="M99.5 70c1-3 2-4.6 3.5-5.6" stroke="#c3cad6" strokeWidth="1.3" fill="none" opacity="0.7" />
  </g>
)

/** Mechanical keyboard: 60%, two-tone caps, one accent key. */
const Keyboard: FC<PartProps> = () => {
  const cap = (x: number, y: number, fill: string) => (
    <rect key={`${x}-${y}`} x={x} y={y} width="4.2" height="4" rx="1.2" fill={fill} />
  )
  return (
    <g>
      <rect x="88" y="72" width="31" height="15" rx="3.4" fill="#2b3140" />
      <rect x="88" y="72" width="31" height="3" rx="1.6" fill="#3c4453" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3, 4].map((col) =>
          cap(
            90.5 + col * 5.4 + row * 1.1,
            76 + row * 4.6,
            row === 1 && col === 4 ? '#f2b705' : row === 2 && col === 0 ? '#7dd3fc' : '#e9edf3',
          ),
        ),
      )}
      <rect x="90" y="88.4" width="27" height="1.6" rx="0.8" fill="#1b2028" opacity="0.6" />
    </g>
  )
}

/* --------------------------------------------------------------- registry */

export const PARTS: Record<string, PartDef> = {
  // head
  sproutCrown: { front: SproutCrown, hidesSprout: true },
  bow: { front: Bow },
  strawHat: { front: StrawHat, hidesSprout: true },
  beanie: { front: Beanie, hidesSprout: true },
  flowerCrown: { front: FlowerCrown },
  catEars: { back: CatEars },
  wizardHat: { front: WizardHat, hidesSprout: true },
  halo: { front: Halo },
  iems: { front: Iems },
  vFin: { front: VFin, hidesSprout: true },
  // outfit
  scarf: { front: Scarf },
  apron: { front: Apron },
  hoodie: { back: HoodieBack, front: Hoodie },
  sailor: { front: Sailor },
  cape: { back: Cape, front: CapeClasp },
  onesie: { front: OnesieBelly, back: OnesieHood },
  tee: { front: Tee },
  sweater: { front: Sweater },
  ninja: { back: NinjaScarf, front: Ninja },
  hackerHoodie: { back: HackerHood, front: HackerHoodie },
  spaceSuit: { back: SpacePack, front: SpaceSuit },
  // prop
  bottle: { front: Bottle },
  teaCup: { front: TeaCup },
  dumbbell: { front: Dumbbell },
  book: { front: Book },
  wand: { front: Wand },
  duck: { front: Duck },
  coffee: { front: Coffee },
  mouse: { front: Mouse },
  keyboard: { front: Keyboard },
}
