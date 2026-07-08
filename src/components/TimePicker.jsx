import { useEffect, useRef } from 'react'
import { minutesToTime } from '../lib/date'
import { usePopover } from '../lib/usePopover'

export default function TimePicker({ value, onChange, startMin = 6 * 60, endMin = 22 * 60, step = 15 }) {
  const { ref, open, setOpen, pos, openPop } = usePopover(130, 248)
  const listRef = useRef(null)

  const options = []
  for (let m = startMin; m <= endMin; m += step) options.push(minutesToTime(m))

  useEffect(() => {
    if (!open) return
    const c = listRef.current
    const el = c?.querySelector('.tp-opt.sel')
    if (c && el) c.scrollTop = el.offsetTop - c.clientHeight / 2 + el.clientHeight / 2
  }, [open])

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
