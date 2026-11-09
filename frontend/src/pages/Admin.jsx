import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { admin } from '../api'
import { rsd } from '../i18n'
import Logo from '../components/Logo'
import Loader from '../components/Loader'

const ST = { new: 'Новый', confirmed: 'Подтверждён', production: 'В производстве', shipped: 'Отправлен', delivered: 'Доставлен', cancelled: 'Отменён' }
const G = { majica: 'футболка', duks: 'свитшот', hudi: 'худи' }
const C = { ekru: 'экрю', grafit: 'графит', zalfija: 'шалфей', pesak: 'песок' }
const T = { stampa: 'печать', vez: 'вышивка' }

export default function Admin() {
  const [ok, setOk] = useState(!!localStorage.getItem('polako_admin'))
  const [tab, setTab] = useState('orders')
  const out = () => { localStorage.removeItem('polako_admin'); setOk(false) }
  useEffect(() => { document.title = 'Админка — polako.' }, [])
  if (!ok) return <LoginBox onOk={() => setOk(true)} />
  return (
    <div className="adm">
      <header className="adm__top">
        <Link to="/" className="adm__logo"><Logo color="var(--pistachio)" /></Link>
        <nav className="seg seg--dark">
          {[['orders', 'Заказы'], ['phrases', 'Фразы'], ['prices', 'Цены']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
        </nav>
        <button className="adm__out" onClick={out} aria-label="Выйти" title="Выйти"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </header>
      <main className="adm__main">
        {tab === 'orders' && <Orders onAuth={out} />}
        {tab === 'phrases' && <Phrases onAuth={out} />}
        {tab === 'prices' && <Prices onAuth={out} />}
      </main>
    </div>
  )
}

function useLoad(fn, onAuth, deps = []) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const reload = () => { setErr(''); fn().then(setData).catch((e) => (e.status === 401 ? onAuth() : setErr('Не загрузилось. Проверь соединение и обнови вкладку.'))) }
  useEffect(reload, deps)
  return [data, reload, err, setData]
}

function LoginBox({ onOk }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const go = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { const r = await admin.login(pw); localStorage.setItem('polako_admin', r.token); onOk() } catch { setErr('Неверный пароль'); setBusy(false) }
  }
  return (
    <div className="adm adm--login">
      <form className="adm__login" onSubmit={go}>
        <Logo color="var(--pistachio)" className="adm__login-logo" />
        <label className="fld fld--dark"><span>Пароль</span><input type="password" value={pw} autoFocus onChange={(e) => setPw(e.target.value)} /></label>
        {err && <p className="co__err">{err}</p>}
        <button className="btn btn--pist" disabled={busy || !pw}>{busy ? 'Входим…' : 'Войти'}</button>
      </form>
    </div>
  )
}

