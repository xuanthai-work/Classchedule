// Quản lý giao diện Sáng / Tối / Theo hệ thống
// - Lưu lựa chọn vào localStorage (classchedule_theme)
// - Áp dụng data-theme lên <html>: light / dark
// - Chế độ 'system' bỏ attribute để CSS @media (prefers-color-scheme) quyết định
// - Luồng chờ thay đổi của hệ điều hành khi ở chế độ 'system'
import { useEffect, useState } from 'react'

const KEY = 'classchedule_theme'
const THEMES = ['light', 'dark', 'system']
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

// Trả về theme người dùng đã chọn ('light' | 'dark' | 'system', mặc định 'system')
export function getTheme() {
  try {
    const v = localStorage.getItem(KEY)
    return THEMES.includes(v) ? v : 'system'
  } catch {
    return 'system'
  }
}

// Theme đang hiển thị thực tế ('system' sẽ được phân giải theo hệ điều hành)
export function effectiveTheme(theme = getTheme()) {
  if (theme === 'system') return media?.matches ? 'dark' : 'light'
  return theme
}

// Áp dụng data-theme lên document.documentElement
export function applyTheme(theme = getTheme()) {
  if (typeof document === 'undefined') return
  if (theme === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', theme)
}

let current = getTheme()
const listeners = new Set()

// Đặt theme mới: lưu localStorage, áp dụng ngay và báo cho các UI đang lắng nghe
export function setTheme(theme) {
  if (!THEMES.includes(theme)) return
  current = theme
  try { localStorage.setItem(KEY, theme) } catch { /* không lưu được thì vẫn áp dụng phiên */ }
  applyTheme(current)
  for (const fn of listeners) fn(current)
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Đổi nhanh Sáng ↔ Tối (dùng cho nút ☀️/🌙 trên Header)
export function toggleTheme() {
  setTheme(effectiveTheme(current) === 'dark' ? 'light' : 'dark')
}

// Hệ điều hành đổi sáng-tối khi đang ở chế độ 'system' → áp dụng lại ngay
media?.addEventListener('change', () => {
  if (getTheme() === 'system') applyTheme()
})

// Hook cho React: [theme đã chọn, theme thực tế, setTheme]
export function useTheme() {
  const [theme, setLocal] = useState(getTheme)
  useEffect(() => subscribe(setLocal), [])
  return [theme, effectiveTheme(theme), setTheme]
}
