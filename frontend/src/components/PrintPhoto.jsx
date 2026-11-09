// A real photo with the phrase printed on the fabric (blend modes let the texture show through).
function wrap(line) {
  if (!line || line.length <= 15) return line ? [line] : []
  const mid = line.length / 2
  let best = -1
  for (let i = 0; i < line.length; i++) if (line[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i
  return best < 0 ? [line] : [line.slice(0, best), line.slice(best + 1)]
}
export function printLines(l1, l2) { return [...wrap(l1), ...wrap(l2)] }

export function Print({ box, color, lines, tech = 'stampa' }) {
  const n = Math.max(6, ...lines.map((l) => l.length))
  const fs = (box.w * 100) / (n * 0.56) // in cqw
  const dark = color === 'grafit'
  return (
    <div
      className={`print print--${dark ? 'dark' : 'light'} print--${tech}`}
      style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, fontSize: `${Math.min(fs, box.w * 100 / 4.2)}cqw` }}
      aria-hidden="true"
    >
      {lines.map((l, i) => <span key={i}>{l}</span>)}
    </div>
  )
}

export default function PrintPhoto({ photo, line1, line2, tech, className = '', alt = '', eager = false, children }) {
  const lines = printLines(line1, line2)
  return (
    <div className={`pphoto ${className}`}>
      <img src={photo.src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable="false" />
      {lines.length > 0 && <Print box={photo.box} color={photo.color} lines={lines} tech={tech} />}
      {children}
    </div>
  )
}
