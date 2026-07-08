import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useData } from '../context/DataContext'
import { useIsDesktop } from '../lib/useMediaQuery'
import BookingModal from '../components/BookingModal'
import {
  mondayOf, addDays, toISODate, isSameDay, weekdayShort, weekdayName,
  fmtDayMonth, weekLabel, timeToMinutes, minutesToTime, fmtTime,
} from '../lib/date'
import { DAY_START_MIN, DAY_END_MIN, SLOT_MIN, readableText } from '../lib/constants'
import { findConflicts, packLanes, computeAmount } from '../lib/bookings'
import { fmtVND } from '../lib/money'

const TOTAL_SLOTS = (DAY_END_MIN - DAY_START_MIN) / SLOT_MIN
const MIN_SLOT = 16
const MAX_SLOT = 30
const HEADER_H = 50 // chiều cao hàng đầu cột (ước lượng)

export default function Calendar() {
  const { bookings, rooms, roomsById, rentersById, priceMap, loading } = useData()
  const isDesktop = useIsDesktop()

  // Giờ hiện tại — cập nhật mỗi phút (cho thanh thời gian thực & tô hôm nay)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])
  const today = now

  const [monday, setMonday] = useState(() => mondayOf(new Date()))
  const [roomFilter, setRoomFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [mobileDay, setMobileDay] = useState(0)
  const [expandedDay, setExpandedDay] = useState(null) // cột đang phình to

  // Chiều cao mỗi khung giờ + chiều cao khung cuộn (đầu cột cố định, chỉ cuộn phần giờ)
  const wrapRef = useRef(null)
  const [slotPx, setSlotPx] = useState(30)
  const [wrapMaxH, setWrapMaxH] = useState(null)

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday])

  useEffect(() => {
    const idx = days.findIndex((d) => isSameDay(d, new Date()))
    setMobileDay(idx >= 0 ? idx : 0)
  }, [monday]) // eslint-disable-line react-hooks/exhaustive-deps

  const weekStart = toISODate(days[0])
  const weekEnd = toISODate(days[6])
  const weekBookings = useMemo(
    () => bookings.filter((b) => b.date >= weekStart && b.date <= weekEnd),
    [bookings, weekStart, weekEnd],
  )
  const conflicts = useMemo(() => findConflicts(weekBookings), [weekBookings])
  const visible = useMemo(
    () => weekBookings.filter((b) => roomFilter === 'all' || b.room_id === roomFilter),
    [weekBookings, roomFilter],
  )

  const todayISO = toISODate(today)
  const todayBookings = useMemo(
    () => bookings.filter((b) => b.date === todayISO).sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)),
    [bookings, todayISO],
  )
  const nextUp = todayBookings.find((b) => timeToMinutes(b.end_time) >= (today.getHours() * 60 + today.getMinutes()))

  // Khung lịch cao bằng phần còn lại của màn hình; ô cao "gấp rưỡi" so với vừa-khít
  // -> phần giờ cuộn bên trong, đầu cột (Thứ/ngày) đứng yên.
  useLayoutEffect(() => {
    if (!isDesktop) return
    const compute = () => {
      const el = wrapRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      const avail = window.innerHeight - top - 14 // chừa lề dưới
      setWrapMaxH(avail)
      const fit = Math.min(MAX_SLOT, Math.max(MIN_SLOT, Math.floor((avail - HEADER_H) / TOTAL_SLOTS)))
      setSlotPx(Math.round(fit * 1.5))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [isDesktop, weekStart, loading, todayBookings.length, conflicts.size])

  const gridH = slotPx * TOTAL_SLOTS

  function bookingsOf(dayISO) {
    return visible
      .filter((b) => b.date === dayISO)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
  }

  function openCell(dayISO, minutes) {
    const start = minutesToTime(Math.max(DAY_START_MIN, Math.min(minutes, DAY_END_MIN - 60)))
    setModal({ presetDate: dayISO, presetRoomId: roomFilter !== 'all' ? roomFilter : undefined, presetStart: start })
  }

  const hours = []
  for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += 60) hours.push(m)

  // Thanh thời gian thực (giống Teams)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const weekHasToday = days.some((d) => isSameDay(d, now))
  const showNowLine = weekHasToday && nowMin >= DAY_START_MIN && nowMin <= DAY_END_MIN
  const nowTop = ((nowMin - DAY_START_MIN) / SLOT_MIN) * slotPx

  // Bấm 1 ngày -> cột đó phình to; bấm lại -> về bình thường.
  // Luôn đặt inline (cùng cấu trúc track) để chuyển động luôn mượt, kể cả mở/thu cùng 1 ngày.
  const gridCols =
    '58px ' +
    days
      .map((_, i) =>
        expandedDay === i ? 'minmax(240px, 3fr)' : expandedDay === null ? 'minmax(90px, 1fr)' : 'minmax(60px, 1fr)',
      )
      .join(' ')

  return (
    <div className="page calendar">
      {/* Thanh công cụ */}
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="icon-btn" onClick={() => setMonday(addDays(monday, -7))} aria-label="Tuần trước">‹</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setMonday(mondayOf(new Date()))}>Hôm nay</button>
          <button className="icon-btn" onClick={() => setMonday(addDays(monday, 7))} aria-label="Tuần sau">›</button>
          <span className="week-label">Tuần {weekLabel(monday)}</span>
        </div>
        <div className="cal-actions">
          <div className="room-filter">
            <button className={'chip' + (roomFilter === 'all' ? ' active' : '')} onClick={() => setRoomFilter('all')}>Tất cả</button>
            {rooms.map((r) => (
              <button
                key={r.id}
                className={'chip' + (roomFilter === r.id ? ' active' : '')}
                style={roomFilter === r.id ? { borderColor: r.color } : {}}
                onClick={() => setRoomFilter(r.id)}
              >
                <span className="dot" style={{ background: r.color }} />
                {r.name}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm hide-on-mobile" onClick={() => openCell(toISODate(days[Math.max(mobileDay, 0)]), 18 * 60)}>
            ＋ Thêm buổi
          </button>
        </div>
      </div>

      {/* Nhắc lịch hôm nay */}
      {todayBookings.length > 0 && (
        <div className="today-strip">
          🔔 <b>Hôm nay ({fmtDayMonth(today)}):</b> {todayBookings.length} buổi thuê
          {nextUp && (
            <span className="next-up">
              · Sắp tới: {rentersById[nextUp.renter_id]?.name} lúc {fmtTime(nextUp.start_time)}
            </span>
          )}
        </div>
      )}
      {conflicts.size > 0 && (
        <div className="conflict-strip">⚠️ Có {Math.ceil(conflicts.size / 2)} chỗ trùng phòng – trùng giờ trong tuần này. Kiểm tra các buổi viền đỏ.</div>
      )}

      {loading && <div className="loading-row"><div className="spinner" /> Đang tải…</div>}

      {/* ===== MÁY TÍNH: lưới tuần (tự vừa màn hình) ===== */}
      {isDesktop ? (
        <div className="cal-grid-wrap" ref={wrapRef} style={wrapMaxH ? { maxHeight: wrapMaxH } : undefined}>
          <div className="cal-grid" style={{ gridTemplateColumns: gridCols }}>
            <div className="cal-corner" />
            {days.map((d, i) => (
              <div
                key={i}
                className={'cal-dayhead' + (isSameDay(d, today) ? ' is-today' : '') + (expandedDay === i ? ' expanded' : '')}
                onClick={() => setExpandedDay((prev) => (prev === i ? null : i))}
                title={expandedDay === i ? 'Bấm để thu lại' : 'Bấm để phóng to ngày này'}
              >
                <span className="dh-name">{weekdayShort(d)}</span>
                <span className="dh-date">{fmtDayMonth(d)}</span>
              </div>
            ))}

            <div className="cal-timeaxis" style={{ height: gridH }}>
              {hours.map((m) => (
                <div key={m} className="cal-hour" style={{ top: ((m - DAY_START_MIN) / SLOT_MIN) * slotPx }}>
                  {minutesToTime(m)}
                </div>
              ))}
            </div>

            {days.map((d, i) => {
              const dayISO = toISODate(d)
              const evts = packLanes(
                bookingsOf(dayISO).map((b) => ({ b, s: timeToMinutes(b.start_time), e: timeToMinutes(b.end_time) })),
              )
              return (
                <div
                  key={i}
                  className={'cal-col' + (isSameDay(d, today) ? ' is-today' : '')}
                  style={{ height: gridH }}
                  onClick={(e) => {
                    if (e.target.closest('.cal-block')) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const slot = Math.floor((e.clientY - rect.top) / slotPx)
                    openCell(dayISO, DAY_START_MIN + slot * SLOT_MIN)
                  }}
                >
                  {Array.from({ length: TOTAL_SLOTS + 1 }, (_, si) => (
                    <div key={'l' + si} className={'grid-line' + (si % 2 ? ' half' : ' hour')} style={{ top: si * slotPx }} />
                  ))}
                  {evts.map(({ b, s, e, lane, lanes }) => {
                    const room = roomsById[b.room_id]
                    const renter = rentersById[b.renter_id]
                    const top = ((s - DAY_START_MIN) / SLOT_MIN) * slotPx
                    const h = Math.max(((e - s) / SLOT_MIN) * slotPx - 2, 16)
                    return (
                      <div
                        key={b.id}
                        className={'cal-block' + (conflicts.has(b.id) ? ' conflict' : '') + (b.paid ? ' paid' : '')}
                        style={{
                          top,
                          height: h,
                          left: `calc(${(lane / lanes) * 100}% + 2px)`,
                          width: `calc(${100 / lanes}% - 4px)`,
                          background: renter?.color || '#888',
                          color: readableText(renter?.color),
                          borderLeftColor: 'rgba(0,0,0,.22)',
                        }}
                        onClick={() => setModal({ booking: b })}
                        title={`${renter?.name || ''} · ${fmtTime(b.start_time)}–${fmtTime(b.end_time)} · ${room?.name || ''}`}
                      >
                        <div className="cb-name">{renter?.name || '(?)'}{b.paid && <span className="paid-dot" title="Đã thu">✓</span>}</div>
                        <div className="cb-time">{fmtTime(b.start_time)}–{fmtTime(b.end_time)}</div>
                        {room && h > 40 && <div className="cb-room">{room.name}</div>}
                        {b.note && h > 58 && <div className="cb-note">{b.note}</div>}
                      </div>
                    )
                  })}
                  {showNowLine && (
                    <div className="now-line" style={{ top: nowTop }}>
                      {isSameDay(d, now) && <span className="now-dot" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ===== ĐIỆN THOẠI: chọn ngày + danh sách ===== */
        <div className="cal-mobile">
          <div className="day-chips">
            {days.map((d, i) => (
              <button
                key={i}
                className={'day-chip' + (mobileDay === i ? ' active' : '') + (isSameDay(d, today) ? ' today' : '')}
                onClick={() => setMobileDay(i)}
              >
                <span className="dc-name">{weekdayShort(d)}</span>
                <span className="dc-date">{Number(fmtDayMonth(d).split('/')[0])}</span>
              </button>
            ))}
          </div>

          <div className="agenda">
            <div className="agenda-head">{weekdayName(days[mobileDay])}, {fmtDayMonth(days[mobileDay])}</div>
            {bookingsOf(toISODate(days[mobileDay])).length === 0 ? (
              <div className="empty">Chưa có buổi thuê. Bấm ＋ để thêm.</div>
            ) : (
              bookingsOf(toISODate(days[mobileDay])).map((b) => {
                const room = roomsById[b.room_id]
                const renter = rentersById[b.renter_id]
                return (
                  <button
                    key={b.id}
                    className={'agenda-item' + (conflicts.has(b.id) ? ' conflict' : '')}
                    onClick={() => setModal({ booking: b })}
                  >
                    <div className="ai-time">
                      <b>{fmtTime(b.start_time)}</b>
                      <span>{fmtTime(b.end_time)}</span>
                    </div>
                    <div className="ai-bar" style={{ background: renter?.color || '#888' }} />
                    <div className="ai-body">
                      <div className="ai-name">{renter?.name || '(?)'}</div>
                      <div className="ai-meta">
                        <span className="room-tag" style={{ background: room?.color || '#ccc', color: readableText(room?.color) }}>
                          {room?.name}
                        </span>
                        {b.note && <span className="ai-note">{b.note}</span>}
                      </div>
                    </div>
                    <div className="ai-right">
                      <div className="ai-amt">{fmtVND(computeAmount(b, priceMap))}</div>
                      <div className={'ai-paid' + (b.paid ? ' yes' : '')}>{b.paid ? 'Đã thu' : 'Chưa thu'}</div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <button className="fab" onClick={() => openCell(toISODate(days[mobileDay]), 18 * 60)} aria-label="Thêm buổi thuê">＋</button>
        </div>
      )}

      {modal && (
        <BookingModal
          booking={modal.booking}
          presetDate={modal.presetDate}
          presetRoomId={modal.presetRoomId}
          presetStart={modal.presetStart}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
