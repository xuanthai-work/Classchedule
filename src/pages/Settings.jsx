import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { RENTER_COLORS } from '../lib/constants'

function CaTypeRow({ ca, onSave, onDelete }) {
  const [name, setName] = useState(ca.name)
  const [h, setH] = useState(Math.floor(ca.duration_min / 60))
  const [m, setM] = useState(ca.duration_min % 60)
  const [color, setColor] = useState(ca.color)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const dur = Number(h) * 60 + Number(m)
  const dirty = name !== ca.name || dur !== ca.duration_min || color !== ca.color

  async function save() {
    setBusy(true)
    await onSave({ name: name.trim(), duration_min: dur, color })
    setBusy(false)
  }

  return (
    <div className="ca-row">
      <span className="dot lg" style={{ background: color }} />
      <input className="ca-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên ca" />
      <div className="dur-input">
        <input type="number" min="0" value={h} onChange={(e) => setH(e.target.value)} /><span>h</span>
        <input type="number" min="0" max="59" step="5" value={m} onChange={(e) => setM(e.target.value)} /><span>ph</span>
      </div>
      <div className="color-swatches sm">
        {RENTER_COLORS.slice(0, 6).map((c) => (
          <button key={c} type="button" className={'swatch' + (color === c ? ' active' : '')} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
      </div>
      <button className="btn btn-sm btn-primary" disabled={!dirty || busy} onClick={save}>{busy ? '…' : 'Lưu'}</button>
      {confirm ? (
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(ca.id)}>Chắc chắn?</button>
      ) : (
        <button className="icon-btn sm" onClick={() => setConfirm(true)} aria-label="Xoá">✕</button>
      )}
    </div>
  )
}

function RoomRow({ room, onSave, onDelete }) {
  const [name, setName] = useState(room.name)
  const [color, setColor] = useState(room.color)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [err, setErr] = useState('')
  const dirty = name !== room.name || color !== room.color
  async function save() { setBusy(true); await onSave({ name: name.trim(), color }); setBusy(false) }
  async function del() {
    setBusy(true); setErr('')
    try { await onDelete(room.id) } catch { setErr('Phòng còn buổi thuê'); setBusy(false); setConfirm(false) }
  }
  return (
    <div className="room-row">
      <span className="dot lg" style={{ background: color }} />
      <input className="room-name-input" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="color-swatches sm">
        {RENTER_COLORS.slice(0, 6).map((c) => (
          <button key={c} type="button" className={'swatch' + (color === c ? ' active' : '')} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
      </div>
      <button className="btn btn-sm btn-primary" disabled={!dirty || busy} onClick={save}>{busy ? '…' : 'Lưu'}</button>
      {confirm ? (
        <button className="btn btn-sm btn-danger" onClick={del}>Chắc chắn?</button>
      ) : (
        <button className="icon-btn sm" onClick={() => setConfirm(true)} aria-label="Xoá">✕</button>
      )}
      {err && <span className="inline-err">{err}</span>}
    </div>
  )
}

export default function Settings() {
  const { rooms, caTypes, tasks, addRoom, updateRoom, deleteRoom, addCaType, updateCaType, deleteCaType, addTask, toggleTask, deleteTask } = useData()
  const { user, signOut } = useAuth()
  const [newTask, setNewTask] = useState('')
  const [notif, setNotif] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')

  // form thêm loại ca
  const [nName, setNName] = useState('')
  const [nH, setNH] = useState(1)
  const [nM, setNM] = useState(30)

  // form thêm phòng
  const [rName, setRName] = useState('')

  async function addRoomFn(e) {
    e.preventDefault()
    if (!rName.trim()) return
    await addRoom({ name: rName.trim(), color: RENTER_COLORS[rooms.length % RENTER_COLORS.length], sort: rooms.length + 1 })
    setRName('')
  }

  async function addCa(e) {
    e.preventDefault()
    if (!nName.trim()) return
    await addCaType({ name: nName.trim(), duration_min: Number(nH) * 60 + Number(nM), color: RENTER_COLORS[caTypes.length % RENTER_COLORS.length], sort: caTypes.length + 1 })
    setNName(''); setNH(1); setNM(30)
  }

  async function requestNotif() {
    if (typeof Notification === 'undefined') return
    setNotif(await Notification.requestPermission())
  }

  async function submitTask(e) {
    e.preventDefault()
    if (!newTask.trim()) return
    await addTask(newTask.trim())
    setNewTask('')
  }

  return (
    <div className="page settings">
      <div className="page-head"><h1>Cài đặt</h1></div>

      <section className="settings-block">
        <h3>Loại ca &amp; thời lượng</h3>
        <p className="muted sm">Loại ca chỉ xác định <b>thời lượng</b> buổi học. <b>Giá</b> đặt riêng cho từng giáo viên (mục <b>Người thuê</b>).</p>
        <div className="room-rows">
          {caTypes.map((c) => (
            <CaTypeRow key={c.id} ca={c} onSave={(d) => updateCaType(c.id, d)} onDelete={deleteCaType} />
          ))}
          {caTypes.length === 0 && <div className="empty sm">Chưa có loại ca nào.</div>}
        </div>
        <form className="ca-add" onSubmit={addCa}>
          <input value={nName} onChange={(e) => setNName(e.target.value)} placeholder="Tên loại ca (VD: Ca 1h30)" />
          <div className="dur-input">
            <input type="number" min="0" value={nH} onChange={(e) => setNH(e.target.value)} /><span>h</span>
            <input type="number" min="0" max="59" step="5" value={nM} onChange={(e) => setNM(e.target.value)} /><span>ph</span>
          </div>
          <button className="btn btn-sm btn-primary">＋ Thêm ca</button>
        </form>
      </section>

      <section className="settings-block">
        <h3>Phòng</h3>
        <p className="muted sm">Phòng chỉ dùng để xếp lịch (không ảnh hưởng tới tiền).</p>
        <div className="room-rows">
          {rooms.map((r) => <RoomRow key={r.id} room={r} onSave={(d) => updateRoom(r.id, d)} onDelete={deleteRoom} />)}
        </div>
        <form className="ca-add" onSubmit={addRoomFn}>
          <input value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Tên phòng mới (VD: Phòng vừa)" />
          <button className="btn btn-sm btn-primary">＋ Thêm phòng</button>
        </form>
      </section>

      <section className="settings-block">
        <h3>Việc cần làm</h3>
        <form className="task-add" onSubmit={submitTask}>
          <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Thêm việc cần làm…" />
          <button className="btn btn-sm btn-primary">Thêm</button>
        </form>
        <div className="task-list">
          {tasks.length === 0 && <div className="empty sm">Chưa có việc nào.</div>}
          {tasks.map((t) => (
            <div key={t.id} className={'task-item' + (t.done ? ' done' : '')}>
              <label className="checkbox">
                <input type="checkbox" checked={t.done} onChange={(e) => toggleTask(t.id, e.target.checked)} />
                <span>{t.content}</span>
              </label>
              <button className="icon-btn sm" onClick={() => deleteTask(t.id)} aria-label="Xoá">✕</button>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-block">
        <h3>Nhắc lịch</h3>
        <p className="muted sm">Khi bật, trình duyệt sẽ báo trước 15 phút mỗi buổi thuê (khi ứng dụng đang mở).</p>
        {notif === 'granted' ? (
          <div className="notif-status on">✅ Đã bật thông báo nhắc lịch</div>
        ) : notif === 'unsupported' ? (
          <div className="notif-status">Trình duyệt không hỗ trợ thông báo.</div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={requestNotif}>Bật thông báo nhắc lịch</button>
        )}
      </section>

      <section className="settings-block">
        <h3>Tài khoản</h3>
        <p className="muted sm">Đang đăng nhập: <b>{user?.email}</b></p>
        <button className="btn btn-ghost btn-sm" onClick={signOut}>Đăng xuất</button>
      </section>

      <p className="app-footer">Lịch thuê lớp · dữ liệu lưu an toàn trên Supabase · đồng bộ mọi thiết bị</p>
    </div>
  )
}
