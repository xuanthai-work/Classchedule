import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import RenterModal from '../components/RenterModal'
import { computeAmount } from '../lib/bookings'
import { fmtVND, fmtShort } from '../lib/money'

// Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu (gõ "co" cũng ra "Cô")
const noAccent = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()

export default function Renters() {
  const { renters, bookings, caTypes, rooms, priceMap, getPrice } = useData()
  const [modal, setModal] = useState(null)
  const [q, setQ] = useState('')

  const stats = useMemo(() => {
    const map = {}
    for (const r of renters) map[r.id] = { count: 0, total: 0 }
    for (const b of bookings) {
      if (!map[b.renter_id]) continue
      map[b.renter_id].count++
      map[b.renter_id].total += computeAmount(b, priceMap)
    }
    return map
  }, [renters, bookings, priceMap])

  // Tóm tắt giá theo loại ca (nếu khác nhau theo phòng thì hiện khoảng min–max)
  function priceSummary(renterId) {
    const parts = []
    for (const ct of caTypes) {
      const ps = rooms.map((rm) => getPrice(renterId, ct.id, rm.id)).filter((v) => v > 0)
      if (!ps.length) continue
      const mn = Math.min(...ps)
      const mx = Math.max(...ps)
      parts.push(`${ct.name}: ${mn === mx ? fmtShort(mn) : fmtShort(mn) + '–' + fmtShort(mx)}`)
    }
    return parts.join(' · ')
  }

  const kw = noAccent(q.trim())
  const filtered = renters.filter((r) => noAccent(r.name).includes(kw))

  return (
    <div className="page renters">
      <div className="page-head">
        <h1>Người thuê</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({})}>＋ Thêm người thuê</button>
      </div>

      <input className="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên (không cần dấu)…" />

      {filtered.length === 0 ? (
        <div className="empty">Không có người thuê phù hợp.</div>
      ) : (
        <div className="renter-list">
          {filtered.map((r) => {
            const s = stats[r.id] || { count: 0, total: 0 }
            const priceStr = priceSummary(r.id)
            return (
              <button key={r.id} className="renter-card" onClick={() => setModal({ renter: r })}>
                <span className="renter-dot" style={{ background: r.color }} />
                <div className="renter-main">
                  <div className="renter-name">{r.name}</div>
                  <div className="renter-sub">
                    {r.phone && <span>📞 {r.phone}</span>}
                    {priceStr && <span className="renter-price">{priceStr}</span>}
                    {r.note && <span className="renter-note">{r.note}</span>}
                    {!r.phone && !priceStr && !r.note && <span className="renter-empty">Chưa có giá — bấm để thêm</span>}
                  </div>
                </div>
                <div className="renter-stats">
                  <div className="rs-total">{fmtVND(s.total)}</div>
                  <div className="rs-count">{s.count} buổi</div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {modal && <RenterModal renter={modal.renter} onClose={() => setModal(null)} />}
    </div>
  )
}
