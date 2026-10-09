# Task: Loại bỏ Nút Đóng '✕' ở Header cho Modal Buổi Thuê (BookingModal)

- **Ngày hoàn thành**: 2026-10-09
- **Trạng thái**: QA PASS (Đã nghiệm thu)
- **Người review / QA**: Gemini (BA + QA/Auditor)

---

### 1. Mục tiêu (Objective)
Loại bỏ nút đóng `✕` ở góc trên bên phải của `BookingModal` để giao diện gọn gàng, tránh dư thừa với nút "Huỷ" (ở form) và nút "Quay lại" (ở các bước xác nhận), giúp hành vi điều hướng bước được nhất quán.

---

### 2. Các thay đổi chính (Implementation Details)
1. **[`src/components/Modal.jsx`](file:///D:/work/Linh/Classchedule/src/components/Modal.jsx)**:
   - Bổ sung prop `showClose = true` (mặc định hiển thị nút `✕`).
   - Điều kiện render: `{showClose && <button type="button" className="icon-btn" ...>✕</button>}`.
2. **[`src/components/BookingModal.jsx`](file:///D:/work/Linh/Classchedule/src/components/BookingModal.jsx)**:
   - Truyền `showClose={false}` khi gọi `<Modal>`.
   - Giữ nguyên các cơ chế đóng an toàn khác: nút "Huỷ" ở chân trang, phím `Escape`, và click ra ngoài backdrop.

---

### 3. Kết quả Kiểm thử & Nghiệm thu (QA Audit)
- **Acceptance Criteria**: Đạt 6/6 tiêu chí.
- **Verification Gate**: `npm run build` PASS (0 errors, 0 warnings).
- **Kháng hồi quy**: Modal xem chi tiết doanh thu (`Revenue.jsx`) và sửa người thuê (`RenterModal.jsx`) không bị ảnh hưởng, vẫn có nút `✕` bình thường.
