import { useEffect } from 'react'
export default function Toast({ msg, onDone, children }) {
  useEffect(() => { if (!msg) return; const id = setTimeout(onDone, 2600); return () => clearTimeout(id) }, [msg])
  if (!msg) return null
  return <div className="toast" role="status">{msg}{children}</div>
}
