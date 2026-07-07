import { useEffect, useRef } from 'react'
import { useData } from '../context/DataContext'
import { toISODate, timeToMinutes, fmtTime } from './date'

// Bắn thông báo trình duyệt khi buổi thuê sắp bắt đầu (trong 15 phút tới),
// chỉ khi ứng dụng đang mở và người dùng đã cho phép thông báo.
export function useReminders() {
  const { bookings, rentersById, roomsById } = useData()
  const notified = useRef(new Set())

  useEffect(() => {
    if (!('Notification' in window)) return
    const tick = () => {
      if (Notification.permission !== 'granted') return
      const now = new Date()
      const todayISO = toISODate(now)
      const nowMin = now.getHours() * 60 + now.getMinutes()
      for (const b of bookings) {
        if (b.date !== todayISO) continue
        const diff = timeToMinutes(b.start_time) - nowMin
        if (diff >= 0 && diff <= 15 && !notified.current.has(b.id)) {
          notified.current.add(b.id)
          const who = rentersById[b.renter_id]?.name || 'Buổi thuê'
          const room = roomsById[b.room_id]?.name || ''
          try {
            new Notification('🔔 Sắp tới buổi thuê', { body: `${who} · ${fmtTime(b.start_time)} · ${room}` })
          } catch { /* ignore */ }
        }
      }
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [bookings, rentersById, roomsById])
}
