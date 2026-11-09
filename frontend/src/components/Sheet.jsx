import { useEffect } from 'react'
export default function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [open])
  return (
    <div className={`sheet ${open ? 'sheet--open' : ''}`} aria-hidden={!open}>
      <div className="sheet__bg" onClick={onClose} />
      <div className="sheet__panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__grip" />
        <div className="sheet__head"><h3>{title}</h3><button className="sheet__x" onClick={onClose} aria-label="×">×</button></div>
        {children}
      </div>
    </div>
  )
}
