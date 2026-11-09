import { FABRICS } from './Garment'
import { useT } from '../i18n'
export const GARMENTS = ['majica', 'duks', 'hudi']
export const COLORS = ['ekru', 'grafit', 'zalfija', 'pesak']
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export function Seg({ value, options, onChange, label, render }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} role="radio" aria-checked={value === o} className={value === o ? 'on' : ''} onClick={() => onChange(o)}>{render ? render(o) : o}</button>
      ))}
    </div>
  )
}

export function Swatches({ value, onChange }) {
  const { t } = useT()
  return (
    <div className="sw" role="radiogroup" aria-label={t.color}>
      {COLORS.map((c) => (
        <button key={c} role="radio" aria-checked={value === c} aria-label={t[c]} title={t[c]} className={value === c ? 'on' : ''} onClick={() => onChange(c)}>
          <span style={{ background: FABRICS[c].fill }} />
        </button>
      ))}
    </div>
  )
}
