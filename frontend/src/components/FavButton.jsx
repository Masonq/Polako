import { useFav } from '../cart'
import { useT } from '../i18n'
import { Heart } from './Picker'
export default function FavButton({ item, toast, className = '' }) {
  const fav = useFav()
  const { t } = useT()
  const on = fav.has(item.slug)
  return (
    <button type="button" className={`glassbtn ${on ? 'glassbtn--on' : ''} ${className}`} aria-pressed={on} aria-label={t.fav}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); fav.toggle(item); toast && toast(on ? t.unsaved : t.saved) }}>
      <Heart on={on} />
    </button>
  )
}
