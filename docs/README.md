# Tài liệu Dự án (Project Documentation)

Thư mục này lưu trữ tài liệu kỹ thuật, kiến trúc và lịch sử các task đã hoàn thành và nghiệm thu (QA PASS) của dự án **Lịch thuê lớp (Classchedule)**.

## Cấu trúc

```text
docs/
├── README.md        # Mục lục và tổng quan tài liệu
└── tasks/           # Lưu trữ chi tiết các task đã hoàn thành & QA pass
```

## Quy trình cập nhật tài liệu

1. **Phân tích & Lên kế hoạch (BA)**: Yêu cầu được phân tích, chốt giải pháp và đưa vào `justdoit.md`.
2. **Thực thi (Developer Agent)**: Developer Agent thực hiện code theo `justdoit.md`.
3. **Kiểm thử & Đánh giá (QA / Auditor)**: Gemini audit code, kiểm tra acceptance criteria và chạy build verification.
4. **Lưu trữ tài liệu**: Chỉ khi task **QA PASS**, task đó mới được chuyển từ `justdoit.md` vào `docs/tasks/<task-name>.md` và cập nhật danh sách bên dưới.

## Danh sách Task đã hoàn thành

- [2026-10-09: Khắc phục lỗi Ghost-Click và Xây dựng Popup Xác nhận Chuẩn cho 3 Kiểu Xoá & 3 Kiểu Đổi](tasks/2026-10-09-fix-ghost-click-and-2-step-confirm.md) — QA PASS
- [2026-10-09: Loại bỏ Nút Đóng '✕' ở Header cho Modal Buổi Thuê (BookingModal)](tasks/2026-10-09-hide-close-button-in-booking-modal.md) — QA PASS

