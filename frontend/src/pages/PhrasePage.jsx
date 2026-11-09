import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useT, rsd } from '../i18n'
import { useCart, unitPrice } from '../cart'
import { api } from '../api'
import Garment from '../components/Garment'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import { Seg, Swatches, GARMENTS, COLORS, SIZES } from '../components/Picker'
import { sharePhrase } from '../components/share'

export default function PhrasePage({ catalog }) {
  const { slug } = useParams()
  const [qs] = useSearchParams()
  const { t } = useT()
  const cart = useCart()
  const [p, setP] = useState(null)
  const [missing, setMissing] = useState(false)
  const [garment, setGarment] = useState(GARMENTS.includes(qs.get('g')) ? qs.get('g') : 'majica')
  const [color, setColor] = useState(COLORS.includes(qs.get('c')) ? qs.get('c') : 'ekru')
  const [tech, setTech] = useState('stampa')
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [sizeErr, setSizeErr] = useState(false)
  const [toast, setToast] = useState('')
  const [showCartLink, setShowCartLink] = useState(false)

  useEffect(() => {
    setP(null); setMissing(false)
    const fromCat = catalog?.phrases.find((x) => x.slug === slug)
    if (fromCat) { setP(fromCat); return }
    api.phrase(slug).then(setP).catch(() => setMissing(true))
  }, [slug, catalog])

  useEffect(() => { if (p) document.title = `${p.line1} ${p.line2} — polako.` ; return () => { document.title = 'polako. — majice i duksevi sa frazama' } }, [p])

  const more = useMemo(() => {
    if (!catalog || !p) return []
    return catalog.phrases.filter((x) => x.slug !== p.slug && x.lang === p.lang).slice(0, 4)
  }, [catalog, p])

  if (missing) return <section className="wrap empty"><p>{t.notFound}</p><Link className="btn" to="/">{t.backHome}</Link></section>
  if (!p) return <section className="wrap empty"><Loader label={t.loading} /></section>

  const unit = unitPrice(catalog?.settings, garment, tech)
  const add = () => {
    if (!size) { setSizeErr(true); return }
    cart.add({ slug: p.slug, line1: p.line1, line2: p.line2, garment, color, size, tech, qty })
    setShowCartLink(true); setToast(t.added)
  }

  return (
    <>
      <section className="wrap pp">
        <div className={`pp__art card__art--${color}`}>
          <Garment type={garment} color={color} tech={tech} line1={p.line1} line2={p.line2} />
        </div>
        <div className="pp__opts">
          <h1 className="pp__title"><span>{p.line1}</span><span>{p.line2}</span></h1>
          <p className="pp__price">{catalog ? rsd(unit) : ' '}</p>

          <div className="opt"><p className="opt__l">{t.garment}</p>
            <Seg label={t.garment} value={garment} onChange={setGarment} options={GARMENTS} render={(o) => t[o]} /></div>
          <div className="opt"><p className="opt__l"><span>{t.color}: <b>{t[color]}</b></span></p>
            <Swatches value={color} onChange={setColor} /></div>
          <div className="opt"><p className="opt__l">{t.tech}</p>
            <Seg label={t.tech} value={tech} onChange={setTech} options={['stampa', 'vez']} render={(o) => t[o]} />
            <p className="opt__note">{t.techNote[tech]}{tech === 'vez' && catalog ? ` +${rsd(catalog.settings.embroidery_extra)}` : ''}</p></div>
          <div className="opt"><p className="opt__l"><span>{t.size}</span> <Link to="/velicine" className="opt__link">{t.sizeGuide}</Link></p>
            <div className={`sizes ${sizeErr && !size ? 'sizes--err' : ''}`}>
              {SIZES.map((s) => <button key={s} className={size === s ? 'on' : ''} aria-pressed={size === s} onClick={() => { setSize(s); setSizeErr(false) }}>{s}</button>)}
            </div>
            {sizeErr && !size && <p className="opt__err">{t.pickSize}</p>}</div>

          <div className="pp__buy">
            <div className="qty" aria-label={t.qty}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="−">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="+">+</button>
            </div>
            <button className="btn btn--dark pp__add" onClick={add}>{t.addToCart}</button>
          </div>
          <button className="btn btn--line pp__share" onClick={() => sharePhrase(p, t, setToast)}>{t.shareThis}</button>
        </div>
      </section>

      {more.length > 0 && (
        <section className="wrap more">
          <h2 className="h2">{t.more}</h2>
          <ul className="grid grid--4">
            {more.map((x) => (
              <li key={x.id} className="card">
                <Link to={`/p/${x.slug}?g=${garment}&c=${color}`} className="card__link">
                  <div className={`card__art card__art--${color}`}><Garment type={garment} color={color} line1={x.line1} line2={x.line2} /></div>
                  <div className="card__meta"><p className="card__text">{x.line1} {x.line2}</p></div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Toast msg={toast} onDone={() => { setToast(''); setShowCartLink(false) }}>
        {showCartLink && <Link to="/korpa" className="toast__a">{t.cart}</Link>}
      </Toast>
    </>
  )
}
