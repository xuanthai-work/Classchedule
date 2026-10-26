# Task: Tích hợp Nhận Diện Thương Hiệu Concept 1 (Logo Classchedule) vào Giao Diện Header

- **Ngày hoàn thành**: 2026-10-26
- **Trạng thái**: QA PASS (Đã nghiệm thu)
- **Người review / QA**: Gemini (BA + QA/Auditor)

---

### 1. Mục tiêu (Objective)
Thay thế biểu tượng emoji tạm thời `🗓️` trên thanh điều hướng chính (`topbar-brand`) bằng logo chính thức Concept 1 (Khối phòng học & Lịch đa tầng - Isometric Cube Monogram), hiển thị sắc nét, chuyên nghiệp và đồng bộ nhận diện thương hiệu Classchedule trên cả Desktop và Mobile.

---

### 2. Các thay đổi chính (Implementation Details)
1. **[`src/components/Layout.jsx`](file:///D:/work/Linh/Classchedule/src/components/Layout.jsx)**:
   - Thay thế emoji `🗓️` bằng thẻ `<img src="/favicon.svg" alt="Classchedule Logo" width="28" height="28" />`.
   - Cập nhật tên thương hiệu thành `Classchedule`.
   - Bổ sung tương tác bấm logo để quay lại màn hình Lịch (`onClick={() => setView('calendar')}`), hỗ trợ đầy đủ phím bấm `Enter` / `Space` chuẩn accessibility.
2. **[`src/styles.css`](file:///D:/work/Linh/Classchedule/src/styles.css)**:
   - Tinh chỉnh `.topbar-brand` với `cursor: pointer`.
   - Bổ sung style cho `.brand-mark img` (kích thước `28x28px`, `border-radius: 8px`, `object-fit: contain`).
   - Hỗ trợ `:focus-visible` cho bàn phím với outline màu xanh chủ đạo `#0E7C6B`.
3. **[`public/favicon.svg`](file:///D:/work/Linh/Classchedule/public/favicon.svg) & [`public/logo.svg`](file:///D:/work/Linh/Classchedule/public/logo.svg)**:
   - Đồng bộ file logo vector sắc nét theo đúng thiết kế Concept 1.

---

### 3. Kết quả Kiểm thử & Nghiệm thu (QA Audit)
- **Acceptance Criteria**: Đạt 4/4 tiêu chí.
- **Verification Gate**: `npm run build` PASS (0 errors, 0 warnings).
- **Kháng hồi quy**: Không làm xô lệch các nút menu tab trên thanh topbar và bottomnav trên mobile.
