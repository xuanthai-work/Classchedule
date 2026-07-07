import { useEffect, useRef, useState } from 'react'
import { minutesToTime } from '../lib/date'

export default function TimePicker({ value, onChange, startMin = 6 * 60, endMin = 22 * 60, step = 15 }) {
  const ref = useRef(null)
  const listRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ left: 0, top: 0 })

  const options = []
  for (let m = startMin; m <= endMin; m += step) options.push(minutesToTime(m))

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const c = listRef.current
    const el = c?.querySelector('.tp-opt.sel')
    if (c && el) c.scrollTop = el.offsetTop - c.clientHeight / 2 + el.clientHeight / 2
  }, [open])

  function openPop() {
    const r = ref.current.getBoundingClientRect()
    const W = 130, H = 248
    const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8))
    let top = r.bottom + 6
    if (window.innerHeight - r.bottom < H + 12) top = Math.max(8, r.top - H - 6)
    setPos({ left, top })
    setOpen(true)
  }

  return (
    <div className="timepicker" ref={ref}>
      <button type="button" className="dp-trigger" onClick={() => (open ? setOpen(false) : openPop())}>
        <span>{value || '--:--'}</span>
        <span className="dp-cal" aria-hidden>🕐</span>
      </button>
      {open && (
        <div className="tp-pop" style={{ left: pos.left, top: pos.top }} ref={listRef}>
          {options.map((t) => (
            <button
              key={t}
              type="button"
              className={'tp-opt' + (t === value ? ' sel' : '')}
              onClick={() => { onChange(t); setOpen(false) }}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
