# Task: Khắc phục lỗi Ghost-Click và Xây dựng Popup Xác nhận Chuẩn cho 3 Kiểu Xoá & 3 Kiểu Đổi

- **Ngày hoàn thành**: 2026-10-09
- **Trạng thái**: QA PASS (Đã nghiệm thu)
- **Người review / QA**: Gemini (BA + QA/Auditor)

---

### 1. Mục tiêu (Objective)
- Khắc phục triệt để lỗi ghost-click / click xuyên thấu do layout shift khi gỡ bỏ footer đột ngột, khiến popup xác nhận bị nháy và tự động kích hoạt xoá khi dùng chuột/touchpad.
- Thiết kế luồng xác nhận 2 bước (`form` → `scope` → `confirm`) minh bạch, an toàn cho cả **3 phạm vi xoá** và **3 phạm vi đổi thông tin**.

---

### 2. Các thay đổi chính (Implementation Details)
1. **Chống Click Xuyên Thấu (Click Guard)**:
   - Thêm `GUARD_MS = 400ms` và `confirmOpenedAt` ref trong `BookingModal.jsx`.
   - Vô hiệu hoá tạm thời mọi tương tác trong 400ms đầu tiên khi chuyển bước để triệt tiêu các sự kiện click trễ từ touchpad.
   - Luôn duy trì cấu trúc `modal-foot` (không huỷ bỏ đột ngột) để kích thước và vị trí modal luôn ổn định.
2. **Luồng Xác nhận 3 Kiểu Xoá**:
   - Bước 1 (Chọn phạm vi): *Chỉ buổi này*, *Từ buổi này trở đi*, *Toàn bộ chuỗi*.
   - Bước 2 (Xác nhận hành động): Hiển thị cảnh báo tóm tắt rõ phạm vi xoá ngày tháng cụ thể, có nút **[Xác nhận xoá]** và **[Quay lại]**. Bấm xác nhận mới thực thi.
3. **Luồng Xác nhận 3 Kiểu Đổi**:
   - Bước 1 (Chọn phạm vi): *Chỉ buổi này*, *Từ buổi này trở đi*, *Tất cả các buổi trong chuỗi*.
   - Bước 2 (Xác nhận hành động): Hiển thị tóm tắt phạm vi áp dụng, có nút **[Xác nhận lưu]** và **[Quay lại]**.
4. **Chuẩn hoá HTML & CSS**:
   - Gán `type="button"` tường minh cho tất cả các thẻ button trong `Modal.jsx` và `BookingModal.jsx`.
   - Thêm styling `.confirm-summary`, `.confirm-summary.is-danger` trong `styles.css`.

---

### 3. Kết quả Kiểm thử & Nghiệm thu (QA Audit)
- **Acceptance Criteria**: Đạt 7/7 tiêu chí.
- **Verification Gate**: `npm run build` PASS (0 errors, 0 warnings).
- **Tính an toàn**: Dữ liệu các tháng trước được bảo vệ tuyệt đối khi đổi phòng hoặc xoá từ ngày hiện tại về sau.
