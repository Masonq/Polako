import { Link, useParams } from 'react-router-dom'
import { useT } from '../i18n'
export default function Done() {
  const { number } = useParams()
  const { t } = useT()
  return (
    <section className="wrap empty done">
      <h1 className="h2">{t.thanks}</h1>
      <p>{t.thanksText(number)}</p>
      <Link className="btn btn--pist" to="/#katalog">{t.continue}</Link>
    </section>
  )
}
