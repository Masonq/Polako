import { Link } from 'react-router-dom'
import { useT, rsd } from '../i18n'
import { useFav } from '../cart'
import PrintPhoto from '../components/PrintPhoto'
import { productPhoto } from '../components/photos'
import FavButton from '../components/FavButton'
export default function Favorites({ catalog }) {
  const { t } = useT()
  const fav = useFav()
  const list = fav.items.map((f) => ({ f, p: catalog?.phrases.find((x) => x.slug === f.slug) })).filter((x) => x.p)
  return (
    <section className="wrap favs">
      <h1 className="h2">{t.fav}</h1>
      {!list.length ? <div className="empty empty--inline"><p>{t.favEmpty}</p><Link className="btn btn--pist" to="/#katalog">{t.catalog}</Link></div> : (
        <ul className="grid">
          {list.map(({ f, p }) => (
            <li key={p.slug} className="card">
              <Link to={`/p/${p.slug}?g=${f.garment}&c=${f.color}`} className="card__link">
                <PrintPhoto photo={productPhoto(f.garment, f.color, true)} line1={p.line1} line2={p.line2} className="card__photo" />
                <div className="card__meta"><p className="card__text">{p.line1} {p.line2}</p><p className="card__price">{rsd(catalog.settings.garments[f.garment].price)}</p></div>
              </Link>
              <FavButton item={f} className="card__fav" />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
