import { useState, useMemo, useRef, useEffect } from 'react'
import Modal from './Modal'
import DatePicker from './DatePicker'
import TimePicker from './TimePicker'
import { useData } from '../context/DataContext'
import { toISODate, parseISODate, addDays, addMinutesToTime, fmtDuration, fmtTime, fmtDayMonth } from '../lib/date'
import { fmtVND } from '../lib/money'
import { RENTER_COLORS } from '../lib/constants'

const GUARD_MS = 400

export default function BookingModal({ booking, presetDate, presetRoomId, presetStart, onClose }) {
  const data = useData()
  const { rooms, renters, caTypes, caTypesById } = data
  const editing = Boolean(booking)

  const [renterId, setRenterId] = useState(booking?.renter_id || '')
  const [roomId, setRoomId] = useState(booking?.room_id || presetRoomId || rooms[0]?.id || '')
  const [caTypeId, setCaTypeId] = useState(booking?.ca_type_id || caTypes[0]?.id || '')
  const [caCount, setCaCount] = useState(booking?.ca_count || 1)
  const [date, setDate] = useState(booking?.date || presetDate || toISODate(new Date()))
  const [start, setStart] = useState(booking?.start_time || presetStart || '18:00')
  const [note, setNote] = useState(booking?.note || '')
  const [paid, setPaid] = useState(booking?.paid || false)
  const [recurring, setRecurring] = useState(false)
  const [untilDate, setUntilDate] = useState('')

  const [newRenter, setNewRenter] = useState('')
  const [showNewRenter, setShowNewRenter] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Luồng xác nhận 2 bước: 'form' -> 'scope' -> 'confirm'
  const [step, setStep] = useState('form')
  const [opKind, setOpKind] = useState(null) // 'delete' | 'save'
  const [opScope, setOpScope] = useState(null) // 'one' | 'from_date' | 'series' | 'all'

  // Click Guard: chống ghost-click / click trễ trong 400ms đầu khi popup mở ra
  const confirmOpenedAt = useRef(0)
  const guardTimer = useRef(null)
  const [guardLocked, setGuardLocked] = useState(false)

  useEffect(() => () => { if (guardTimer.current) clearTimeout(guardTimer.current) }, [])

  function armGuard() {
    confirmOpenedAt.current = Date.now()
    setGuardLocked(true)
    if (guardTimer.current) clearTimeout(guardTimer.current)
    guardTimer.current = setTimeout(() => setGuardLocked(false), GUARD_MS)
  }
  const guardHit = () => Date.now() - confirmOpenedAt.current < GUARD_MS

  const hasOtherInSeries = useMemo(() => {
    if (!booking?.series_id) return false
    return data.bookings.some((b) => b.series_id === booking.series_id && b.id !== booking.id)
  }, [booking, data.bookings])

  const hasSeriesScope = Boolean(booking?.series_id && hasOtherInSeries)
  const dLabel = booking ? fmtDayMonth(parseISODate(booking.date)) : ''

  const ct = caTypesById[caTypeId]
  const durMin = ct ? Number(ct.duration_min || 0) * caCount : 0
  const end = addMinutesToTime(start, durMin)
  const unitPrice = data.getPrice(renterId, caTypeId, roomId)
  const amount = unitPrice * caCount
  const noPrice = renterId && caTypeId && roomId && unitPrice === 0

  async function addQuickRenter() {
    const name = newRenter.trim()
    if (!name) return
    const color = RENTER_COLORS[renters.length % RENTER_COLORS.length]
    const row = await data.addRenter({ name, color })
    if (row?.id) setRenterId(row.id)
    setNewRenter('')
    setShowNewRenter(false)
  }

  function resetToForm() {
    setErr('')
    setStep('form')
    setOpKind(null)
    setOpScope(null)
  }

  function onSave() {
    setErr('')
    if (!renterId) return setErr('Hãy chọn người thuê.')
    if (!roomId) return setErr('Hãy chọn phòng.')
    if (!caTypeId) return setErr('Hãy chọn loại ca.')
    if (durMin <= 0) return setErr('Loại ca chưa có thời lượng hợp lệ.')
    if (!editing && recurring && (!untilDate || untilDate < date)) return setErr('Hãy chọn ngày kết thúc lặp (từ ngày bắt đầu trở đi).')

    if (editing && hasSeriesScope) {
      setOpKind('save')
      setOpScope(null)
      setStep('scope')
      armGuard()
      return
    }

    executeSave('one')
  }

  function openDelete() {
    setErr('')
    setOpKind('delete')
    if (hasSeriesScope) {
      setOpScope(null)
      setStep('scope')
    } else {
      setOpScope('one')
      setStep('confirm')
    }
    armGuard()
  }

  function pickScope(scope) {
    if (guardLocked || guardHit()) return
    setOpScope(scope)
    setStep('confirm')
    armGuard()
  }

  function backFromConfirm() {
    setErr('')
    if (hasSeriesScope && step === 'confirm') {
      setStep('scope')
      setOpScope(null)
    } else {
      resetToForm()
    }
  }

  function runConfirmed() {
    if (busy || guardLocked || guardHit()) return
    if (opKind === 'delete') doDelete(opScope)
    else executeSave(opScope)
  }

  async function executeSave(scope = 'one') {
    setErr('')
    setBusy(true)
    try {
      const base = {
        renter_id: renterId,
        room_id: roomId,
        ca_type_id: caTypeId,
        ca_count: caCount,
        start_time: start,
        end_time: end,
        note: note.trim(),
      }

      if (editing) {
        if (scope === 'from_date' && booking.series_id) {
          const diffDays = Math.round((parseISODate(date) - parseISODate(booking.date)) / (1000 * 60 * 60 * 24))
          await data.updateSeriesFromDate({
            seriesId: booking.series_id,
            fromDate: booking.date,
            currentBookingId: booking.id,
            baseData: base,
            currentPaid: paid,
            dateOffsetDays: diffDays,
          })
        } else if (scope === 'all' && booking.series_id) {
          const diffDays = Math.round((parseISODate(date) - parseISODate(booking.date)) / (1000 * 60 * 60 * 24))
          await data.updateSeriesAll({
            seriesId: booking.series_id,
            currentBookingId: booking.id,
            baseData: base,
            currentPaid: paid,
            dateOffsetDays: diffDays,
          })
        } else {
          await data.updateBooking(booking.id, { ...base, date, paid })
        }
      } else if (recurring) {
        const seriesId = crypto.randomUUID()
        const rows = []
        const lastDate = parseISODate(untilDate)
        let d = parseISODate(date)
        let guard = 0
        while (d <= lastDate && guard < 400) {
          rows.push({ ...base, date: toISODate(d), series_id: seriesId, paid })
          d = addDays(d, 7)
          guard++
        }
        await data.addBookingSeries(rows)
      } else {
        await data.addBooking({ ...base, date, paid })
      }
      onClose()
    } catch (e) {
      setErr(e.message || 'Có lỗi khi lưu.')
      setBusy(false)
    }
  }

  async function doDelete(scope) {
    setErr('')
    setBusy(true)
    try {
      if (scope === 'from_date' && booking?.series_id) {
        await data.deleteSeriesFromDate(booking.series_id, booking.date)
      } else if (scope === 'series' && booking?.series_id) {
        await data.deleteSeries(booking.series_id)
      } else {
        await data.deleteBooking(booking.id)
      }
      onClose()
    } catch (e) {
      setErr(e.message || 'Có lỗi khi xoá.')
      setBusy(false)
    }
  }

  const inConfirmFlow = step === 'scope' || step === 'confirm'
  const modalTitle = inConfirmFlow
    ? opKind === 'delete' ? 'Xác nhận xoá' : 'Lưu thay đổi lịch'
    : editing
    ? 'Sửa buổi thuê'
    : 'Thêm buổi thuê'

  const confirmText = opKind === 'delete'
    ? opScope === 'from_date'
      ? `Bạn có chắc muốn xoá từ buổi ngày ${dLabel} đến hết chuỗi? Các buổi học trước ngày này sẽ được giữ nguyên.`
      : opScope === 'series'
      ? 'Bạn có chắc muốn xoá toàn bộ chuỗi, kể cả các buổi trong quá khứ? Hành động này không thể hoàn tác.'
      : `Bạn có chắc muốn xoá buổi ngày ${dLabel}?`
    : opScope === 'from_date'
    ? `Bạn có chắc muốn áp dụng thay đổi từ ngày ${dLabel} trở đi? Các buổi học trước ngày này sẽ giữ nguyên.`
    : opScope === 'all'
    ? 'Bạn có chắc muốn áp dụng thay đổi cho tất cả các buổi trong chuỗi?'
    : `Bạn có chắc muốn áp dụng thay đổi chỉ cho buổi ngày ${dLabel}?`

  // Footer luôn hiện diện (giữ nguyên .modal-foot) để modal không co rút chiều cao
  const footer = inConfirmFlow ? (
    <>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={step === 'confirm' ? backFromConfirm : resetToForm}
        disabled={busy}
      >
        Quay lại
      </button>
      <div className="spacer" />
      {step === 'confirm' && (
        <button
          type="button"
          className={'btn ' + (opKind === 'delete' ? 'btn-danger' : 'btn-primary')}
          onClick={runConfirmed}
          disabled={busy || guardLocked}
        >
          {busy ? 'Đang xử lý…' : opKind === 'delete' ? 'Xác nhận xoá' : 'Xác nhận lưu'}
        </button>
      )}
    </>
  ) : (
    <>
      {editing && (
        <button type="button" className="btn btn-danger-ghost" onClick={openDelete} disabled={busy}>Xoá</button>
      )}
      <div className="spacer" />
      <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Huỷ</button>
      <button type="button" className="btn btn-primary" onClick={onSave} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
    </>
  )

  return (
    <Modal title={modalTitle} onClose={onClose} footer={footer} showClose={false}>
      {step === 'scope' ? (
        <div className="confirm-box">
          <p><b>{opKind === 'delete' ? 'Xoá buổi thuê' : 'Lưu thay đổi lịch'}</b></p>
          <p className="muted">
            Buổi này thuộc một chuỗi lặp hằng tuần. Bạn muốn {opKind === 'delete' ? 'xoá' : 'áp dụng thay đổi cho'}:
          </p>
          {opKind === 'delete' ? (
            <div className="confirm-actions-col">
              <button type="button" className="choice-btn" onClick={() => pickScope('one')} disabled={busy || guardLocked}>
                <span className="choice-title">Chỉ buổi này</span>
                <span className="choice-sub">Chỉ xoá buổi ngày {dLabel}</span>
              </button>
              <button type="button" className="choice-btn choice-danger" onClick={() => pickScope('from_date')} disabled={busy || guardLocked}>
                <span className="choice-title">Từ buổi này trở đi</span>
                <span className="choice-sub">
                  Xoá từ ngày {dLabel} đến hết chuỗi (<b>giữ nguyên các buổi trước đó</b>)
                </span>
              </button>
              <button type="button" className="choice-btn choice-danger-subtle" onClick={() => pickScope('series')} disabled={busy || guardLocked}>
                <span className="choice-title">Toàn bộ chuỗi</span>
                <span className="choice-sub">
                  ⚠️ Xoá tất cả các buổi trong chuỗi, <b>kể cả các buổi trong quá khứ</b>
                </span>
              </button>
            </div>
          ) : (
            <div className="confirm-actions-col">
              <button type="button" className="choice-btn" onClick={() => pickScope('one')} disabled={busy || guardLocked}>
                <span className="choice-title">Chỉ buổi này</span>
                <span className="choice-sub">Chỉ áp dụng cho buổi ngày {dLabel}</span>
              </button>
              <button type="button" className="choice-btn choice-primary" onClick={() => pickScope('from_date')} disabled={busy || guardLocked}>
                <span className="choice-title">Từ buổi này trở đi</span>
                <span className="choice-sub">
                  Đổi phòng/thông tin từ ngày {dLabel} đến hết chuỗi (<b>giữ nguyên lịch cũ các tháng trước</b>)
                </span>
              </button>
              <button type="button" className="choice-btn" onClick={() => pickScope('all')} disabled={busy || guardLocked}>
                <span className="choice-title">Tất cả các buổi trong chuỗi</span>
                <span className="choice-sub">Áp dụng cho toàn bộ các buổi trong chuỗi</span>
              </button>
            </div>
          )}
          {err && <div className="form-error full" style={{ marginTop: 12 }}>{err}</div>}
        </div>
      ) : step === 'confirm' ? (
        <div className="confirm-box">
          <p><b>{opKind === 'delete' ? 'Xác nhận xoá' : 'Xác nhận lưu thay đổi'}</b></p>
          <p className="muted">{confirmText}</p>
          <div className={'confirm-summary' + (opKind === 'delete' ? ' is-danger' : '')}>
            {opKind === 'delete' ? 'Hành động xoá sẽ được thực hiện ngay sau khi bạn xác nhận.' : 'Thông tin mới sẽ được cập nhật ngay sau khi bạn xác nhận.'}
          </div>
          {err && <div className="form-error full" style={{ marginTop: 12 }}>{err}</div>}
        </div>
      ) : (
        <div className="form-grid">
          <div className="field full">
            <label>Người thuê / giáo viên</label>
            {showNewRenter ? (
              <div className="inline-add">
                <input autoFocus value={newRenter} onChange={(e) => setNewRenter(e.target.value)}
                  placeholder="Tên người thuê mới" onKeyDown={(e) => e.key === 'Enter' && addQuickRenter()} />
                <button type="button" className="btn btn-sm btn-primary" onClick={addQuickRenter}>Thêm</button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowNewRenter(false)}>✕</button>
              </div>
            ) : (
              <div className="inline-add">
                <select value={renterId} onChange={(e) => setRenterId(e.target.value)}>
                  <option value="">— Chọn người thuê —</option>
                  {renters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowNewRenter(true)}>＋ Mới</button>
              </div>
            )}
          </div>

          <div className="field full">
            <label>Phòng</label>
            <div className="room-pills">
              {rooms.map((r) => (
                <button key={r.id} type="button"
                  className={'room-pill' + (roomId === r.id ? ' active' : '')}
                  style={roomId === r.id ? { borderColor: r.color, background: r.color + '55' } : {}}
                  onClick={() => setRoomId(r.id)}>
                  <span className="dot" style={{ background: r.color }} />{r.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field full">
            <label>Loại ca</label>
            <div className="room-pills">
              {caTypes.map((c) => (
                <button key={c.id} type="button"
                  className={'room-pill' + (caTypeId === c.id ? ' active' : '')}
                  style={caTypeId === c.id ? { borderColor: c.color, background: c.color + '55' } : {}}
                  onClick={() => setCaTypeId(c.id)}>
                  <span className="dot" style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
              {caTypes.length === 0 && <span className="muted sm">Chưa có loại ca — thêm trong mục Cài đặt.</span>}
            </div>
          </div>

          <div className="field">
            <label>Số ca</label>
            <select value={caCount} onChange={(e) => setCaCount(Number(e.target.value))}>
              <option value={1}>1 ca</option>
              <option value={2}>2 ca</option>
              <option value={3}>3 ca</option>
            </select>
          </div>
          <div className="field">
            <label>Ngày</label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div className="field">
            <label>Giờ bắt đầu</label>
            <TimePicker value={start} onChange={setStart} />
          </div>
          <div className="field">
            <label>Kết thúc (tự tính)</label>
            <div className="computed-end">{end} <span className="muted">({fmtDuration(durMin)})</span></div>
          </div>

          <div className="field full">
            <label>Ghi chú</label>
            <textarea rows="2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: học sinh lớp 12…" />
          </div>

          <div className="field full toggle-row">
            <label className="checkbox">
              <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
              <span>Đã thu tiền</span>
            </label>
          </div>

          {!editing && (
            <div className="field full toggle-row">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => {
                    setRecurring(e.target.checked)
                    if (e.target.checked && !untilDate) setUntilDate(toISODate(addDays(parseISODate(date), 28)))
                  }}
                />
                <span>Lặp lại hằng tuần</span>
              </label>
              {recurring && (
                <div className="weeks-input">
                  đến ngày
                  <DatePicker value={untilDate} min={date} onChange={setUntilDate} />
                </div>
              )}
            </div>
          )}

          <div className="amount-preview full">
            <span>Thành tiền {ct ? `(${caCount} × ${fmtVND(unitPrice)})` : ''}</span>
            <b>{fmtVND(amount)}</b>
          </div>
          {noPrice && (
            <div className="hint full">⚠️ Chưa đặt giá cho giáo viên này ở loại ca này. Vào <b>Người thuê</b> để đặt giá.</div>
          )}

          {err && <div className="form-error full">{err}</div>}
        </div>
      )}
    </Modal>
  )
}
