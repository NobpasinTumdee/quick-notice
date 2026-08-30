import type { FC } from "react";
import type { MascotPalette } from "../../lib/themes";

export interface PartProps {
  palette: MascotPalette;
  /** Unique suffix for gradient/filter ids — several mascots can share a page. */
  uid: string;
}

/**
 * A wearable is up to two draw calls: `back` renders behind Momo's body (hoods,
 * capes), `front` renders over it. Everything lives in the same 120×120 viewBox
 * as the base character, so parts never need per-size tuning.
 */
export interface PartDef {
  back?: FC<PartProps>;
  front?: FC<PartProps>;
  /** Hats that would sit exactly where the sprout grows. */
  hidesSprout?: boolean;
}

/* ------------------------------------------------------------------- head */

const Bow: FC<PartProps> = () => (
  <g>
    <path d="M60 28c-5-7-14-9-17-4s3 11 17 8z" fill="#f4749b" />
    <path d="M60 28c5-7 14-9 17-4s-3 11-17 8z" fill="#ff8fb0" />
    <circle cx="60" cy="29" r="4" fill="#e05c86" />
    <circle cx="58.5" cy="27.6" r="1.3" fill="#ffd7e3" />
  </g>
);

const StrawHat: FC<PartProps> = () => (
  <g>
    <ellipse cx="60" cy="40" rx="35" ry="9.5" fill="#e6bd7a" />
    <ellipse cx="60" cy="38.5" rx="35" ry="9" fill="#f5d69a" />
    <path d="M42 39c0-13 6-21 18-21s18 8 18 21z" fill="#f0cb87" />
    <path d="M42 37c6 3 30 3 36 0l1 3c-8 3-30 3-38 0z" fill="#d9776b" />
  </g>
);

const Beanie: FC<PartProps> = () => (
  <g>
    <path d="M31 44c2-16 13-25 29-25s27 9 29 25z" fill="#7f9cf5" />
    <path
      d="M31 44c0 0 12 4 29 4s29-4 29-4l1 7c-9 4-51 4-60 0z"
      fill="#5a78e0"
    />
    <circle cx="60" cy="16" r="6.5" fill="#c7d2fe" />
    <path
      d="M45 26c3-4 7-6 11-7M66 20c4 2 7 5 9 9"
      stroke="#9db2ff"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </g>
);

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
  );
  return (
    <g>
      <path
        d="M31 44c4-10 15-16 29-16s25 6 29 16"
        stroke="#7fbf6a"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {flower(34, 42, "#ffd1e3")}
      {flower(46, 33, "#fff2c2", 3.6)}
      {flower(60, 29, "#ffc0d4", 4.6)}
      {flower(74, 33, "#e5d4ff", 3.6)}
      {flower(86, 42, "#ffd1e3")}
    </g>
  );
};

const CatEars: FC<PartProps> = ({ palette }) => (
  <g>
    <path d="M33 44c-2-11-1-18 1-19s9 4 14 11z" fill={palette.bodyTo} />
    <path
      d="M35 41c-1-7-1-11 0-12s5 3 8 8z"
      fill={palette.cheek}
      opacity="0.85"
    />
    <path d="M87 44c2-11 1-18-1-19s-9 4-14 11z" fill={palette.bodyTo} />
    <path
      d="M85 41c1-7 1-11 0-12s-5 3-8 8z"
      fill={palette.cheek}
      opacity="0.85"
    />
  </g>
);

const WizardHat: FC<PartProps> = ({ uid }) => (
  <g>
    <defs>
      <linearGradient id={`wiz-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8b7bd8" />
        <stop offset="100%" stopColor="#5b4bb0" />
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="42" rx="33" ry="8.5" fill="#6a58c0" />
    <path
      d="M60 2c6 10 13 27 16 40-10 4-22 4-32 0C47 29 54 12 60 2z"
      fill={`url(#wiz-${uid})`}
    />
    <path d="M44 36c10 4 22 4 32 0l1.5 6c-11 4-24 4-35 0z" fill="#ffd85e" />
    <path
      d="M60 6l1.8 4.4 4.7.4-3.6 3 1.1 4.6-4-2.5-4 2.5 1.1-4.6-3.6-3 4.7-.4z"
      fill="#ffe9a8"
    />
  </g>
);

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
);

/* ----------------------------------------------------------------- outfit */

const Scarf: FC<PartProps> = () => (
  <g transform="translate(0 -7)">
    <path d="M36 84c8 6 40 6 48 0l2 8c-9 7-43 7-52 0z" fill="#e2606a" />
    <path d="M78 90c5 2 8 8 7 14-4 1-8 0-10-2z" fill="#c94a56" />
    <path
      d="M40 88c10 5 30 5 40 0"
      stroke="#ffffff"
      strokeWidth="1.6"
      opacity="0.35"
      fill="none"
    />
  </g>
);

const Apron: FC<PartProps> = () => (
  <g transform="translate(0 -8)">
    <path
      d="M46 82h28c4 8 5 13 4 18-9 4-27 4-36 0-1-5 0-10 4-18z"
      fill="#6f9e63"
    />
    <path
      d="M50 82c2-4 6-6 10-6s8 2 10 6"
      stroke="#5b8452"
      strokeWidth="2.6"
      fill="none"
    />
    <rect x="53" y="90" width="14" height="9" rx="2.4" fill="#8fbb82" />
  </g>
);

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
);

const HoodieBack: FC<PartProps> = () => (
  <path
    d="M60 26c19 0 32 14 32 32 0 6-2 9-4 9-3 0-4-6-6-12-3-10-11-16-22-16s-19 6-22 16c-2 6-3 12-6 12-2 0-4-3-4-9 0-18 13-32 32-32z"
    fill="#f7bccb"
  />
);

