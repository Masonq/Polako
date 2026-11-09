import { SWATCH } from './photos'
import { useT } from '../i18n'
export const GARMENTS = ['majica', 'duks', 'hudi']
export const COLORS = ['ekru', 'grafit', 'zalfija', 'pesak']
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export function Seg({ value, options, onChange, label, render, className = '' }) {
  return (
    <div className={`seg ${className}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button type="button" key={o} role="radio" aria-checked={value === o} className={value === o ? 'on' : ''} onClick={() => onChange(o)}>{render ? render(o) : o}</button>
      ))}
    </div>
  )
}

export function Swatches({ value, onChange }) {
  const { t } = useT()
  return (
    <div className="sw" role="radiogroup" aria-label={t.color}>
      {COLORS.map((c) => (
        <button type="button" key={c} role="radio" aria-checked={value === c} aria-label={t[c]} title={t[c]} className={value === c ? 'on' : ''} onClick={() => onChange(c)}>
          <span style={{ background: SWATCH[c] }} />
        </button>
      ))}
    </div>
  )
}

export function Sizes({ value, onChange, error, small }) {
  return (
    <div className={`sizes ${small ? 'sizes--sm' : ''} ${error ? 'sizes--err' : ''}`} role="radiogroup">
      {SIZES.map((s) => <button type="button" key={s} role="radio" aria-checked={value === s} className={value === s ? 'on' : ''} onClick={() => onChange(s)}>{s}</button>)}
    </div>
  )
}

export function Heart({ on }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9-9.1C1.7 7.6 3.8 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.2 0 5.3 3.1 4 6.4C19 15.6 12 20 12 20Z" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
  )
}
export function SendIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-6 16-2.5-6.5L4 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
}
