# 🗓️ Lịch thuê lớp — Web quản lý cho thuê phòng học

Ứng dụng web (chạy trên cả máy tính và điện thoại) để quản lý việc cho thuê phòng học:
lịch đặt phòng, người thuê, tính tiền/doanh thu và nhắc lịch. Dữ liệu lưu trên **Supabase**
(đám mây, đồng bộ mọi thiết bị), giao diện xây bằng **React + Vite**.

---

## Chức năng
- **Lịch đặt phòng**: lưới tuần trên máy tính, danh sách theo ngày trên điện thoại; thêm/sửa/xoá buổi thuê; lọc theo phòng; lịch lặp hằng tuần; cảnh báo trùng phòng–trùng giờ.
- **Người thuê**: danh bạ, số điện thoại, ghi chú, màu nhận diện, tổng doanh thu từng người.
- **Doanh thu**: giá theo giờ mỗi phòng, tự tính tiền, đánh dấu đã/chưa thu, báo cáo theo tháng.
- **Nhắc lịch**: buổi hôm nay, thông báo trước 15 phút, danh sách việc cần làm.

---

## Cài đặt lần đầu (khoảng 10 phút)

### 1. Tạo dự án Supabase (miễn phí)
1. Vào https://supabase.com → đăng ký / đăng nhập → **New project**.
2. Đặt tên, chọn vùng gần (Singapore), đặt mật khẩu database → **Create**.

### 2. Tạo cơ sở dữ liệu + nạp dữ liệu mẫu
1. Trong Supabase, mở **SQL Editor** (biểu tượng `</>` bên trái).
2. Mở file [`supabase/schema.sql`](supabase/schema.sql), **copy toàn bộ**, dán vào rồi bấm **Run**.
3. Lệnh này tạo các bảng, bật bảo mật và nạp sẵn lịch tháng 7 từ file Excel của bạn.

### 3. Tạo tài khoản đăng nhập cho bạn
1. Mở **Authentication → Users → Add user → Create new user**.
2. Nhập **email** và **mật khẩu** bạn muốn dùng để đăng nhập → **Create user**.
   (Tài khoản này chính là tài khoản quản lý duy nhất của bạn.)

### 4. Lấy khoá kết nối và cấu hình
1. Mở **Project Settings → API**.
2. Copy 2 giá trị: **Project URL** và **anon public** key.
3. Trong thư mục dự án, tạo file tên `.env.local` (copy từ `.env.example`) với nội dung:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

### 5. Chạy web trên máy
```bash
npm install      # đã chạy sẵn — chỉ cần chạy lại nếu chưa
npm run dev
```
Mở trình duyệt tại địa chỉ hiện ra (thường là http://localhost:5173) và đăng nhập.

> 💡 Để mở trên **điện thoại** cùng mạng Wi-Fi: dùng địa chỉ dạng `http://192.168.x.x:5173`
> (Vite in ra sẵn ở dòng "Network"). Hoặc đưa lên Vercel ở bước dưới để mở từ bất cứ đâu.

---

## Đưa lên mạng để dùng mọi nơi (Vercel — miễn phí)
1. Đưa mã nguồn lên GitHub (hoặc dùng Vercel CLI).
2. Vào https://vercel.com → **Add New Project** → chọn repo này.
3. Ở phần **Environment Variables**, thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`
   (đúng 2 giá trị như trong `.env.local`).
4. **Deploy**. Sau đó bạn có một đường link mở được trên điện thoại lẫn máy tính, luôn đồng bộ.

Trên điện thoại, mở link đó → menu trình duyệt → **Thêm vào màn hình chính** để dùng như một app.

---

## Ghi chú quan trọng
- **Giá thuê mặc định** đang là số tạm (Phòng nhỏ 80.000đ/giờ, Phòng to 120.000đ/giờ).
  Hãy vào **Cài đặt → Phòng & giá thuê** sửa lại cho đúng — tiền mỗi buổi tự tính lại theo giá mới.
- Muốn xoá dữ liệu mẫu và nhập lại từ đầu: xoá dòng trong các bảng ở Supabase (Table Editor).
- Mọi thay đổi được lưu ngay lên Supabase và đồng bộ realtime giữa các thiết bị đang mở.

## Lệnh thường dùng
| Lệnh | Tác dụng |
|------|----------|
| `npm run dev` | Chạy bản phát triển trên máy |
| `npm run build` | Đóng gói bản chạy thật (thư mục `dist/`) |
| `npm run preview` | Xem thử bản đã đóng gói |