const Sailor: FC<PartProps> = () => (
  <g transform="translate(0 -7)">
    <path
      d="M36 82c8 6 40 6 48 0l3 10c-4 3-11 5-16 5l-11 8-11-8c-5 0-12-2-16-5z"
      fill="#eef3fb"
    />
    <path d="M39 86c8 4 34 4 42 0l1.4 4c-9 4-35 4-44 0z" fill="#5b86c9" />
    <path d="M55 94l5 5 5-5-5-3z" fill="#e2606a" />
  </g>
);

const Cape: FC<PartProps> = ({ uid }) => (
  <g>
    <defs>
      <linearGradient id={`cape-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6d5bc4" />
        <stop offset="100%" stopColor="#3f327f" />
      </linearGradient>
    </defs>
    <path
      d="M40 74c-9 8-16 20-18 32 26 6 50 6 76 0-2-12-9-24-18-32z"
      fill={`url(#cape-${uid})`}
    />
    <path
      d="M34 96l3-1 2 5-3 1zM84 95l3 1-2 5-3-1z"
      fill="#ffd85e"
      opacity="0.8"
    />
  </g>
);

const CapeClasp: FC<PartProps> = () => (
  <g transform="translate(0 -6)">
    <path d="M40 78c8 5 32 5 40 0l1 5c-10 5-32 5-42 0z" fill="#4b3d94" />
    <circle cx="60" cy="82" r="3.4" fill="#ffd85e" />
  </g>
);

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
);

const OnesieBelly: FC<PartProps> = () => (
  <g transform="translate(0 -7)">
    <path d="M34 84c8 8 44 8 52 0l3 11c-11 7-47 7-58 0z" fill="#7dc45e" />
    <ellipse cx="60" cy="93" rx="13" ry="5" fill="#e9f6c9" opacity="0.9" />
  </g>
);

/* ------------------------------------------------------------------- prop */

const Bottle: FC<PartProps> = () => (
  <g>
    <rect x="98" y="60" width="15" height="26" rx="6" fill="#8ed3f5" />
    <rect x="98" y="70" width="15" height="16" rx="5" fill="#4fb6ea" />
    <rect x="102" y="54" width="7" height="7" rx="2.2" fill="#3d6f8f" />
    <rect
      x="100.5"
      y="63"
      width="3"
      height="12"
      rx="1.5"
      fill="#ffffff"
      opacity="0.6"
    />
  </g>
);

const TeaCup: FC<PartProps> = () => (
  <g>
    <path d="M97 68h18l-2 12a7 7 0 01-7 6h-0a7 7 0 01-7-6z" fill="#f6f1e4" />
    <path d="M98.5 72h15l-1 6c-4 2-9 2-13 0z" fill="#8bbf62" />
    <path
      d="M115 71c4 0 6 2 6 5s-2 5-6 5"
      stroke="#f6f1e4"
      strokeWidth="2.6"
      fill="none"
    />
    <path
      d="M103 62c-2-3 2-5 0-8M109 62c-2-3 2-5 0-8"
      stroke="#cfd8dc"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      opacity="0.85"
    />
  </g>
);

const Dumbbell: FC<PartProps> = () => (
  <g>
    <rect x="96" y="72" width="22" height="4.5" rx="2" fill="#9aa5b1" />
    <rect x="93" y="66" width="7" height="17" rx="3" fill="#4b5563" />
    <rect x="114" y="66" width="7" height="17" rx="3" fill="#4b5563" />
    <rect
      x="95"
      y="68"
      width="2.4"
      height="8"
      rx="1.2"
      fill="#ffffff"
      opacity="0.35"
    />
  </g>
);

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
);

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
    <path
      d="M104 57l1 2.4 2.6.2-2 1.7.6 2.5-2.2-1.4-2.2 1.4.6-2.5-2-1.7 2.6-.2z"
      fill="#fff6d6"
    />
  </g>
);

const Duck: FC<PartProps> = () => (
  <g>
    <ellipse cx="105" cy="80" rx="11" ry="8.5" fill="#ffd85e" />
    <circle cx="112" cy="71" r="6.5" fill="#ffd85e" />
    <path d="M117 70c4-1 6 1 6 2s-2 3-6 2z" fill="#f59e0b" />
    <circle cx="113.4" cy="69.4" r="1.5" fill="#3f3a2f" />
    <path
      d="M97 79c3 2 7 3 10 2"
      stroke="#f0c33c"
      strokeWidth="1.6"
      fill="none"
    />
  </g>
);

/* --------------------------------------------------------------- registry */

export const PARTS: Record<string, PartDef> = {
  // head
  bow: { front: Bow },
  strawHat: { front: StrawHat, hidesSprout: true },
  beanie: { front: Beanie, hidesSprout: true },
  flowerCrown: { front: FlowerCrown },
  catEars: { back: CatEars },
  wizardHat: { front: WizardHat, hidesSprout: true },
  halo: { front: Halo },
  // outfit
  scarf: { front: Scarf },
  apron: { front: Apron },
  hoodie: { back: HoodieBack, front: Hoodie },
  sailor: { front: Sailor },
  cape: { back: Cape, front: CapeClasp },
  onesie: { front: OnesieBelly, back: OnesieHood },
  // prop
  bottle: { front: Bottle },
  teaCup: { front: TeaCup },
  dumbbell: { front: Dumbbell },
  book: { front: Book },
  wand: { front: Wand },
  duck: { front: Duck },
};
