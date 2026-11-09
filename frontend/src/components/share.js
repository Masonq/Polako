import { api } from '../api'
export async function sharePhrase(p, t, toast) {
  const url = `${location.origin}/p/${p.slug}`
  const text = `${p.line1} ${p.line2}`.trim()
  api.share(p.slug)
  if (navigator.share) {
    try { await navigator.share({ title: text, text: `${t.shareText}: «${text}»`, url }); return } catch (e) { if (e && e.name === 'AbortError') return }
  }
  try { await navigator.clipboard.writeText(url); toast(t.copied) } catch { toast(url) }
}
