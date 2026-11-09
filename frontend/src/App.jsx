import { useEffect, useMemo, useState, useRef } from 'react'
import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom'
import { DICT, LangCtx, useT } from './i18n'
import { CartCtx, KEY, load, itemKey } from './cart'
import { api } from './api'
import Logo from './components/Logo'
import Home from './pages/Home'
import PhrasePage from './pages/PhrasePage'
import CartPage from './pages/CartPage'
import Done from './pages/Done'
import Sizes from './pages/Sizes'
import Admin from './pages/Admin'

function Header({ count }) {
  const { t, lang, setLang } = useT()
  return (
    <header className="hdr">
      <div className="hdr__in">
        <Link to="/" className="hdr__logo" aria-label="polako. početna"><Logo mode="live" color="var(--pistachio)" /></Link>
        <nav className="hdr__nav">
          <NavLink to="/#katalog" className="hdr__link hide-sm">{t.catalog}</NavLink>
          <NavLink to="/velicine" className="hdr__link hide-sm">{t.sizes}</NavLink>
          <div className="lang" role="group" aria-label="Jezik">
            <button className={lang === 'sr' ? 'on' : ''} onClick={() => setLang('sr')}>SR</button>
            <button className={lang === 'ru' ? 'on' : ''} onClick={() => setLang('ru')}>RU</button>
          </div>
          <Link to="/korpa" className="cartbtn" aria-label={`${t.cart}: ${count}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z M9 8a3 3 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/></svg>
            {count > 0 && <span className="cartbtn__n">{count}</span>}
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  const { t } = useT()
  const ref = useRef(null)
  const [hit, setHit] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHit(true); io.disconnect() } }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <footer className={`ftr ${hit ? 'ftr--hit' : ''}`} ref={ref}>
      <div className="ftr__drop" aria-hidden="true"><span className="ftr__ball" /><span className="ftr__ring" /></div>
      <div className="ftr__in">
        <Logo gloss color="var(--pistachio)" className="ftr__logo" />
        <p className="ftr__line">{t.footer}</p>
        <nav className="ftr__nav">
          <Link to="/#katalog">{t.catalog}</Link>
          <Link to="/velicine">{t.sizes}</Link>
          <Link to="/korpa">{t.cart}</Link>
        </nav>
        <p className="ftr__copy">© {new Date().getFullYear()} polako.</p>
      </div>
    </footer>
  )
}

function ScrollTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) { setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 60) }
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  const [lang, setLangState] = useState(() => localStorage.getItem('polako_lang') || 'sr')
  const setLang = (l) => { setLangState(l); localStorage.setItem('polako_lang', l); document.documentElement.lang = l }
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const [items, setItems] = useState(load)
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)) }, [items])
  const [catalog, setCatalog] = useState(null)
  const [catErr, setCatErr] = useState(false)
  const loadCatalog = () => { setCatErr(false); api.catalog().then(setCatalog).catch(() => setCatErr(true)) }
  useEffect(loadCatalog, [])

  const cart = useMemo(() => ({
    items,
    add: (it) => setItems((xs) => {
      const k = itemKey(it), ex = xs.find((x) => itemKey(x) === k)
      return ex ? xs.map((x) => (itemKey(x) === k ? { ...x, qty: Math.min(20, x.qty + it.qty) } : x)) : [...xs, it]
    }),
    setQty: (k, q) => setItems((xs) => xs.map((x) => (itemKey(x) === k ? { ...x, qty: Math.max(1, Math.min(20, q)) } : x))),
    remove: (k) => setItems((xs) => xs.filter((x) => itemKey(x) !== k)),
    clear: () => setItems([]),
  }), [items])
  const count = items.reduce((a, b) => a + b.qty, 0)
  const isAdmin = useLocation().pathname.startsWith('/admin')

  return (
    <LangCtx.Provider value={{ lang, t: DICT[lang], setLang }}>
      <CartCtx.Provider value={cart}>
        <ScrollTop />
        {isAdmin ? <Admin /> : (
          <>
            <Header count={count} />
            <main>
              <Routes>
                <Route path="/" element={<Home catalog={catalog} err={catErr} retry={loadCatalog} />} />
                <Route path="/p/:slug" element={<PhrasePage catalog={catalog} />} />
                <Route path="/korpa" element={<CartPage catalog={catalog} />} />
                <Route path="/hvala/:number" element={<Done />} />
                <Route path="/velicine" element={<Sizes />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </>
        )}
      </CartCtx.Provider>
    </LangCtx.Provider>
  )
}

function NotFound() {
  const { t } = useT()
  return <section className="wrap empty"><p>{t.notFound}</p><Link className="btn" to="/">{t.backHome}</Link></section>
}
