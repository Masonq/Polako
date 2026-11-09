const j = async (r) => { if (!r.ok) { const e = new Error(String(r.status)); e.status = r.status; throw e } return r.json() }
export const api = {
  catalog: () => fetch('/api/catalog').then(j),
  phrase: (s) => fetch(`/api/phrase/${s}`).then(j),
  share: (s) => fetch(`/api/phrase/${s}/share`, { method: 'POST' }).catch(() => {}),
  order: (b) => fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(j),
}
const tok = () => localStorage.getItem('polako_admin') || ''
const aj = (m, u, b) => fetch(u, { method: m, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: b ? JSON.stringify(b) : undefined }).then(j)
export const admin = {
  login: (password) => fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }).then(j),
  phrases: () => aj('GET', '/api/admin/phrases'),
  create: (b) => aj('POST', '/api/admin/phrases', b),
  update: (id, b) => aj('PUT', `/api/admin/phrases/${id}`, b),
  remove: (id) => aj('DELETE', `/api/admin/phrases/${id}`),
  orders: (s = '') => aj('GET', `/api/admin/orders?status=${s}`),
  status: (id, status) => aj('PATCH', `/api/admin/orders/${id}`, { status }),
  settings: () => aj('GET', '/api/admin/settings'),
  saveSettings: (b) => aj('PUT', '/api/admin/settings', b),
}
