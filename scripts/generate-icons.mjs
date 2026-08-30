/**
 * Draws every PNG the extension ships with — toolbar icons and the per-reminder
 * notification art — straight from code, so there are no binary assets to keep
 * in sync with the theme palette.
 *
 *   node scripts/generate-icons.mjs   ->   public/icons/*.png
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons')
const SS = 3 // supersampling factor: cheap, effective anti-aliasing

/* ------------------------------------------------------------- PNG writing */

function crc32(buf) {
  let c
  const table = crc32.table ?? (crc32.table = Array.from({ length: 256 }, (_, n) => {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  }))
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ---------------------------------------------------------------- painting */

const hex = (h) => {
  const v = h.replace('#', '')
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ]
}
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)

/** Canvas in normalized 0..1 space so one drawing works at every size. */
function createCanvas(size) {
  const w = size * SS
  const px = new Float32Array(w * w * 4)

  const blend = (x, y, [r, g, b], alpha) => {
    if (alpha <= 0 || x < 0 || y < 0 || x >= w || y >= w) return
    const i = (y * w + x) * 4
    const a = px[i + 3]
    const outA = alpha + a * (1 - alpha)
    for (let c = 0; c < 3; c++) {
      px[i + c] = (px[i + c] * c0(a) * (1 - alpha) + [r, g, b][c] * alpha) / (outA || 1)
    }
    px[i + 3] = outA
  }
  const c0 = (a) => (a === 0 ? 0 : 1)

  const each = (fn) => {
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) fn(x, y, (x + 0.5) / w, (y + 0.5) / w)
  }

  return {
    w,
    /** Fills where `sdf(u,v) < 0`, i.e. the inside of a shape. */
    fill(sdf, colorAt, alpha = 1) {
      each((x, y, u, v) => {
        if (sdf(u, v) < 0) {
          const color = typeof colorAt === 'function' ? colorAt(u, v) : colorAt
          blend(x, y, color, alpha)
        }
      })
    },
    toPng(size) {
      // Box-downsample the supersampled buffer onto the final grid.
      const out = Buffer.alloc(size * size * 4)
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          let r = 0, g = 0, b = 0, a = 0
          for (let sy = 0; sy < SS; sy++) {
            for (let sx = 0; sx < SS; sx++) {
              const i = ((y * SS + sy) * w + (x * SS + sx)) * 4
              const pa = px[i + 3]
              r += px[i] * pa
              g += px[i + 1] * pa
              b += px[i + 2] * pa
              a += pa
            }
          }
          const n = SS * SS
          const i = (y * size + x) * 4
          out[i] = a > 0 ? Math.round(r / a) : 0
          out[i + 1] = a > 0 ? Math.round(g / a) : 0
          out[i + 2] = a > 0 ? Math.round(b / a) : 0
          out[i + 3] = Math.round((a / n) * 255)
        }
      }
      return encodePng(size, size, out)
    },
  }
}

const circle = (cx, cy, r) => (u, v) => Math.hypot(u - cx, v - cy) - r
const ellipse = (cx, cy, rx, ry) => (u, v) => Math.hypot((u - cx) / rx, (v - cy) / ry) - 1
const squircle = (r) => (u, v) =>
  Math.pow(Math.abs(u - 0.5) / r, 4) + Math.pow(Math.abs(v - 0.5) / r, 4) - 1
const rotated = (sdf, cx, cy, deg) => {
  const a = (deg * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  return (u, v) => {
    const dx = u - cx
    const dy = v - cy
    return sdf(cx + dx * cos - dy * sin, cy + dx * sin + dy * cos)
  }
}

/** Momo, reduced to what still reads at 16×16. */
function drawMascot(size, palette) {
  const c = createCanvas(size)
  const bgFrom = hex(palette.bgFrom)
  const bgTo = hex(palette.bgTo)
  const body = hex(palette.body)
  const bodyShade = hex(palette.bodyShade)
  const leaf = hex(palette.leaf)
  const eye = hex(palette.eye)
  const cheek = hex(palette.cheek)

  c.fill(squircle(0.5), (u, v) => mix(bgFrom, bgTo, (u + v) / 2))
  // sprout
  c.fill(rotated(ellipse(0.415, 0.235, 0.085, 0.045), 0.5, 0.26, 18), leaf)
  c.fill(rotated(ellipse(0.585, 0.235, 0.075, 0.04), 0.5, 0.26, -18), mix(leaf, [255, 255, 255], 0.2))
  c.fill(ellipse(0.5, 0.29, 0.016, 0.06), leaf)
  // body
  c.fill(ellipse(0.5, 0.63, 0.315, 0.29), (u, v) => mix(body, bodyShade, (v - 0.34) / 0.6))
  c.fill(ellipse(0.395, 0.53, 0.075, 0.045), mix(body, [255, 255, 255], 0.7), 0.55)
  // face
  c.fill(circle(0.4, 0.63, 0.043), eye)
  c.fill(circle(0.6, 0.63, 0.043), eye)
  c.fill(circle(0.412, 0.617, 0.014), [255, 255, 255])
  c.fill(circle(0.612, 0.617, 0.014), [255, 255, 255])
  c.fill(ellipse(0.325, 0.715, 0.05, 0.03), cheek, 0.75)
  c.fill(ellipse(0.675, 0.715, 0.05, 0.03), cheek, 0.75)
  c.fill(ellipse(0.5, 0.715, 0.045, 0.03), eye, 0.9)
  c.fill(ellipse(0.5, 0.7, 0.045, 0.03), (u, v) => mix(body, bodyShade, (v - 0.34) / 0.6))
  return c.toPng(size)
}

const MASCOT = {
  bgFrom: '#EAF6DC',
  bgTo: '#BFE0B4',
  body: '#FFFDF3',
  bodyShade: '#E3F0D2',
  leaf: '#57A05A',
  eye: '#35402F',
  cheek: '#F7B7C0',
}

const REMINDER_TINTS = {
  hydration: { from: '#BAE6FD', to: '#38BDF8', leaf: '#0EA5E9' },
  posture: { from: '#DDD6FE', to: '#A78BFA', leaf: '#8B5CF6' },
  eyes: { from: '#FDE68A', to: '#FBBF24', leaf: '#D97706' },
  stretch: { from: '#FECDD3', to: '#FB7185', leaf: '#E11D48' },
}

mkdirSync(OUT_DIR, { recursive: true })

for (const size of [16, 32, 48, 128]) {
  writeFileSync(resolve(OUT_DIR, `icon${size}.png`), drawMascot(size, MASCOT))
}

for (const [id, tint] of Object.entries(REMINDER_TINTS)) {
  writeFileSync(
    resolve(OUT_DIR, `notify-${id}.png`),
    drawMascot(128, {
      ...MASCOT,
      bgFrom: tint.from,
      bgTo: tint.to,
      leaf: tint.leaf,
    }),
  )
}

console.log(`icons written to ${OUT_DIR}`)
