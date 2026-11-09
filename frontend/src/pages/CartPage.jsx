import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useT, rsd } from '../i18n'
import { useCart, itemKey, unitPrice } from '../cart'
import { api } from '../api'
import PrintPhoto from '../components/PrintPhoto'
import { productPhoto } from '../components/photos'
import Loader from '../components/Loader'

const FIELDS = ['name', 'phone', 'city', 'postal', 'address']

export default function CartPage({ catalog }) {
  const { t } = useT()
  const cart = useCart()
  const nav = useNavigate()
  const [f, setF] = useState(() => { try { return JSON.parse(localStorage.getItem('polako_addr')) || {} } catch { return {} } })
  const [bad, setBad] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const s = catalog?.settings

  if (!cart.items.length) return <section className="wrap empty"><p>{t.emptyCart}</p><Link className="btn btn--pist" to="/#katalog">{t.catalog}</Link></section>

  const subtotal = cart.items.reduce((a, i) => a + unitPrice(s, i.garment, i.tech) * i.qty, 0)
  const delivery = s ? (subtotal >= s.free_delivery_from ? 0 : s.delivery) : 0

  const check = () => {
    const b = {}
    if (!f.name || f.name.trim().length < 2) b.name = 1
    if (!f.phone || f.phone.replace(/\D/g, '').length < 8) b.phone = 1
    if (!f.city || f.city.trim().length < 2) b.city = 1
    if (!f.address || f.address.trim().length < 3) b.address = 1
    setBad(b)
    return !Object.keys(b).length
  }
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (!check()) { setErr(t.errFields); return }
    setBusy(true)
    try {
      const { name, phone, city, postal = '', address, note = '' } = f
      localStorage.setItem('polako_addr', JSON.stringify({ name, phone, city, postal, address }))
      const r = await api.order({ name, phone, city, postal, address, note, items: cart.items.map(({ slug, garment, color, size, tech, qty }) => ({ slug, garment, color, size, tech, qty })) })
      cart.clear()
      nav(`/hvala/${r.number}`)
    } catch { setErr(t.errServer); setBusy(false) }
  }
  const field = (k, type = 'text', auto) => (
    <label className={`fld ${bad[k] ? 'fld--bad' : ''} fld--${k}`}>
      <span>{t[k]}</span>
      <input type={type} value={f[k] || ''} autoComplete={auto} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </label>
  )

  return (
    <section className="wrap cart">
      <h1 className="h2">{t.cart}</h1>
      <div className="cart__grid">
        <ul className="cart__list">
          {cart.items.map((i) => {
            const k = itemKey(i)
            return (
              <li key={k} className="ci">
                <Link to={`/p/${i.slug}?g=${i.garment}&c=${i.color}`} className="ci__art"><PrintPhoto photo={productPhoto(i.garment, i.color, true)} line1={i.line1} line2={i.line2} tech={i.tech} /></Link>
                <div className="ci__body">
                  <p className="ci__title">{i.line1} {i.line2}</p>
                  <p className="ci__sub">{t[i.garment]}, {t[i.color].toLowerCase()}, {i.size}, {t[i.tech].toLowerCase()}</p>
                  <div className="ci__row">
                    <div className="qty qty--sm">
                      <button onClick={() => cart.setQty(k, i.qty - 1)} aria-label="−">−</button><span>{i.qty}</span><button onClick={() => cart.setQty(k, i.qty + 1)} aria-label="+">+</button>
                    </div>
                    <span className="ci__price">{rsd(unitPrice(s, i.garment, i.tech) * i.qty)}</span>
                  </div>
                  <button className="ci__rm" onClick={() => cart.remove(k)}>{t.remove}</button>
                </div>
              </li>
            )
          })}
        </ul>

        <form className="co" onSubmit={submit} noValidate>
          <h2 className="co__h">{t.checkout}</h2>
          {field('name', 'text', 'name')}
          {field('phone', 'tel', 'tel')}
          <div className="fld-row">{field('city', 'text', 'address-level2')}{field('postal', 'text', 'postal-code')}</div>
          {field('address', 'text', 'street-address')}
          <label className="fld"><span>{t.note}</span><textarea rows="2" value={f.note || ''} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
          <dl className="sum">
            <div><dt>{t.subtotal}</dt><dd>{rsd(subtotal)}</dd></div>
            <div><dt>{t.delivery}</dt><dd>{delivery ? rsd(delivery) : t.free}</dd></div>
            <div className="sum__total"><dt>{t.total}</dt><dd>{rsd(subtotal + delivery)}</dd></div>
          </dl>
          {s && delivery > 0 && <p className="co__note">{t.freeFrom(rsd(s.free_delivery_from))}</p>}
          <p className="co__note">{t.payCod}</p>
          {err && <p className="co__err" role="alert">{err}</p>}
          <button className="btn btn--pist co__btn" disabled={busy}>{busy ? <Loader small label={t.placing} /> : t.placeOrder}</button>
        </form>
      </div>
    </section>
  )
}
