import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useT, rsd } from '../i18n'
import Garment from '../components/Garment'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import { Seg, Swatches, GARMENTS } from '../components/Picker'
import { sharePhrase } from '../components/share'

export default function Home({ catalog, err, retry }) {
  const { t, lang } = useT()
  const [coll, setColl] = useState('all')
  const [garment, setGarment] = useState('majica')
  const [color, setColor] = useState('ekru')
  const [toast, setToast] = useState('')

  const phrases = catalog?.phrases || []
  const featured = phrases.find((p) => p.featured) || phrases[0]
  const list = useMemo(() => phrases.filter((p) => coll === 'all' || p.lang === coll), [phrases, coll])
  const price = catalog ? catalog.settings.garments[garment].price : 0

  return (
    <>
      <section className="hero">
        <div className="hero__in">
          {featured ? (
            <>
              <div className="hero__copy">
                <p className="hero__kicker">{t.phraseOfDay}</p>
                <h1 className="hero__phrase"><span>{featured.line1}</span><span>{featured.line2}</span></h1>
                <p className="hero__sub">{t.heroSub}</p>
                <div className="hero__cta">
                  <Link to={`/p/${featured.slug}`} className="btn btn--pist">{t.choose}</Link>
                  <button className="btn btn--ghost" onClick={() => sharePhrase(featured, t, setToast)}>{t.shareThis}</button>
                </div>
              </div>
              <Link to={`/p/${featured.slug}`} className="hero__art" aria-label={`${featured.line1} ${featured.line2}`}>
                <Garment type="duks" color="ekru" line1={featured.line1} line2={featured.line2} />
              </Link>
            </>
          ) : err ? (
            <div className="hero__copy"><p className="hero__sub">{t.errServer}</p><button className="btn btn--pist" onClick={retry}>OK</button></div>
          ) : (
            <div className="hero__load"><Loader label={t.loading} /></div>
          )}
        </div>
      </section>

      <section className="wrap cat" id="katalog">
        <div className="cat__head">
          <h2 className="h2">{t.catalog}</h2>
          <Seg label={t.catalog} value={coll} onChange={setColl} options={['all', 'sr', 'ru']} render={(o) => (o === 'all' ? t.all : o === 'sr' ? t.collSr : t.collRu)} />
        </div>
        <div className="cat__view">
          <span className="cat__label">{t.viewAs}</span>
          <Seg label={t.garment} value={garment} onChange={setGarment} options={GARMENTS} render={(o) => t[o]} />
          <Swatches value={color} onChange={setColor} />
        </div>

        {!catalog ? (err ? null : <Loader label={t.loading} />) : (
          <ul className="grid">
            {list.map((p) => (
              <li key={p.id} className="card">
                <Link to={`/p/${p.slug}?g=${garment}&c=${color}`} className="card__link">
                  <div className={`card__art card__art--${color}`}>
                    <Garment type={garment} color={color} line1={p.line1} line2={p.line2} />
                  </div>
                  <div className="card__meta">
                    <p className="card__text">{p.line1} {p.line2}</p>
                    <p className="card__price">{t.from} {rsd(price)}</p>
                  </div>
                </Link>
                <button className="card__share" aria-label={t.shareThis} title={t.shareThis} onClick={() => sharePhrase(p, t, setToast)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Toast msg={toast} onDone={() => setToast('')} />
    </>
  )
}