function Orders({ onAuth }) {
  const [filter, setFilter] = useState('')
  const [rows, reload, err, setRows] = useLoad(() => admin.orders(filter), onAuth, [filter])
  const change = async (o, status) => {
    setRows(rows.map((x) => (x.id === o.id ? { ...x, status } : x)))
    try { await admin.status(o.id, status) } catch { reload() }
  }
  return (
    <section>
      <div className="adm__bar">
        <h1 className="adm__h">Заказы</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="adm__sel">
          <option value="">Все статусы</option>
          {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {err && <p className="co__err">{err}</p>}
      {!rows ? <Loader label="Загружаем" /> : rows.length === 0 ? <p className="adm__empty">Заказов пока нет. Когда кто-то оформит заказ на сайте, он появится здесь и придёт в Telegram.</p> : (
        <ul className="ord">
          {rows.map((o) => (
            <li key={o.id} className={`ord__i ord__i--${o.status}`}>
              <div className="ord__head">
                <b>{o.number}</b>
                <span className="ord__date">{new Date(o.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                <select value={o.status} onChange={(e) => change(o, e.target.value)} className="adm__sel">
                  {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <p className="ord__who">{o.name}, <a href={`tel:${o.phone}`}>{o.phone}</a></p>
              <p className="ord__addr">{o.city}{o.postal ? `, ${o.postal}` : ''}, {o.address}</p>
              {o.note && <p className="ord__note">{o.note}</p>}
              <ul className="ord__items">
                {o.items.map((i, n) => <li key={n}>«{i.line1} {i.line2}» — {G[i.garment]}, {C[i.color]}, {i.size}, {T[i.tech]} × {i.qty}</li>)}
              </ul>
              <p className="ord__total">{rsd(o.total)}, оплата при получении</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const EMPTY = { lang: 'sr', line1: '', line2: '', active: true, featured: false, sort: 0 }

function Phrases({ onAuth }) {
  const [rows, reload, err] = useLoad(() => admin.phrases(), onAuth)
  const [edit, setEdit] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('')
    try { edit.id ? await admin.update(edit.id, edit) : await admin.create(edit); setEdit(null); reload() }
    catch (x) { x.status === 401 ? onAuth() : setMsg('Не сохранилось: заполни первую строку (до 60 символов).') }
    setBusy(false)
  }
  const del = async (p) => { if (confirm(`Удалить «${p.line1} ${p.line2}»?`)) { await admin.remove(p.id); reload() } }
  return (
    <section>
      <div className="adm__bar">
        <h1 className="adm__h">Фразы</h1>
        <button className="btn btn--pist btn--sm" onClick={() => setEdit({ ...EMPTY, sort: (rows?.length || 0) + 1 })}>Добавить фразу</button>
      </div>
      {err && <p className="co__err">{err}</p>}
      {edit && (
        <form className="pf" onSubmit={save}>
          <div className="seg seg--dark">
            {[['sr', 'Сербская'], ['ru', 'Русская']].map(([k, l]) => <button type="button" key={k} className={edit.lang === k ? 'on' : ''} onClick={() => setEdit({ ...edit, lang: k })}>{l}</button>)}
          </div>
          <label className="fld fld--dark"><span>Первая строка</span><input maxLength={60} value={edit.line1} onChange={(e) => setEdit({ ...edit, line1: e.target.value })} /></label>
          <label className="fld fld--dark"><span>Вторая строка (удар)</span><input maxLength={60} value={edit.line2} onChange={(e) => setEdit({ ...edit, line2: e.target.value })} /></label>
          <div className="pf__row">
            <label className="chk"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Показывать на сайте</label>
            <label className="chk"><input type="checkbox" checked={edit.featured} onChange={(e) => setEdit({ ...edit, featured: e.target.checked })} /> Фраза дня</label>
            <label className="fld fld--dark fld--sort"><span>Порядок</span><input type="number" value={edit.sort} onChange={(e) => setEdit({ ...edit, sort: +e.target.value || 0 })} /></label>
          </div>
          {msg && <p className="co__err">{msg}</p>}
          <div className="pf__row">
            <button className="btn btn--pist btn--sm" disabled={busy || !edit.line1.trim()}>{edit.id ? 'Сохранить' : 'Добавить'}</button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEdit(null)}>Отмена</button>
          </div>
        </form>
      )}
      {!rows ? <Loader label="Загружаем" /> : (
        <ul className="pl">
          {rows.map((p) => (
            <li key={p.id} className={`pl__i ${p.active ? '' : 'pl__i--off'}`}>
              <span className="pl__lang">{p.lang.toUpperCase()}</span>
              <span className="pl__text">{p.line1} <i>{p.line2}</i></span>
              <span className="pl__meta">{p.featured ? 'фраза дня, ' : ''}{p.shares} отправок</span>
              <span className="pl__act">
                <button onClick={() => setEdit(p)}>Изменить</button>
                <button onClick={() => del(p)}>Удалить</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Prices({ onAuth }) {
  const [s, , err, setS] = useLoad(() => admin.settings(), onAuth)
  const [msg, setMsg] = useState('')
  if (!s) return err ? <p className="co__err">{err}</p> : <Loader label="Загружаем" />
  const num = (v) => Math.max(0, parseInt(v || '0', 10) || 0)
  const save = async (e) => {
    e.preventDefault(); setMsg('')
    try { setS(await admin.saveSettings(s)); setMsg('Сохранено') } catch (x) { x.status === 401 ? onAuth() : setMsg('Не сохранилось') }
  }
  return (
    <form className="pf pf--prices" onSubmit={save}>
      <h1 className="adm__h">Цены, RSD</h1>
      {Object.keys(G).map((g) => (
        <label key={g} className="fld fld--dark"><span>{G[g][0].toUpperCase() + G[g].slice(1)}</span>
          <input inputMode="numeric" value={s.garments[g].price} onChange={(e) => setS({ ...s, garments: { ...s.garments, [g]: { price: num(e.target.value) } } })} /></label>
      ))}
      <label className="fld fld--dark"><span>Доплата за вышивку</span><input inputMode="numeric" value={s.embroidery_extra} onChange={(e) => setS({ ...s, embroidery_extra: num(e.target.value) })} /></label>
      <label className="fld fld--dark"><span>Доставка</span><input inputMode="numeric" value={s.delivery} onChange={(e) => setS({ ...s, delivery: num(e.target.value) })} /></label>
      <label className="fld fld--dark"><span>Бесплатная доставка от</span><input inputMode="numeric" value={s.free_delivery_from} onChange={(e) => setS({ ...s, free_delivery_from: num(e.target.value) })} /></label>
      <button className="btn btn--pist btn--sm">Сохранить цены</button>
      {msg && <p className="pf__msg">{msg}</p>}
    </form>
  )
}
