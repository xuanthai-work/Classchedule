import { useState } from 'react'
import { parseISODate, toISODate, addDays, pad2, startOfDay, isSameDay } from '../lib/date'
import { usePopover } from '../lib/usePopover'

const WD = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const fmt = (v) => {
  if (!v) return ''
  const d = parseISODate(v)
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

export default function DatePicker({ value, onChange, min, placeholder = 'Chọn ngày' }) {
  const { ref, open, setOpen, pos, openPop } = usePopover(268, 336)
  const b0 = value ? parseISODate(value) : new Date()
  const [view, setView] = useState({ y: b0.getFullYear(), m: b0.getMonth() })

  function openCalendar() {
    const b = value ? parseISODate(value) : new Date()
    setView({ y: b.getFullYear(), m: b.getMonth() })
    openPop()
  }

  const minD = min ? startOfDay(parseISODate(min)) : null
  const sel = value ? parseISODate(value) : null
  const today = new Date()

  const first = new Date(view.y, view.m, 1)
  const lead = (first.getDay() + 6) % 7
  const start = addDays(first, -lead)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i))

  function pick(d) {
    if (minD && startOfDay(d) < minD) return
    onChange(toISODate(d))
    setOpen(false)
  }
  const prev = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))
  const next = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))

  return (
    <div className="datepicker" ref={ref}>
      <button type="button" className={'dp-trigger' + (value ? '' : ' empty')} onClick={() => (open ? setOpen(false) : openCalendar())}>
        <span>{value ? fmt(value) : placeholder}</span>
        <span className="dp-cal" aria-hidden>🗓️</span>
      </button>

      {open && (
        <div className="dp-pop" style={{ left: pos.left, top: pos.top }}>
          <div className="dp-head">
            <button type="button" className="icon-btn sm" onClick={prev} aria-label="Tháng trước">‹</button>
            <span className="dp-title">Tháng {view.m + 1} / {view.y}</span>
            <button type="button" className="icon-btn sm" onClick={next} aria-label="Tháng sau">›</button>
          </div>
          <div className="dp-grid dp-wd">{WD.map((w) => <span key={w} className="dp-wdc">{w}</span>)}</div>
          <div className="dp-grid">
            {cells.map((d, i) => {
              const other = d.getMonth() !== view.m
              const disabled = minD && startOfDay(d) < minD
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  className={'dp-day' + (other ? ' other' : '') + (sel && isSameDay(d, sel) ? ' sel' : '') + (isSameDay(d, today) ? ' today' : '') + (disabled ? ' disabled' : '')}
                  onClick={() => pick(d)}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
          <div className="dp-foot">
            <button type="button" className="dp-link" onClick={() => { const t = new Date(); setView({ y: t.getFullYear(), m: t.getMonth() }); pick(t) }}>Hôm nay</button>
          </div>
        </div>
      )}
    </div>
  )
}
