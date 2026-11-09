import { dripPath } from './logoGeometry'
// drop loader: paint edge, drip forms, drop falls, ripple
export default function Loader({ label = '', small = false }) {
  return (
    <div className={`loader ${small ? 'loader--small' : ''}`} role="status" aria-live="polite">
      <svg viewBox="0 0 80 110" aria-hidden="true">
        <rect x="0" y="0" width="80" height="10" rx="5" className="loader__edge" />
        <path className="loader__drip" d={dripPath(40, 6, 34, 22)} />
        <circle className="loader__drop" cx="40" cy="48" r="8" />
        <ellipse className="loader__ripple" cx="40" cy="100" rx="6" ry="2" />
      </svg>
      {label && <span>{label}</span>}
    </div>
  )
}
