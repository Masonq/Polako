import { useEffect, useRef, useState, useId } from 'react'
import { LETTERS, DRIPS, VIEW, W, dripPath, DROP_R } from './logoGeometry'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/**
 * mode: 'static' | 'live' (header: grows + drops on a timer, stretches on scroll)
 * gloss: glossy paint rendering
 */
export default function Logo({ mode = 'static', gloss = false, color = 'currentColor', className = '', title = 'polako.' }) {
  const [extra, setExtra] = useState([0, 0, 0])
  const [scroll, setScroll] = useState(0)
  const [falling, setFalling] = useState(null) // {i, t}
  const raf = useRef(0)
  const fid = useId().replace(/:/g, '')

  // drips stretch with scroll progress
  useEffect(() => {
    if (mode !== 'live' || reduced()) return
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScroll(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [mode])

  // live: every 8–10 s one drip slowly grows, a drop breaks off, drip settles back
  useEffect(() => {
    if (mode !== 'live' || reduced()) return
    let alive = true, timer
    const cycle = () => {
      const i = Math.floor(Math.random() * DRIPS.length)
      const grow = 1600, settle = 700, fall = 900
      const t0 = performance.now()
      const step = (now) => {
        if (!alive) return
        const t = now - t0
        const e = [0, 0, 0]
        if (t < grow) e[i] = ease(t / grow) * 34
        else if (t < grow + settle) e[i] = (1 - ease((t - grow) / settle)) * 34
        setExtra(e)
        if (t >= grow && t < grow + fall) setFalling({ i, t: (t - grow) / fall })
        else if (t >= grow + fall) setFalling(null)
        if (t < grow + Math.max(settle, fall)) raf.current = requestAnimationFrame(step)
        else { setExtra([0, 0, 0]); setFalling(null); timer = setTimeout(cycle, 8000 + Math.random() * 2000) }
      }
      raf.current = requestAnimationFrame(step)
    }
    timer = setTimeout(cycle, 2500)
    return () => { alive = false; clearTimeout(timer); cancelAnimationFrame(raf.current) }
  }, [mode])

  const k = 1 + scroll * 1.6
  const drips = DRIPS.map((d, i) => ({ ...d, len: d.L * k + extra[i] }))
  let drop = null
  if (falling) {
    const d = drips[falling.i]
    const y = d.y + DRIPS[falling.i].L * k + 34 + falling.t * falling.t * 260
    drop = { x: d.x, y, o: 1 - falling.t * 0.9 }
  }

  return (
    <svg className={`logo ${className}`} viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} role="img" aria-label={title} style={{ overflow: 'visible' }}>
      {gloss && (
        <defs>
          <filter id={`g${fid}`} x="-10%" y="-10%" width="120%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="8" specularConstant="1.25" specularExponent="34" lightingColor="#ffffff" result="spec">
              <fePointLight x="-120" y="-420" z="260" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="b2" />
            <feOffset in="b2" dx="0" dy="-5" result="o2" />
            <feComposite in="SourceAlpha" in2="o2" operator="out" result="rim" />
            <feFlood floodColor="#000" floodOpacity="0.28" />
            <feComposite in2="rim" operator="in" result="shade" />
            <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="shade" /></feMerge>
            <feComposite in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.95" k4="0" />
          </filter>
        </defs>
      )}
      <g filter={gloss ? `url(#g${fid})` : undefined}>
        <g fill="none" stroke={color} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round">
          {LETTERS.map((d, i) => <path key={i} d={d} />)}
        </g>
        <g fill={color}>
          {drips.map((d, i) => <path key={i} d={dripPath(d.x, d.y, d.len)} />)}
          {drop && <circle cx={drop.x} cy={drop.y} r={DROP_R} opacity={drop.o} />}
        </g>
      </g>
    </svg>
  )
}
