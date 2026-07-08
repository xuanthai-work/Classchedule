import { useEffect, useRef, useState } from 'react'

// Popover dùng chung: ref bọc ngoài, tự đóng khi bấm ra ngoài / nhấn Esc,
// và định vị (fixed) ngay dưới trigger — tự lật lên trên nếu thiếu chỗ.
export function usePopover(width, height) {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ left: 0, top: 0 })

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

  function openPop() {
    const r = ref.current.getBoundingClientRect()
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8))
    let top = r.bottom + 6
    if (window.innerHeight - r.bottom < height + 12) top = Math.max(8, r.top - height - 6)
    setPos({ left, top })
    setOpen(true)
  }

  return { ref, open, setOpen, pos, openPop }
}
