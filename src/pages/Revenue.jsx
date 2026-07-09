import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { useIsDesktop } from '../lib/useMediaQuery'
import { pad2, fmtDayMonth, parseISODate, weekdayShort, fmtTime } from '../lib/date'
import { computeAmount } from '../lib/bookings'
import { readableText } from '../lib/constants'
import { fmtVND } from '../lib/money'
import Modal from '../components/Modal'

export default function Revenue() {
  const { bookings, caTypes, caTypesById, roomsById, rentersById, priceMap, setPaid, deleteBookings } = useData()
  const isDesktop = useIsDesktop()
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [confirmClear, setConfirmClear] = useState(false)
  const [openRid, setOpenRid] = useState(null)

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
    for (const b of monthBookings) {
      const amt = computeAmount(b, priceMap)
      total += amt
      if (b.paid) collected += amt
      byCa[b.ca_type_id] = (byCa[b.ca_type_id] || 0) + amt
    }
    return { total, collected, unpaid: total - collected, count: monthBookings.length, byCa }
  }, [monthBookings, priceMap])

  // Gom buổi thuê theo giáo viên (đã sắp theo ngày), tính tổng + phần chưa thu, xếp giảm dần
  const groups = useMemo(() => {
    const map = new Map()
    for (const b of monthBookings) {
      if (!map.has(b.renter_id)) map.set(b.renter_id, [])
      map.get(b.renter_id).push(b)
    }
    return [...map.entries()]
      .map(([rid, items]) => {
        let total = 0, unpaid = 0
        for (const b of items) {
          const amt = computeAmount(b, priceMap)
          total += amt
          if (!b.paid) unpaid += amt
        }
        return { rid, items, total, unpaid, count: items.length }
      })
      .sort((a, b) => b.total - a.total)
  }, [monthBookings, priceMap])

  const paidInMonth = monthBookings.filter((b) => b.paid)
  const openGroup = groups.find((g) => g.rid === openRid)
  const hasUnpaid = openGroup?.unpaid > 0
  function resetMonth(next) { setConfirmClear(false); setOpenRid(null); setYm(next) }
  function prevMonth() { resetMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 })) }
  function nextMonth() { resetMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 })) }
  async function clearPaid() {
    await deleteBookings(paidInMonth.map((b) => b.id))
    setConfirmClear(false)
  }

  function detailBody(items) {
    if (isDesktop) {
      return (
        <table className="rev-table compact">
          <thead>
            <tr><th>Ngày</th><th>Ca</th><th>Phòng</th><th className="num">Tiền</th><th className="center">Đã thu</th></tr>
          </thead>
          <tbody>
            {items.map((b) => {
              const d = parseISODate(b.date)
              const ct = caTypesById[b.ca_type_id]
              const room = roomsById[b.room_id]
              return (
                <tr key={b.id} className={b.paid ? 'is-paid' : ''}>
                  <td className="nowrap">{weekdayShort(d)} {fmtDayMonth(d)}<span className="td-time"> {fmtTime(b.start_time)}</span></td>
                  <td className="nowrap">{ct ? `${ct.name}${b.ca_count > 1 ? ` ×${b.ca_count}` : ''}` : '—'}</td>
                  <td>
                    <span className="room-tag sm" style={{ background: room?.color || '#ccc', color: readableText(room?.color) }}>{room?.name}</span>
                  </td>
                  <td className="num strong">{fmtVND(computeAmount(b, priceMap))}</td>
                  <td className="center"><input type="checkbox" checked={b.paid} onChange={(e) => setPaid(b.id, e.target.checked)} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )
    }
    return (
      <div className="rev-cards">
        {items.map((b) => {
          const d = parseISODate(b.date)
          const ct = caTypesById[b.ca_type_id]
          const room = roomsById[b.room_id]
          return (
            <div key={b.id} className={'rev-card' + (b.paid ? ' is-paid' : '')}>
              <div className="rc-main">
                <div className="rc-name">{weekdayShort(d)} {fmtDayMonth(d)} · {fmtTime(b.start_time)}</div>
                <div className="rc-tags">
                  <span className="rc-ca">{ct ? `${ct.name}${b.ca_count > 1 ? ` ×${b.ca_count}` : ''}` : '—'}</span>
                  <span className="room-tag sm" style={{ background: room?.color || '#ccc', color: readableText(room?.color) }}>{room?.name}</span>
                </div>
              </div>
              <div className="rc-side">
                <div className="rc-amt">{fmtVND(computeAmount(b, priceMap))}</div>
                <label className="rc-paid checkbox">
                  <input type="checkbox" checked={b.paid} onChange={(e) => setPaid(b.id, e.target.checked)} />
                  <span>Đã thu</span>
                </label>
              </div>
            </div>
          )
        })}
      </div>
    )
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

      <div className="rev-panel">
        <h3>Theo loại ca</h3>
        {caTypes.map((c) => (
          <div key={c.id} className="breakdown-row">
            <span className="bd-name"><span className="dot" style={{ background: c.color }} />{c.name}</span>
            <span className="bd-amt">{fmtVND(summary.byCa[c.id] || 0)}</span>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h3 className="section-title">Chi tiết theo giáo viên</h3>
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

      {groups.length === 0 ? (
        <div className="empty">Không có buổi thuê trong tháng này.</div>
      ) : (
        <div className="teacher-list">
          {groups.map((g) => {
            const r = rentersById[g.rid]
            return (
              <button key={g.rid} className="ta-card" onClick={() => setOpenRid(g.rid)}>
                <span className="dot lg" style={{ background: r?.color || '#888' }} />
                <span className="ta-name">{r?.name || '(?)'}</span>
                <span className="ta-count">{g.count} buổi</span>
                <span className="spacer" />
                <span className="ta-amt">
                  <span className="ta-total">{fmtVND(g.total)}</span>
                  {g.unpaid > 0
                    ? <span className="ta-unpaid">Chưa thu {fmtVND(g.unpaid)}</span>
                    : <span className="ta-done">Đã thu đủ</span>}
                </span>
                <span className="ta-chev" aria-hidden="true">›</span>
              </button>
            )
          })}
        </div>
      )}

      {openGroup && (
        <Modal className="modal-wide" title={rentersById[openGroup.rid]?.name || '(?)'} onClose={() => setOpenRid(null)}>
          <div className="rev-modal-sum">
            <div className="rms-item">
              <span className="rms-label">Số buổi</span>
              <span className="rms-value">{openGroup.count}</span>
            </div>
            <div className="rms-item">
              <span className="rms-label">Tổng tiền</span>
              <span className="rms-value">{fmtVND(openGroup.total)}</span>
            </div>
            <div className="rms-item">
              <span className="rms-label">{hasUnpaid ? 'Chưa thu' : 'Trạng thái'}</span>
              <span className={'rms-value ' + (hasUnpaid ? 'warn' : 'good')}>
                {hasUnpaid ? fmtVND(openGroup.unpaid) : 'Đã thu đủ'}
              </span>
            </div>
          </div>
          <div className="rev-modal-detail">{detailBody(openGroup.items)}</div>
        </Modal>
      )}
    </div>
  )
}
