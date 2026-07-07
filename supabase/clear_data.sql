-- =====================================================================
--  DỌN DỮ LIỆU MẪU để bắt đầu nhập lịch thật.
--  Chạy trong Supabase → SQL Editor.
--  GIỮ LẠI: giáo viên (renters), phòng (rooms), loại ca (ca_types), bảng giá (renter_prices).
--  XOÁ:     toàn bộ lịch thuê (bookings) và việc cần làm (tasks).
-- =====================================================================

delete from bookings;
delete from tasks;

-- (Tuỳ chọn) Nếu muốn xoá luôn bảng giá tạm để nhập lại từ đầu,
-- bỏ dấu "--" ở đầu dòng dưới rồi chạy:
-- delete from renter_prices;
