// Tiện ích ngày giờ — dùng giờ địa phương, không phụ thuộc thư viện ngoài

const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
const WEEKDAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export const pad2 = (n) => String(n).padStart(2, '0')

// Date -> 'YYYY-MM-DD' (theo giờ địa phương)
export function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

// 'YYYY-MM-DD' -> Date (00:00 giờ địa phương)
export function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// Thứ Hai của tuần chứa ngày d
export function mondayOf(d) {
  const day = (d.getDay() + 6) % 7 // 0 = Thứ Hai
  return addDays(startOfDay(d), -day)
}

export function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export const weekdayName = (d) => WEEKDAYS[d.getDay()]
export const weekdayShort = (d) => WEEKDAYS_SHORT[d.getDay()]

export const fmtDayMonth = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`

// Nhãn tuần: "06/07 – 12/07/2026"
export function weekLabel(monday) {
  const sun = addDays(monday, 6)
  return `${fmtDayMonth(monday)} – ${fmtDayMonth(sun)}/${sun.getFullYear()}`
}

// '14:30:00' | '14:30' -> phút trong ngày (số)
export function timeToMinutes(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(mins) {
  return `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`
}

// '14:30:00' | '14:30' -> '14h30' | '14h'
export function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`
}

// '14:30:00' -> '14:30' (cho input type=time)
export const toHM = (t) => (t ? t.slice(0, 5) : '')

// Số giờ giữa 2 mốc 'HH:MM'
export function durationHours(start, end) {
  return Math.max(0, (timeToMinutes(end) - timeToMinutes(start)) / 60)
}

// 'HH:MM' + số phút -> 'HH:MM'
export function addMinutesToTime(hhmm, mins) {
  const total = timeToMinutes(hhmm) + (Number(mins) || 0)
  return minutesToTime(Math.max(0, Math.min(total, 24 * 60 - 1)))
}

// 90 -> '1h30', 150 -> '2h30', 120 -> '2h'
export function fmtDuration(mins) {
  const m = Number(mins) || 0
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}h${pad2(r)}` : `${h}h`
}
