import { useT } from '../i18n'
const DATA = {
  majica: { XS: [47, 66, 19], S: [50, 69, 20], M: [53, 72, 21], L: [56, 74, 22], XL: [59, 76, 23], XXL: [62, 78, 24] },
  duks: { XS: [52, 64, 60], S: [55, 66, 61], M: [58, 68, 62], L: [61, 70, 63], XL: [64, 72, 64], XXL: [67, 74, 65] },
  hudi: { XS: [52, 65, 60], S: [55, 67, 61], M: [58, 69, 62], L: [61, 71, 63], XL: [64, 73, 64], XXL: [67, 75, 65] },
}
export default function Sizes() {
  const { t } = useT()
  return (
    <section className="wrap sizes-page">
      <h1 className="h2">{t.sizesTitle}</h1>
      <p className="lead">{t.sizesNote}</p>
      {Object.entries(DATA).map(([g, rows]) => (
        <div key={g} className="tbl">
          <h2 className="tbl__h">{t[g]}</h2>
          <div className="tbl__scroll">
            <table>
              <thead><tr><th></th>{Object.keys(rows).map((s) => <th key={s}>{s}</th>)}</tr></thead>
              <tbody>
                {[t.width, t.length, t.sleeve].map((label, i) => (
                  <tr key={label}><th>{label}</th>{Object.values(rows).map((v, j) => <td key={j}>{v[i]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  )
}
