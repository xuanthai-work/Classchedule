// Bảng màu đậm, tương phản cao — phân bổ tách bạch theo góc quang phổ,
// không chìm trên nền Dark mode, không lóa trên nền Light mode
// (chữ tự chọn màu tương phản cao nhất qua readableText)
export const RENTER_COLORS = [
  '#E04848', // 1. Đỏ son (Crimson)
  '#D2533C', // 2. Đỏ gạch nung
  '#E86E25', // 3. Cam tươi (Tangerine)
  '#E0851B', // 4. Cam hổ phách
  '#CCA01A', // 5. Vàng nghệ đậm
  '#A8B81B', // 6. Vàng chanh đậm
  '#6FB028', // 7. Xanh cốm tươi
  '#3B9E48', // 8. Xanh táo / Lá tươi
  '#1E9472', // 9. Xanh ngọc lục bảo
  '#128896', // 10. Xanh mòng két đậm
  '#179CB8', // 11. Xanh ngọc lam
  '#1A96D4', // 12. Xanh cyan biển
  '#2B82D9', // 13. Xanh da trời sâu
  '#3B72D4', // 14. Xanh đại dương
  '#5063BF', // 15. Xanh chàm (Indigo)
  '#7B62D0', // 16. Xanh tím tử đinh hương
  '#9754C7', // 17. Tím thạch anh
  '#B049B2', // 18. Tím hoa cà phong lan
  '#C73673', // 19. Hồng cánh sen đậm
  '#D64972', // 20. Hồng đào đậm
  '#DC5B52', // 21. Hồng san hô tươi
  '#AC663B', // 22. Nâu caramel ấm
  '#94614D', // 23. Nâu đất / Quế
  '#546F7E', // 24. Xám xanh Slate
]

// Độ sáng tương đối theo chuẩn WCAG 2.1:
// L = 0.2126·R + 0.7152·G + 0.0722·B (kênh sRGB được tuyến tính hoá trước)
function relativeLuminance(r, g, b) {
  const lin = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// Chọn màu chữ có tỷ lệ tương phản cao nhất trên nền màu bất kỳ:
// đen than #15211D (khớp --ink của app) hoặc trắng #FFFFFF
export function readableText(hex) {
  if (!hex || hex[0] !== '#' || hex.length < 7) return '#ffffff'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const L = relativeLuminance(r, g, b)
  const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  const dark = relativeLuminance(0x15, 0x21, 0x1d) // #15211D
  const white = 1 // #FFFFFF: L = 1.0
  return contrast(L, dark) >= contrast(L, white) ? '#15211D' : '#ffffff'
}

// Khung giờ hiển thị trên lưới lịch (phút)
export const DAY_START_MIN = 7 * 60 // 07:00
export const DAY_END_MIN = 22 * 60 // 22:00
export const SLOT_MIN = 30 // mỗi ô 30 phút
