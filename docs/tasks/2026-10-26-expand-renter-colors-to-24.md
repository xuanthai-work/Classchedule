# Task: Mở rộng Bảng Màu Nhận Diện Người Thuê Lên 24 Màu Tuyển Chọn

- **Ngày hoàn thành**: 2026-10-26
- **Trạng thái**: QA PASS (Đã nghiệm thu)
- **Người review / QA**: Gemini (BA + QA/Auditor)

---

### 1. Mục tiêu (Objective)
Mở rộng danh sách màu nhận diện người thuê (`RENTER_COLORS`) từ 12 màu lên 24 màu pastel tuyển chọn, giúp phân biệt rõ ràng và không bị trùng lặp màu khi số lượng giáo viên/người thuê tăng lên, đồng thời đảm bảo màu chữ trên lịch vẫn tương phản rõ nét qua thuật toán `readableText`.

---

### 2. Các thay đổi chính (Implementation Details)
1. **[`src/lib/constants.js`](file:///D:/work/Linh/Classchedule/src/lib/constants.js)**:
   - Giữ nguyên 12 màu pastel đầu tiên (index 0 - 11) để bảo toàn màu của các người thuê đã tạo trước đó.
   - Thêm 12 màu pastel mới (index 12 - 23): hồng đất (`#F5B7B1`), hổ phách (`#F8C471`), vàng kem (`#F9E79F`), bạc hà (`#D4EFDF`), xanh ngọc (`#A3E4D7`), bọt biển (`#A2D9CE`), xanh baby (`#AED6F1`), đại dương (`#85C1E9`), thạch anh (`#BB8FCE`), tử đinh hương (`#E8DAEF`), cam đất (`#EDBB99`), xám bạc (`#CCD1D1`).
2. **Khả năng tương thích & Độ tương phản**:
   - Kiểm tra thuật toán `readableText`: Toàn bộ 24 màu đều đạt độ sáng chuẩn và tự động hiển thị chữ tối (`#1f2a33`) trên nền lịch, đảm bảo không bị mờ/chìm chữ.
   - Component `ColorSwatches.jsx` trong `RenterModal` tự động hiển thị đủ 24 màu mà không cần thay đổi code UI.

---

### 3. Kết quả Kiểm thử & Nghiệm thu (QA Audit)
- **Acceptance Criteria**: Đạt 5/5 tiêu chí.
- **Verification Gate**: `npm run build` PASS (0 errors, 0 warnings).
- **Kháng hồi quy**: Người thuê cũ không bị đổi màu, `Settings.jsx` cho phòng và loại ca vẫn giữ giới hạn 6 màu qua prop `count={6}`.
