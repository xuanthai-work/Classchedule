// Bảng màu pastel — nhạt, dễ nhìn (chữ tự chuyển sang màu đậm qua readableText)
export const RENTER_COLORS = [
  '#F3A8A2', // đỏ pastel
  '#F6C48C', // cam pastel
  '#EFD98C', // vàng pastel
  '#C7E39B', // lá mạ pastel
  '#A8DEB1', // xanh lá pastel
  '#9EDBD0', // mòng két pastel
  '#A5D2EC', // cyan pastel
  '#AAC4EE', // xanh dương pastel
  '#BEC0EE', // chàm pastel
  '#D3B8E8', // tím pastel
  '#EEB4DC', // hồng pastel
  '#F2AEC0', // hồng đỏ pastel
]

// Chọn màu chữ (trắng/đen) đọc rõ nhất trên nền màu bất kỳ
export function readableText(hex) {
  if (!hex || hex[0] !== '#' || hex.length < 7) return '#ffffff'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#1f2a33' : '#ffffff'
}

// Khung giờ hiển thị trên lưới lịch (phút)
export const DAY_START_MIN = 7 * 60 // 07:00
export const DAY_END_MIN = 22 * 60 // 22:00
export const SLOT_MIN = 30 // mỗi ô 30 phút
