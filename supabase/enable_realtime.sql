-- Bật Realtime cho các bảng (để dữ liệu đồng bộ tức thì giữa các thiết bị).
-- Chạy 1 lần trong Supabase → SQL Editor. An toàn: bảng nào đã bật sẽ được bỏ qua.
do $$
declare t text;
begin
  foreach t in array array['rooms','ca_types','renters','renter_prices','bookings','tasks'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
