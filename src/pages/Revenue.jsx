import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { pad2, fmtDayMonth, parseISODate, weekdayShort, fmtTime } from '../lib/date'
import { computeAmount } from '../lib/bookings'
import { readableText } from '../lib/constants'
import { fmtVND } from '../lib/money'

export default function Revenue() {
  const { bookings, caTypes, caTypesById, roomsById, rentersById, priceMap, setPaid, deleteBookings } = useData()
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [confirmClear, setConfirmClear] = useState(false)

  const prefix = `${ym.y}-${pad2(ym.m + 1)}`
  const monthBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.date.startsWith(prefix))
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.start_time.localeCompare(b.start_time))),
    [bookings, prefix],
  )

  const summary = useMemo(() => {
    let total = 0, collected = 0
    const byCa = {}
    const byRenter = {}
    for (const b of monthBookings) {
      const amt = computeAmount(b, priceMap)
      total += amt
      if (b.paid) collected += amt
      byCa[b.ca_type_id] = (byCa[b.ca_type_id] || 0) + amt
      byRenter[b.renter_id] = (byRenter[b.renter_id] || 0) + amt
    }
    return { total, collected, unpaid: total - collected, count: monthBookings.length, byCa, byRenter }
  }, [monthBookings, priceMap])

  const topRenters = Object.entries(summary.byRenter).sort((a, b) => b[1] - a[1])

  const paidInMonth = monthBookings.filter((b) => b.paid)
  function prevMonth() { setConfirmClear(false); setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 })) }
  function nextMonth() { setConfirmClear(false); setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 })) }
  async function clearPaid() {
    await deleteBookings(paidInMonth.map((b) => b.id))
    setConfirmClear(false)
  }

  return (
    <div className="page revenue">
      <div className="page-head">
        <h1>Doanh thu</h1>
        <div className="cal-nav">
          <button className="icon-btn" onClick={prevMonth} aria-label="Tháng trước">‹</button>
          <span className="week-label">Tháng {ym.m + 1}/{ym.y}</span>
          <button className="icon-btn" onClick={nextMonth} aria-label="Tháng sau">›</button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">Tổng doanh thu</div>
          <div className="kpi-value">{fmtVND(summary.total)}</div>
          <div className="kpi-sub">{summary.count} buổi thuê</div>
        </div>
        <div className="kpi good">
          <div className="kpi-label">Đã thu</div>
          <div className="kpi-value">{fmtVND(summary.collected)}</div>
        </div>
        <div className="kpi warn">
          <div className="kpi-label">Chưa thu</div>
          <div className="kpi-value">{fmtVND(summary.unpaid)}</div>
        </div>
      </div>

      <div className="rev-cols">
        <div className="rev-panel">
          <h3>Theo giáo viên</h3>
          {topRenters.length === 0 && <div className="empty sm">Chưa có dữ liệu.</div>}
          {topRenters.map(([rid, amt]) => (
            <div key={rid} className="breakdown-row">
              <span className="bd-name">
                <span className="dot" style={{ background: rentersById[rid]?.color || '#888' }} />
                {rentersById[rid]?.name || '(?)'}
              </span>
              <span className="bd-amt">{fmtVND(amt)}</span>
            </div>
          ))}
        </div>
        <div className="rev-panel">
          <h3>Theo loại ca</h3>
          {caTypes.map((c) => (
            <div key={c.id} className="breakdown-row">
              <span className="bd-name"><span className="dot" style={{ background: c.color }} />{c.name}</span>
              <span className="bd-amt">{fmtVND(summary.byCa[c.id] || 0)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-head">
        <h3 className="section-title">Chi tiết buổi thuê</h3>
        {paidInMonth.length > 0 && !confirmClear && (
          <button className="btn btn-sm btn-danger-ghost" onClick={() => setConfirmClear(true)}>
            🗑️ Xóa {paidInMonth.length} buổi đã thu
          </button>
        )}
      </div>
      {confirmClear && (
        <div className="clear-bar">
          <span>Xóa <b>{paidInMonth.length}</b> buổi <b>đã thu</b> trong Tháng {ym.m + 1}/{ym.y}? Không thể hoàn tác.</span>
          <div className="spacer" />
          <button className="btn btn-sm btn-ghost" onClick={() => setConfirmClear(false)}>Huỷ</button>
          <button className="btn btn-sm btn-danger" onClick={clearPaid}>Xóa</button>
        </div>
      )}
      {monthBookings.length === 0 ? (
        <div className="empty">Không có buổi thuê trong tháng này.</div>
      ) : (
        <div className="table-wrap">
          <table className="rev-table">
            <thead>
              <tr>
                <th>Ngày</th><th>Giáo viên</th><th>Ca</th><th>Phòng</th><th className="num">Tiền</th><th className="center">Đã thu</th>
              </tr>
            </thead>
            <tbody>
              {monthBookings.map((b) => {
                const d = parseISODate(b.date)
                const ct = caTypesById[b.ca_type_id]
                return (
                  <tr key={b.id} className={b.paid ? 'is-paid' : ''}>
                    <td className="nowrap">{weekdayShort(d)} {fmtDayMonth(d)}<span className="td-time"> {fmtTime(b.start_time)}</span></td>
                    <td>{rentersById[b.renter_id]?.name || '(?)'}</td>
                    <td className="nowrap">{ct ? `${ct.name}${b.ca_count > 1 ? ` ×${b.ca_count}` : ''}` : '—'}</td>
                    <td>
                      <span className="room-tag sm" style={{ background: roomsById[b.room_id]?.color || '#ccc', color: readableText(roomsById[b.room_id]?.color) }}>
                        {roomsById[b.room_id]?.name}
                      </span>
                    </td>
                    <td className="num strong">{fmtVND(computeAmount(b, priceMap))}</td>
                    <td className="center">
                      <input type="checkbox" checked={b.paid} onChange={(e) => setPaid(b.id, e.target.checked)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
