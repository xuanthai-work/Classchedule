# Task: Tối Ưu 24 Màu Tương Phản Chuẩn WCAG và Bổ Sung Bộ Chuyển Giao Diện (Theme Switcher Sáng / Tối)

- **Ngày hoàn thành**: 2026-10-26
- **Người thực hiện**: Developer Agent (OpenCode)
- **Người review / QA**: Gemini (BA + QA/Auditor)
- **Kết quả QA**: **PASS**

---

## 1. Objective (Mục tiêu)
1. Hiệu chuẩn lại toàn bộ 24 màu người thuê (`RENTER_COLORS`) phân bổ tách bạch theo quang phổ, độ sáng an toàn không chìm trên nền Dark mode và không lóa trên nền Light mode.
2. Nâng cấp thuật toán `readableText` theo chuẩn độ tương phản WCAG 2.1 động (tự động chọn giữa chữ đen than `#15211D` và chữ trắng `#FFFFFF`).
3. Bổ sung bộ chuyển đổi giao diện (Theme Switcher: Sáng / Tối / Tự động theo hệ thống) trên thanh Header và trong trang Cài đặt, lưu cấu hình vào `localStorage`.

---

## 2. Scope & Implementation Detail
- [`src/lib/constants.js`](file:///D:/work/Linh/Classchedule/src/lib/constants.js):
  - Cập nhật 24 mã màu quang phổ phân bổ đều, độ sáng $0.18 - 0.45$, loại bỏ tình trạng pastel nhợt nhạt hoặc khó phân biệt.
  - Thuật toán `readableText(hex)` chuyển sang tính độ sáng tương đối sRGB đã tuyến tính hoá theo chuẩn WCAG 2.1 và so sánh độ tương phản trực tiếp với `#15211D` và `#FFFFFF`.
- [`src/lib/theme.js`](file:///D:/work/Linh/Classchedule/src/lib/theme.js):
  - Tạo module quản lý theme với bộ 3 lựa chọn `'light' | 'dark' | 'system'`.
  - Cung cấp hook `useTheme()`, các hàm `setTheme()`, `toggleTheme()`, `applyTheme()`, `effectiveTheme()`.
  - Lắng nghe sự kiện `prefers-color-scheme` khi ở chế độ hệ thống.
- [`index.html`](file:///D:/work/Linh/Classchedule/index.html):
  - Thêm inline script đọc `localStorage` và set `data-theme` trước khi React mount, loại bỏ triệt để hiện tượng nháy nền (FOUC).
- [`src/components/Layout.jsx`](file:///D:/work/Linh/Classchedule/src/components/Layout.jsx):
  - Bổ sung nút chuyển nhanh theme `☀️ / 🌙` (`.icon-btn.theme-toggle`) trên thanh Topbar.
- [`src/pages/Settings.jsx`](file:///D:/work/Linh/Classchedule/src/pages/Settings.jsx):
  - Thêm khối cấu hình "Giao diện" với 3 nút bấm: `[ ☀️ Sáng ] [ 🌙 Tối ] [ 💻 Hệ thống ]`.
- [`src/styles.css`](file:///D:/work/Linh/Classchedule/src/styles.css):
  - Thêm đường viền `border: 1px solid rgba(0,0,0,.08); border-left: 3px solid rgba(0,0,0,.22);` và bóng nhẹ cho `.cal-block`.
  - Bổ sung CSS selector cho dark mode: `border-color: rgba(255,255,255,.14); border-left-color: rgba(255,255,255,.28);`.
  - Styling bộ chọn theme (`.theme-options`, `.theme-opt`, `.theme-opt.active`).
- [`src/pages/Calendar.jsx`](file:///D:/work/Linh/Classchedule/src/pages/Calendar.jsx):
  - Bỏ inline `borderLeftColor` để CSS class `.cal-block` quản lý viền đồng bộ.

---

## 3. Acceptance Criteria Checklist
- [x] 24 màu người thuê phân biệt rõ ràng, không có màu nào bị trùng/bết vào nhau.
- [x] Chữ trên ô lịch (tên giáo viên, giờ học, phòng học) hiển thị sắc nét, tương phản tốt trên cả 24 màu.
- [x] Ô lịch trên bảng lịch có đường viền tách biệt, không bị chìm vào nền trắng (Light mode) hay nền đen (Dark mode).
- [x] Có nút đổi nhanh theme ☀️/🌙 trên thanh Header.
- [x] Có khối cài đặt theme đầy đủ (Sáng / Tối / Hệ thống) trong trang Cài đặt.
- [x] Bấm đổi theme chuyển đổi ngay lập tức không cần tải lại trang.
- [x] F5 tải lại trang vẫn lưu đúng theme đã chọn (qua `localStorage`).
- [x] `npm run build` PASS 100% không có lỗi biên dịch.

---

## 4. Verification Gate
- Build command: `npm run build` -> **PASS (0 errors, 1.33s)**.
