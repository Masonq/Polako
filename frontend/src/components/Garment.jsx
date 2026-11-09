import { useId } from 'react'

export const FABRICS = {
  ekru: { fill: '#EFEADF', ink: '#C8BCA2', rib: '#DFD7C5' },
  grafit: { fill: '#3A3D41', ink: '#53575C', rib: '#33363A' },
  zalfija: { fill: '#A9B89F', ink: '#93A388', rib: '#9DAD93' },
  pesak: { fill: '#D9C6A5', ink: '#C2AC88', rib: '#CDB994' },
}
export const EMBROIDERY_INK = { ekru: '#B9AE96', grafit: '#6A6F75', zalfija: '#7E8E74', pesak: '#AD9571' }

const SHAPES = {
  majica: {
    body: 'M160 46 C175 72 225 72 240 46 L300 62 L372 118 L340 170 L302 150 L304 420 Q200 432 96 420 L98 150 L60 170 L28 118 L100 62 Z',
    neck: 'M160 46 C175 72 225 72 240 46',
    extra: [],
    textY: 150,
    vb: '0 30 400 410',
  },
  duks: {
    body: 'M160 46 C175 72 225 72 240 46 L300 60 Q346 80 360 140 L392 372 L352 382 L312 196 L308 404 L308 424 Q200 432 92 424 L92 404 L88 196 L48 382 L8 372 L40 140 Q54 80 100 60 Z',
    neck: 'M160 46 C175 72 225 72 240 46',
    extra: ['M92 404 Q200 412 308 404', 'M386 350 L349 360', 'M14 350 L51 360'],
    textY: 150,
    vb: '0 30 400 410',
  },
  hudi: {
    body: 'M160 46 C175 72 225 72 240 46 L300 60 Q346 80 360 140 L392 372 L352 382 L312 196 L308 404 L308 424 Q200 432 92 424 L92 404 L88 196 L48 382 L8 372 L40 140 Q54 80 100 60 Z',
    neck: null,
    extra: ['M92 404 Q200 412 308 404', 'M386 350 L349 360', 'M14 350 L51 360', 'M128 312 L272 312 L292 384 L108 384 Z'],
    hood: true,
    textY: 205,
    vb: '0 -4 400 444',
  },
}

// long lines are split at the space nearest the middle, so the print stays readable
function wrap(line) {
  if (!line || line.length <= 15) return line ? [line] : []
  const mid = line.length / 2
  let best = -1
  for (let i = 0; i < line.length; i++) if (line[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i
  return best < 0 ? [line] : [line.slice(0, best), line.slice(best + 1)]
}
function fitSize(lines) {
  const n = Math.max(6, ...lines.map((l) => l.length))
  return Math.min(30, Math.max(13, 190 / (n * 0.56)))
}

export default function Garment({ type = 'majica', color = 'ekru', line1 = '', line2 = '', tech = 'stampa', className = '' }) {
  const s = SHAPES[type] || SHAPES.majica
  const c = FABRICS[color] || FABRICS.ekru
  const uid = useId().replace(/:/g, '')
  const lines = [...wrap(line1), ...wrap(line2)]
  const size = fitSize(lines)
  const ink = tech === 'vez' ? EMBROIDERY_INK[color] : c.ink
  const lh = size * 1.12
  const y0 = s.textY + size * 0.36 - ((lines.length - 1) * lh) / 2
  return (
    <svg className={`garment ${className}`} viewBox={s.vb} role="img" aria-label={`${line1} ${line2}`}>
      <defs>
        <linearGradient id={`sh${uid}`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.10" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.10" />
        </linearGradient>
        {tech === 'vez' && (
          <filter id={`st${uid}`}>
            <feTurbulence type="fractalNoise" baseFrequency="1.6 0.25" numOctaves="1" seed="3" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" result="dark" />
            <feComposite in="dark" in2="SourceGraphic" operator="in" result="tex" />
            <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="tex" /></feMerge>
          </filter>
        )}
      </defs>
      {s.hood && (
        <g>
          <path d="M136 66 C126 30 158 4 200 4 C242 4 274 30 264 66 C244 90 156 90 136 66 Z" fill={c.fill} />
          <path d="M136 66 C126 30 158 4 200 4 C242 4 274 30 264 66 C244 90 156 90 136 66 Z" fill={`url(#sh${uid})`} />
          <path d="M166 64 C168 42 182 26 200 26 C218 26 232 42 234 64 C222 78 178 78 166 64 Z" fill={c.rib} />
        </g>
      )}
      <path d={s.body} fill={c.fill} />
      <path d={s.body} fill={`url(#sh${uid})`} />
      {s.neck && <path d={s.neck} fill="none" stroke={c.rib} strokeWidth="9" strokeLinecap="round" />}
      {s.extra.map((d, i) => <path key={i} d={d} fill="none" stroke={c.rib} strokeWidth="3" strokeLinejoin="round" />)}
      {s.hood && (
        <g stroke={c.rib} strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M186 78 L182 148" /><path d="M214 78 L218 142" />
          <circle cx="182" cy="152" r="3" fill={c.rib} /><circle cx="218" cy="146" r="3" fill={c.rib} />
        </g>
      )}
      <g filter={tech === 'vez' ? `url(#st${uid})` : undefined}>
        <text x="200" textAnchor="middle" fill={ink} fontFamily="Rubik, system-ui, sans-serif" fontWeight="800" fontSize={size} style={{ letterSpacing: '-0.01em' }}>
          {lines.map((l, i) => <tspan key={i} x="200" y={y0 + i * lh}>{l}</tspan>)}
        </text>
      </g>
    </svg>
  )
}
