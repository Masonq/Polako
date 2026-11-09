import { useMemo, useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useT, rsd } from '../i18n'
import { useCart, unitPrice } from '../cart'
import PrintPhoto from '../components/PrintPhoto'
import { Print, printLines } from '../components/PrintPhoto'
import { productPhoto, HERO, LOOK } from '../components/photos'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import Sheet from '../components/Sheet'
import FavButton from '../components/FavButton'
import Logo from '../components/Logo'
import { Seg, Swatches, Sizes, GARMENTS, COLORS, SendIcon } from '../components/Picker'
import { sharePhrase } from '../components/share'

const RAIL_GARMENTS = ['hudi', 'duks', 'majica']

export default function Home({ catalog, err, retry }) {
  const { t } = useT()
  const [toast, setToast] = useState('')
  const phrases = catalog?.phrases || []
  const featured = phrases.find((p) => p.featured) || phrases[0]
  const s = catalog?.settings

  if (!catalog) {
    return <section className="wrap empty">{err ? <><p>{t.errServer}</p><button className="btn btn--pist" onClick={retry}>OK</button></> : <Loader label={t.loading} />}</section>
  }

  return (
    <>
      {featured && <Hero p={featured} s={s} toast={setToast} />}
      <Rail phrases={phrases.slice(0, 10)} s={s} toast={setToast} />
      <Statement />
      <Look phrases={phrases} s={s} toast={setToast} />
      <Catalog phrases={phrases} s={s} toast={setToast} />
      <Toast msg={toast} onDone={() => setToast('')} />
    </>
  )
}

function Hero({ p, s, toast }) {
  const { t } = useT()
  return (
    <section className="hero">
      <div className="hero__photo">
        <PrintPhoto photo={HERO} line1={p.line1} line2={p.line2} eager alt={`${p.line1} ${p.line2}`} />
      </div>
      <div className="hero__panel glass">
        <p className="hero__kicker">{t.phraseOfDay}</p>
        <h1 className="hero__phrase"><span>{p.line1}</span><span>{p.line2}</span></h1>
        <p className="hero__sub">{t.heroSub}</p>
        <div className="hero__cta">
          <Link to={`/p/${p.slug}?g=hudi&c=zalfija`} className="btn btn--pist">{t.choose}<span className="btn__price">{t.from} {rsd(s.garments.majica.price)}</span></Link>
          <button className="roundbtn" onClick={() => sharePhrase(p, t, toast)} aria-label={t.shareThis} title={t.shareThis}><SendIcon /></button>
        </div>
      </div>
    </section>
  )
}

function Rail({ phrases, s, toast }) {
  const { t } = useT()
  const ref = useRef(null)
  const [idx, setIdx] = useState(0)
  const items = phrases.map((p, i) => ({ p, g: RAIL_GARMENTS[i % 3], c: COLORS[(i + Math.floor(i / 3)) % 4] }))
  const onScroll = () => {
    const el = ref.current; if (!el) return
    const w = el.firstElementChild?.getBoundingClientRect().width || 1
    setIdx(Math.round(el.scrollLeft / (w + 14)))
  }
  const go = (d) => { const el = ref.current; const w = el.firstElementChild.getBoundingClientRect().width + 14; el.scrollBy({ left: d * w, behavior: 'smooth' }) }
  return (
    <section className="rail" aria-label={t.rail}>
      <div className="wrap rail__head">
        <h2 className="h2">{t.rail}</h2>
        <div className="rail__nav">
          <button className="roundbtn roundbtn--sm" onClick={() => go(-1)} aria-label="‹"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <button className="roundbtn roundbtn--sm" onClick={() => go(1)} aria-label="›"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
      </div>
      <div className="rail__bar" aria-hidden="true" />
      <ul className="rail__track" ref={ref} onScroll={onScroll}>
        {items.map(({ p, g, c }) => (
          <li key={p.id} className="rail__item">
            <Link to={`/p/${p.slug}?g=${g}&c=${c}`} className="rail__link">
              <PrintPhoto photo={productPhoto(g, c, true)} line1={p.line1} line2={p.line2} className="rail__photo" alt={`${p.line1} ${p.line2}`} />
              <span className="tag"><span className="tag__price">{rsd(s.garments[g].price)}</span><span className="tag__g">{t[g]}</span></span>
            </Link>
            <FavButton item={{ slug: p.slug, garment: g, color: c }} toast={toast} className="rail__fav" />
          </li>
        ))}
      </ul>
      <div className="dots" aria-hidden="true">{items.map((_, i) => <i key={i} className={i === idx ? 'on' : ''} />)}</div>
    </section>
  )
}

function Statement() {
  const { t } = useT()
  return (
    <section className="stmt wrap">
      <p className="stmt__big"><span>{t.stmt1}</span><span>{t.stmt2}</span></p>
      <div className="stmt__side">
        <Logo color="var(--pistachio)" className="stmt__logo" />
        <p>{t.stmtText}</p>
      </div>
    </section>
  )
}

