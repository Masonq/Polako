import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useT, rsd } from '../i18n'
import { useCart, unitPrice } from '../cart'
import { api } from '../api'
import PrintPhoto from '../components/PrintPhoto'
import { productPhoto } from '../components/photos'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import FavButton from '../components/FavButton'
import { Seg, Swatches, Sizes, GARMENTS, COLORS, SendIcon } from '../components/Picker'
import { sharePhrase } from '../components/share'

export default function PhrasePage({ catalog }) {
  const { slug } = useParams()
  const [qs, setQs] = useSearchParams()
  const nav = useNavigate()
  const { t } = useT()
  const cart = useCart()
  const [p, setP] = useState(null)
  const [missing, setMissing] = useState(false)
  const garment = GARMENTS.includes(qs.get('g')) ? qs.get('g') : 'hudi'
  const color = COLORS.includes(qs.get('c')) ? qs.get('c') : 'ekru'
  const [tech, setTech] = useState('stampa')
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [sizeErr, setSizeErr] = useState(false)
  const [toast, setToast] = useState('')
  const [cartLink, setCartLink] = useState(false)
  const track = useRef(null)
  const sizeRef = useRef(null)

  const setG = (g) => setQs({ g, c: color }, { replace: true })
  const setC = (c) => {
    setQs({ g: garment, c }, { replace: true })
    const el = track.current
    if (el) el.scrollTo({ left: COLORS.indexOf(c) * el.clientWidth, behavior: 'smooth' })
  }

  useEffect(() => {
    setP(null); setMissing(false)
    const fromCat = catalog?.phrases.find((x) => x.slug === slug)
    if (fromCat) { setP(fromCat); return }
    api.phrase(slug).then(setP).catch(() => setMissing(true))
  }, [slug, catalog])

  useEffect(() => { if (p) document.title = `${p.line1} ${p.line2} — polako.`; return () => { document.title = 'polako. — majice i duksevi sa frazama' } }, [p])

  // keep carousel in sync with chosen colour
  useEffect(() => {
    const el = track.current
    if (el) el.scrollTo({ left: COLORS.indexOf(color) * el.clientWidth })
  }, [p, garment])

  const onSwipe = () => {
    const el = track.current; if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (COLORS[i] && COLORS[i] !== color) setQs({ g: garment, c: COLORS[i] }, { replace: true })
  }

  const more = useMemo(() => (catalog && p ? catalog.phrases.filter((x) => x.slug !== p.slug && x.lang === p.lang).slice(0, 4) : []), [catalog, p])

  if (missing) return <section className="wrap empty"><p>{t.notFound}</p><Link className="btn btn--pist" to="/">{t.backHome}</Link></section>
  if (!p) return <section className="wrap empty"><Loader label={t.loading} /></section>

  const unit = unitPrice(catalog?.settings, garment, tech)
  const add = () => {
    if (!size) { setSizeErr(true); sizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    cart.add({ slug: p.slug, line1: p.line1, line2: p.line2, garment, color, size, tech, qty })
    setCartLink(true); setToast(t.added)
  }

  return (
    <>
      <section className="pp">
        <div className="pp__media">
          <div className="pp__track" ref={track} onScroll={onSwipe}>
            {COLORS.map((c) => (
              <PrintPhoto key={c} photo={productPhoto(garment, c)} line1={p.line1} line2={p.line2} tech={tech} className="pp__slide" eager={c === color} alt={`${p.line1} ${p.line2}, ${t[garment]}, ${t[c]}`} />
            ))}
          </div>
          <button className="glassbtn pp__back" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))} aria-label={t.back}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <FavButton item={{ slug: p.slug, garment, color }} toast={setToast} className="pp__fav" />
          <div className="dots dots--photo" aria-hidden="true">{COLORS.map((c) => <i key={c} className={c === color ? 'on' : ''} />)}</div>
        </div>

        <div className="pp__panel glass">
          <h1 className="pp__title"><span>{p.line1}</span><span>{p.line2}</span></h1>
          <p className="pp__price">{catalog ? rsd(unit) : ' '}</p>

          <div className="opt"><p className="opt__l">{t.garment}</p>
            <Seg label={t.garment} value={garment} onChange={setG} options={GARMENTS} render={(o) => t[o]} /></div>
          <div className="opt"><p className="opt__l"><span>{t.color}: <b>{t[color]}</b></span></p>
            <Swatches value={color} onChange={setC} /></div>
          <div className="opt"><p className="opt__l">{t.tech}</p>
            <Seg label={t.tech} value={tech} onChange={setTech} options={['stampa', 'vez']} render={(o) => t[o]} />
            <p className="opt__note">{t.techNote[tech]}{tech === 'vez' && catalog ? ` +${rsd(catalog.settings.embroidery_extra)}` : ''}</p></div>
          <div className="opt" ref={sizeRef}><p className="opt__l"><span>{t.size}</span><Link to="/velicine" className="opt__link">{t.sizeGuide}</Link></p>
            <Sizes value={size} error={sizeErr && !size} onChange={(v) => { setSize(v); setSizeErr(false) }} />
            {sizeErr && !size && <p className="opt__err">{t.pickSize}</p>}</div>
          <div className="buybar buybar--inline">
            <div className="qty" aria-label={t.qty}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="−">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="+">+</button>
            </div>
            <button className="btn btn--pist buybar__add" onClick={add}>{t.addToCart}<span className="btn__price">{rsd(unit * qty)}</span></button>
            <button className="roundbtn" onClick={() => sharePhrase(p, t, setToast)} aria-label={t.shareThis} title={t.shareThis}><SendIcon /></button>
          </div>
        </div>
      </section>

      <div className="buybar buybar--fixed glass">
        <button className="btn btn--pist buybar__add" onClick={add}>{t.addToCart}<span className="btn__price">{rsd(unit * qty)}</span></button>
        <button className="roundbtn" onClick={() => sharePhrase(p, t, setToast)} aria-label={t.shareThis} title={t.shareThis}><SendIcon /></button>
      </div>

      {more.length > 0 && (
        <section className="wrap more">
          <h2 className="h2">{t.more}</h2>
          <ul className="grid grid--4">
            {more.map((x) => (
              <li key={x.id} className="card">
                <Link to={`/p/${x.slug}?g=${garment}&c=${color}`} className="card__link">
                  <PrintPhoto photo={productPhoto(garment, color, true)} line1={x.line1} line2={x.line2} className="card__photo" />
                  <div className="card__meta"><p className="card__text">{x.line1} {x.line2}</p></div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="buybar-space" />
      <Toast msg={toast} onDone={() => { setToast(''); setCartLink(false) }}>
        {cartLink && <Link to="/korpa" className="toast__a">{t.cart}</Link>}
      </Toast>
    </>
  )
}
