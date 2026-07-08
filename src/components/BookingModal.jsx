import { useState } from 'react'
import Modal from './Modal'
import DatePicker from './DatePicker'
import TimePicker from './TimePicker'
import { useData } from '../context/DataContext'
import { toISODate, parseISODate, addDays, addMinutesToTime, fmtDuration, fmtTime } from '../lib/date'
import { fmtVND } from '../lib/money'
import { RENTER_COLORS } from '../lib/constants'

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
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  async function onSave() {
    setErr('')
    if (!renterId) return setErr('Hãy chọn người thuê.')
    if (!roomId) return setErr('Hãy chọn phòng.')
    if (!caTypeId) return setErr('Hãy chọn loại ca.')
    if (durMin <= 0) return setErr('Loại ca chưa có thời lượng hợp lệ.')
    if (!editing && recurring && (!untilDate || untilDate < date)) return setErr('Hãy chọn ngày kết thúc lặp (từ ngày bắt đầu trở đi).')

    setBusy(true)
    try {
      const base = {
        renter_id: renterId, room_id: roomId, ca_type_id: caTypeId, ca_count: caCount,
        start_time: start, end_time: end, note: note.trim(), paid,
      }
      if (editing) {
        await data.updateBooking(booking.id, { ...base, date })
      } else if (recurring) {
        const seriesId = crypto.randomUUID()
        const rows = []
        const lastDate = parseISODate(untilDate)
        let d = parseISODate(date)
        let guard = 0
        while (d <= lastDate && guard < 400) {
          rows.push({ ...base, date: toISODate(d), series_id: seriesId })
          d = addDays(d, 7)
          guard++
        }
        await data.addBookingSeries(rows)
      } else {
        await data.addBooking({ ...base, date })
      }
      onClose()
    } catch (e) {
      setErr(e.message || 'Có lỗi khi lưu.')
      setBusy(false)
    }
  }

  async function doDelete(scope) {
    setBusy(true)
    try {
      if (scope === 'series' && booking.series_id) await data.deleteSeries(booking.series_id)
      else await data.deleteBooking(booking.id)
      onClose()
    } catch (e) {
      setErr(e.message || 'Có lỗi khi xoá.')
      setBusy(false)
    }
  }

  const footer = (
    <>
      {editing && (
        <button className="btn btn-danger-ghost" onClick={() => setConfirmDelete(true)} disabled={busy}>Xoá</button>
      )}
      <div className="spacer" />
      <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Huỷ</button>
      <button className="btn btn-primary" onClick={onSave} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
    </>
  )

  return (
    <Modal title={editing ? 'Sửa buổi thuê' : 'Thêm buổi thuê'} onClose={onClose} footer={footer}>
      {confirmDelete ? (
        <div className="confirm-box">
          <p>Bạn muốn xoá buổi thuê này?</p>
          {booking.series_id && <p className="muted">Buổi này thuộc một chuỗi lặp hằng tuần.</p>}
          <div className="confirm-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Quay lại</button>
            <button className="btn btn-danger" onClick={() => doDelete('one')}>Chỉ buổi này</button>
            {booking.series_id && <button className="btn btn-danger" onClick={() => doDelete('series')}>Cả chuỗi</button>}
          </div>
        </div>
      ) : (
        <div className="form-grid">
          <div className="field full">
            <label>Người thuê / giáo viên</label>
            {showNewRenter ? (
              <div className="inline-add">
                <input autoFocus value={newRenter} onChange={(e) => setNewRenter(e.target.value)}
                  placeholder="Tên người thuê mới" onKeyDown={(e) => e.key === 'Enter' && addQuickRenter()} />
                <button className="btn btn-sm btn-primary" onClick={addQuickRenter}>Thêm</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setShowNewRenter(false)}>✕</button>
              </div>
            ) : (
              <div className="inline-add">
                <select value={renterId} onChange={(e) => setRenterId(e.target.value)}>
                  <option value="">— Chọn người thuê —</option>
                  {renters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <button className="btn btn-sm btn-ghost" onClick={() => setShowNewRenter(true)}>＋ Mới</button>
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