function Look({ phrases, s, toast }) {
  const { t } = useT()
  const cart = useCart()
  const pair = useMemo(() => {
    const a = phrases.find((p) => p.slug === 'kafa-pa-onda') || phrases[1]
    const b = phrases.find((p) => p.slug === 'nisam-lenj-stedim-energiju') || phrases[4]
    return [a, b].filter(Boolean)
  }, [phrases])
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(0)
  const [sizes, setSizes] = useState(['', ''])
  const [errs, setErrs] = useState([false, false])
  if (pair.length < 2) return null
  const items = LOOK.people.map((per, i) => ({ ...per, p: pair[i], price: unitPrice(s, per.garment, 'stampa') }))
  const total = items.reduce((a, b) => a + b.price, 0)
  const addOne = (i) => {
    if (!sizes[i]) { setErrs(errs.map((e, j) => (j === i ? true : e))); return false }
    const it = items[i]
    cart.add({ slug: it.p.slug, line1: it.p.line1, line2: it.p.line2, garment: it.garment, color: it.color, size: sizes[i], tech: 'stampa', qty: 1 })
    return true
  }
  const addAll = () => {
    const missing = sizes.map((x) => !x)
    if (missing.some(Boolean)) { setErrs(missing); return }
    addOne(0); addOne(1); setOpen(false); toast(t.lookAdded)
  }
  return (
    <section className="look wrap" aria-label={t.look}>
      <div className="look__text">
        <h2 className="h2">{t.look}</h2>
        <p className="lead">{t.lookSub}</p>
      </div>
      <div className="look__stage">
        <div className="pphoto look__photo">
          <img src={LOOK.src} alt="" loading="lazy" decoding="async" />
          {items.map((it, i) => <Print key={i} box={it.box} color={it.color} lines={printLines(it.p.line1, it.p.line2)} />)}
          {items.map((it, i) => (
            <button key={i} className="hotspot" style={{ left: `${it.dot.x * 100}%`, top: `${it.dot.y * 100}%` }} onClick={() => { setFocus(i); setOpen(true) }} aria-label={`${it.p.line1} ${it.p.line2}`}>
              <span>{i + 1}</span>
            </button>
          ))}
        </div>
        <button className="btn btn--pist look__all" onClick={() => setOpen(true)}>{t.addLook}<span className="btn__price">{rsd(total)}</span></button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={t.inLook}>
        <ul className="lk">
          {items.map((it, i) => (
            <li key={i} className={`lk__i ${focus === i ? 'lk__i--focus' : ''}`}>
              <Link to={`/p/${it.p.slug}?g=${it.garment}&c=${it.color}`} className="lk__art"><PrintPhoto photo={productPhoto(it.garment, it.color, true)} line1={it.p.line1} line2={it.p.line2} /></Link>
              <div className="lk__body">
                <p className="lk__n">{i + 1}</p>
                <p className="lk__title">{it.p.line1} {it.p.line2}</p>
                <p className="lk__sub">{t[it.garment]}, {t[it.color].toLowerCase()}, {rsd(it.price)}</p>
                <Sizes small value={sizes[i]} error={errs[i] && !sizes[i]} onChange={(v) => { setSizes(sizes.map((x, j) => (j === i ? v : x))); setErrs(errs.map((e, j) => (j === i ? false : e))) }} />
                {errs[i] && !sizes[i] && <p className="opt__err">{t.pickSize}</p>}
              </div>
              <button className="lk__add" onClick={() => { if (addOne(i)) toast(t.added) }} aria-label={t.addToCart}>+</button>
            </li>
          ))}
        </ul>
        <button className="btn btn--pist sheet__cta" onClick={addAll}>{t.addLook}<span className="btn__price">{rsd(total)}</span></button>
      </Sheet>
    </section>
  )
}

function Catalog({ phrases, s, toast }) {
  const { t } = useT()
  const [coll, setColl] = useState('all')
  const [garment, setGarment] = useState('hudi')
  const [color, setColor] = useState('ekru')
  const list = phrases.filter((p) => coll === 'all' || p.lang === coll)
  return (
    <section className="wrap cat" id="katalog">
      <div className="cat__head">
        <h2 className="h2">{t.catalog}</h2>
        <Seg label={t.catalog} value={coll} onChange={setColl} options={['all', 'sr', 'ru']} render={(o) => (o === 'all' ? t.all : o === 'sr' ? t.collSr : t.collRu)} />
      </div>
      <div className="cat__view">
        <Seg label={t.garment} value={garment} onChange={setGarment} options={GARMENTS} render={(o) => t[o]} />
        <Swatches value={color} onChange={setColor} />
      </div>
      <ul className="grid">
        {list.map((p) => (
          <li key={p.id} className="card">
            <Link to={`/p/${p.slug}?g=${garment}&c=${color}`} className="card__link">
              <PrintPhoto photo={productPhoto(garment, color, true)} line1={p.line1} line2={p.line2} className="card__photo" alt={`${p.line1} ${p.line2}`} />
              <div className="card__meta">
                <p className="card__text">{p.line1} {p.line2}</p>
                <p className="card__price">{rsd(s.garments[garment].price)}</p>
              </div>
            </Link>
            <FavButton item={{ slug: p.slug, garment, color }} toast={toast} className="card__fav" />
          </li>
        ))}
      </ul>
    </section>
  )
}
