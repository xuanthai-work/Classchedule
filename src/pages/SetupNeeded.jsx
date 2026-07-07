export default function SetupNeeded() {
  return (
    <div className="center-screen">
      <div className="card setup">
        <div className="brand-badge">🗓️</div>
        <h1>Cần cấu hình Supabase</h1>
        <p>Ứng dụng chưa kết nối được cơ sở dữ liệu. Hãy làm theo các bước sau:</p>
        <ol>
          <li>Tạo dự án miễn phí tại <b>supabase.com</b></li>
          <li>Vào <b>Project Settings → API</b>, sao chép <b>Project URL</b> và <b>anon public key</b></li>
          <li>Trong thư mục dự án, tạo file <code>.env.local</code> với nội dung:</li>
        </ol>
        <pre>VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...</pre>
        <ol start="4">
          <li>Chạy file <code>supabase/schema.sql</code> trong <b>SQL Editor</b> của Supabase</li>
          <li>Khởi động lại lệnh <code>npm run dev</code></li>
        </ol>
        <p className="muted">Chi tiết đầy đủ có trong file <code>README.md</code>.</p>
      </div>
    </div>
  )
}
