// Định dạng tiền Việt Nam
export function fmtVND(n) {
  const v = Math.round(Number(n) || 0)
  return v.toLocaleString('vi-VN') + 'đ'
}

// Rút gọn: 1.150.000 -> "1.150k", 12.000.000 -> "12,0tr"
export function fmtShort(n) {
  const v = Math.round(Number(n) || 0)
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.', ',') + 'tr'
  if (v >= 1_000) return Math.round(v / 1_000) + 'k'
  return String(v)
}
