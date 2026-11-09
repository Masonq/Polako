// Photo set + where the print sits on each photo (fractions of width/height).
export const SWATCH = { ekru: '#ECE6D8', grafit: '#3B3E42', zalfija: '#94A68C', pesak: '#D6C4A6' }
const BOX = {
  hudi: { x: 0.5, y: 0.392, w: 0.29 },
  duks: { x: 0.5, y: 0.37, w: 0.31 },
  majica: { x: 0.5, y: 0.355, w: 0.31 },
}
const TUNE = { hudi_pesak: { y: 0.395 }, majica_pesak: { y: 0.37 }, hudi_grafit: { y: 0.395 } }
export const productPhoto = (g, c, small = false) => ({
  src: `/img/${g}_${c}${small ? '-s' : ''}.webp`,
  box: { ...BOX[g], ...(TUNE[`${g}_${c}`] || {}) },
  color: c,
})
export const HERO = { src: '/img/hero_sit.webp', box: { x: 0.52, y: 0.357, w: 0.17 }, color: 'zalfija' }
export const LOOK = {
  src: '/img/look_duo.webp',
  people: [
    { garment: 'hudi', color: 'ekru', box: { x: 0.365, y: 0.35, w: 0.12 }, dot: { x: 0.235, y: 0.29 } },
    { garment: 'majica', color: 'grafit', box: { x: 0.655, y: 0.318, w: 0.17 }, dot: { x: 0.775, y: 0.255 } },
  ],
}
