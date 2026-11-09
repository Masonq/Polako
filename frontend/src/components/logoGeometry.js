// polako. wordmark — hand-built geometry. Stroke-based letters, filled drips.
export const W = 38 // stroke weight
export const VIEW = { x: -6, y: -6, w: 852, h: 284 } // letters incl. p descender

export const LETTERS = [
  // p
  'M19 79 L19 251',
  'M19 130 A51 51 0 1 1 121 130 A51 51 0 1 1 19 130',
  // o
  'M185 130 A51 51 0 1 1 287 130 A51 51 0 1 1 185 130',
  // l
  'M351 19 L351 181',
  // a (single-story)
  'M415 130 A51 51 0 1 1 517 130 A51 51 0 1 1 415 130',
  'M517 79 L517 181',
  // k
  'M581 19 L581 181',
  'M648 79 L586 141',
  'M606 121 L655 181',
  // o
  'M719 130 A51 51 0 1 1 821 130 A51 51 0 1 1 719 130',
]

// drips: x, attach y, base length
export const DRIPS = [
  { x: 243, y: 186, L: 72 },
  { x: 351, y: 186, L: 98 },
  { x: 581, y: 186, L: 60 },
]

export function dripPath(cx, y0, L, w = W) {
  // starts inside the letter (full stroke width), tapers to a neck, ends in a round drop
  const h = w * 0.5 - 0.6, n = w * 0.27, r = w * 0.37
  const minL = w * 0.75 + r * 1.2 + 2
  L = Math.max(L, minL)
  const top = y0 - w * 0.32, yb = y0 + L
  const p = (v) => Math.round(v * 10) / 10
  return [
    `M${p(cx - h)} ${p(top)}`,
    `C${p(cx - h)} ${p(y0 + w * 0.12)} ${p(cx - n)} ${p(y0 + w * 0.3)} ${p(cx - n)} ${p(y0 + w * 0.75)}`,
    `L${p(cx - n)} ${p(yb - r * 1.1)}`,
    `C${p(cx - n)} ${p(yb - r * 0.6)} ${p(cx - r)} ${p(yb - r * 0.5)} ${p(cx - r)} ${p(yb)}`,
    `A${p(r)} ${p(r)} 0 0 0 ${p(cx + r)} ${p(yb)}`,
    `C${p(cx + r)} ${p(yb - r * 0.5)} ${p(cx + n)} ${p(yb - r * 0.6)} ${p(cx + n)} ${p(yb - r * 1.1)}`,
    `L${p(cx + n)} ${p(y0 + w * 0.75)}`,
    `C${p(cx + n)} ${p(y0 + w * 0.3)} ${p(cx + h)} ${p(y0 + w * 0.12)} ${p(cx + h)} ${p(top)}`,
    'Z',
  ].join(' ')
}
export const DROP_R = W * 0.37
