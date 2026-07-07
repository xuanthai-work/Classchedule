import { useState } from 'react'
import Modal from './Modal'
import { useData } from '../context/DataContext'
import { RENTER_COLORS } from '../lib/constants'

export default function RenterModal({ renter, onClose }) {
  const data = useData()
  const { caTypes, rooms, priceMap } = data
  const editing = Boolean(renter)
  const count = editing ? data.bookings.filter((b) => b.renter_id === renter.id).length : 0

  const [name, setName] = useState(renter?.name || '')
  const [phone, setPhone] = useState(renter?.phone || '')
  const [note, setNote] = useState(renter?.note || '')
  const [color, setColor] = useState(renter?.color || RENTER_COLORS[data.renters.length % RENTER_COLORS.length])

  // Danh sách mức giá: [{ key, caTypeId, roomId, price }]
  const [entries, setEntries] = useState(() => {
    if (!editing) return []
    const list = data.renterPrices
      .filter((p) => p.renter_id === renter.id)
      .map((p) => ({ key: crypto.randomUUID(), caTypeId: p.ca_type_id, roomId: p.room_id, price: p.price ? p.price / 1000 : '' }))
    return list
  })

  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const addRow = () =>
    setEntries((e) => [...e, { key: crypto.randomUUID(), caTypeId: caTypes[0]?.id || '', roomId: rooms[0]?.id || '', price: '' }])
  const setRow = (key, patch) => setEntries((e) => e.map((x) => (x.key === key ? { ...x, ...patch } : x)))
  const delRow = (key) => setEntries((e) => e.filter((x) => x.key !== key))

  async function onSave() {
    setErr('')
    if (!name.trim()) return setErr('Hãy nhập tên.')
    setBusy(true)
    try {
      const payload = { name: name.trim(), phone: phone.trim(), note: note.trim(), color }
      let id = renter?.id
      if (editing) await data.updateRenter(renter.id, payload)
      else id = (await data.addRenter(payload))?.id
      if (id) {
        // gộp theo (ca, phòng) — dòng sau ghi đè dòng trước
        const map = {}
        for (const e of entries) {
          if (e.caTypeId && e.roomId) map[`${e.caTypeId}__${e.roomId}`] = (Number(e.price) || 0) * 1000
        }
        const rows = Object.entries(map).map(([k, price]) => {
          const [ca_type_id, room_id] = k.split('__')
          return { renter_id: id, ca_type_id, room_id, price }
        })
        await data.replaceRenterPrices(id, rows)
      }
      onClose()
    } catch (e) {
      setErr(e.message || 'Có lỗi khi lưu.')
      setBusy(false)
    }
  }

  async function onDelete() {
    setBusy(true)
    try {
      await data.deleteRenter(renter.id)
      onClose()
    } catch {
      setErr('Không xoá được (người thuê còn buổi thuê).')
      setBusy(false)
    }
  }

  const footer = (
    <>
      {editing && <button className="btn btn-danger-ghost" onClick={() => setConfirmDelete(true)} disabled={busy}>Xoá</button>}
      <div className="spacer" />
      <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Huỷ</button>
      <button className="btn btn-primary" onClick={onSave} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
    </>
  )

  const canAddPrice = caTypes.length > 0 && rooms.length > 0

  return (
    <Modal title={editing ? 'Sửa người thuê' : 'Thêm người thuê'} onClose={onClose} footer={footer}>
      {confirmDelete ? (
        <div className="confirm-box">
          {count > 0 ? (
            <p>Người thuê này còn <b>{count}</b> buổi thuê. Hãy xoá các buổi đó trước khi xoá người thuê.</p>
          ) : (
            <p>Xoá người thuê <b>{renter.name}</b>?</p>
          )}
          <div className="confirm-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Quay lại</button>
            {count === 0 && <button className="btn btn-danger" onClick={onDelete}>Xoá</button>}
          </div>
        </div>
      ) : (
        <div className="form-grid">
          <div className="field full">
            <label>Tên người thuê / giáo viên</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Cô Hà Hoá" />
          </div>
          <div className="field">
            <label>Số điện thoại</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxx" />
          </div>
          <div className="field full">
            <label>Ghi chú</label>
            <textarea rows="2" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="field full">
            <label>Bảng giá</label>
            {!canAddPrice ? (
              <div className="muted sm">Cần có ít nhất 1 loại ca và 1 phòng (thêm trong mục Cài đặt).</div>
            ) : (
              <div className="price-entries">
                {entries.length === 0 && <div className="muted sm">Chưa có mức giá nào. Bấm “＋ Thêm mức giá”.</div>}
                {entries.map((e) => (
                  <div key={e.key} className="price-entry">
                    <select value={e.caTypeId} onChange={(ev) => setRow(e.key, { caTypeId: ev.target.value })}>
                      {caTypes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={e.roomId} onChange={(ev) => setRow(e.key, { roomId: ev.target.value })}>
                      {rooms.map((rm) => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                    </select>
                    <div className="rate-input">
                      <input type="number" min="0" step="1" value={e.price}
                        onChange={(ev) => setRow(e.key, { price: ev.target.value })} placeholder="150" />
                      <span>k</span>
                    </div>
                    <button className="icon-btn sm" onClick={() => delRow(e.key)} aria-label="Xoá mức giá">✕</button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-ghost add-price" onClick={addRow}>＋ Thêm mức giá</button>
              </div>
            )}
          </div>

          <div className="field full">
            <label>Màu nhận diện</label>
            <div className="color-swatches">
              {RENTER_COLORS.map((c) => (
                <button key={c} type="button" className={'swatch' + (color === c ? ' active' : '')} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
              ))}
            </div>
          </div>
          {err && <div className="form-error full">{err}</div>}
        </div>
      )}
    </Modal>
  )
}
