-- =====================================================================
--  LỊCH THUÊ LỚP — Cấu trúc CSDL + dữ liệu mẫu tháng 7/2026
--  Mô hình: GIÁ theo GIÁO VIÊN × LOẠI CA × PHÒNG.
--           Mỗi buổi = số ca × giá(giáo viên, loại ca, phòng).
--           Loại ca chỉ định thời lượng buổi học.
--  Cách dùng: Supabase → SQL Editor → dán toàn bộ → Run.
--  ⚠️ File này XOÁ và TẠO LẠI toàn bộ bảng (dùng khi mới cài / còn dữ liệu mẫu).
-- =====================================================================

create extension if not exists pgcrypto;

drop table if exists tasks          cascade;
drop table if exists bookings       cascade;
drop table if exists renter_prices  cascade;
drop table if exists ca_types       cascade;
drop table if exists renters        cascade;
drop table if exists rooms          cascade;

-- ---------- Bảng ----------
create table rooms (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  color text not null default '#0E7C6B',
  sort  int  not null default 0
);

create table ca_types (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  duration_min int  not null default 90,     -- thời lượng 1 ca (phút)
  color        text not null default '#0E7C6B',
  sort         int  not null default 0
);

create table renters (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  phone      text default '',
  note       text default '',
  color      text not null default '#0E7C6B',
  created_at timestamptz not null default now()
);

-- Bảng giá: giá theo GIÁO VIÊN × LOẠI CA × PHÒNG
create table renter_prices (
  renter_id  uuid not null references renters(id)  on delete cascade,
  ca_type_id uuid not null references ca_types(id) on delete cascade,
  room_id    uuid not null references rooms(id)    on delete cascade,
  price      numeric not null default 0,
  primary key (renter_id, ca_type_id, room_id)
);

create table bookings (
  id         uuid primary key default gen_random_uuid(),
  renter_id  uuid not null references renters(id)  on delete restrict,
  room_id    uuid not null references rooms(id)    on delete restrict,
  ca_type_id uuid not null references ca_types(id) on delete restrict,
  ca_count   int  not null default 1,             -- số ca trong buổi (1 hoặc 2)
  date       date not null,
  start_time time not null,
  end_time   time not null,                        -- tự tính = start + thời lượng ca × số ca
  note       text default '',
  paid       boolean not null default false,
  series_id  uuid,
  created_at timestamptz not null default now()
);
create index bookings_date_idx on bookings(date);

create table tasks (
  id         uuid primary key default gen_random_uuid(),
  content    text not null,
  done       boolean not null default false,
  booking_id uuid references bookings(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- Bảo mật: chỉ tài khoản đã đăng nhập ----------
alter table rooms         enable row level security;
alter table ca_types      enable row level security;
alter table renters       enable row level security;
alter table renter_prices enable row level security;
alter table bookings      enable row level security;
alter table tasks         enable row level security;

create policy "auth all rooms"         on rooms         for all to authenticated using (true) with check (true);
create policy "auth all ca_types"      on ca_types      for all to authenticated using (true) with check (true);
create policy "auth all renters"       on renters       for all to authenticated using (true) with check (true);
create policy "auth all renter_prices" on renter_prices for all to authenticated using (true) with check (true);
create policy "auth all bookings"      on bookings      for all to authenticated using (true) with check (true);
create policy "auth all tasks"         on tasks         for all to authenticated using (true) with check (true);

-- ---------- Bật Realtime (đồng bộ nhiều thiết bị) ----------
do $$
declare t text;
begin
  foreach t in array array['rooms','ca_types','renters','renter_prices','bookings','tasks'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;  -- đã bật rồi thì bỏ qua
    end;
  end loop;
end $$;

-- ---------- Dữ liệu mẫu ----------
insert into rooms (name, color, sort) values
  ('Phòng nhỏ', '#0E7C6B', 1),
  ('Phòng to',  '#B8720F', 2);

-- Loại ca (chỉ định thời lượng)
insert into ca_types (name, duration_min, color, sort) values
  ('Ca 1h30', 90,  '#0E7C6B', 1),
  ('Ca 2h30', 150, '#B8720F', 2);

insert into renters (name, color) values
  ('Natuan',          '#A8DEB1'),
  ('Diệu Liên',       '#F6C48C'),
  ('Cô Hà Hoá',       '#AAC4EE'),
  ('Cô Hà Địa',       '#EEB4DC'),
  ('K78 Lý 2',        '#F3A8A2'),
  ('Cô Hường',        '#9EDBD0'),
  ('Cô Mai Sinh 2',   '#EFD98C'),
  ('12 chuyên Pháp',  '#BEC0EE');

-- Bảng giá TẠM cho mọi giáo viên × loại ca × phòng (hãy sửa từng giáo viên cho đúng)
insert into renter_prices (renter_id, ca_type_id, room_id, price)
select r.id, ct.id, rm.id,
       case ct.name when 'Ca 1h30' then 150000 when 'Ca 2h30' then 250000 else 0 end
from renters r cross join ca_types ct cross join rooms rm;

-- Lịch tháng 7 (end_time tự tính từ loại ca × số ca)
insert into bookings (renter_id, room_id, ca_type_id, ca_count, date, start_time, end_time, note)
select r.id, rm.id, ct.id, v.cnt, v.d::date, v.s::time,
       (v.s::time + (ct.duration_min * v.cnt) * interval '1 minute')::time,
       v.note
from (values
  -- Tuần 1
  ('Natuan','Phòng nhỏ','Ca 1h30',2,'2026-07-02','08:30',''),
  ('Diệu Liên','Phòng nhỏ','Ca 1h30',2,'2026-07-01','14:00',''),
  ('Cô Hà Hoá','Phòng to','Ca 1h30',1,'2026-07-05','14:00',''),
  ('K78 Lý 2','Phòng to','Ca 1h30',1,'2026-07-02','15:30',''),
  ('K78 Lý 2','Phòng to','Ca 1h30',1,'2026-07-03','15:30',''),
  ('Cô Hà Địa','Phòng to','Ca 1h30',2,'2026-07-01','18:00',''),
  ('Cô Hà Hoá','Phòng to','Ca 2h30',1,'2026-07-02','18:30',''),
  -- Tuần 2
  ('Natuan','Phòng nhỏ','Ca 1h30',2,'2026-07-09','08:30',''),
  ('Cô Mai Sinh 2','Phòng to','Ca 1h30',2,'2026-07-10','08:30','sáng'),
  ('K78 Lý 2','Phòng nhỏ','Ca 1h30',1,'2026-07-07','13:30',''),
  ('Cô Hường','Phòng nhỏ','Ca 1h30',2,'2026-07-07','14:00',''),
  ('Diệu Liên','Phòng nhỏ','Ca 1h30',2,'2026-07-08','14:00',''),
  ('12 chuyên Pháp','Phòng nhỏ','Ca 1h30',2,'2026-07-10','14:00',''),
  ('Cô Hà Hoá','Phòng to','Ca 1h30',1,'2026-07-12','14:00',''),
  ('Cô Mai Sinh 2','Phòng to','Ca 1h30',2,'2026-07-07','14:00',''),
  ('K78 Lý 2','Phòng to','Ca 1h30',1,'2026-07-09','15:30',''),
  ('K78 Lý 2','Phòng to','Ca 1h30',1,'2026-07-10','15:30',''),
  ('Cô Hà Hoá','Phòng to','Ca 2h30',1,'2026-07-07','18:00',''),
  ('Cô Hà Địa','Phòng to','Ca 1h30',2,'2026-07-08','18:00',''),
  ('Cô Hà Hoá','Phòng to','Ca 2h30',1,'2026-07-09','18:30',''),
  -- Tuần 3
  ('Natuan','Phòng nhỏ','Ca 1h30',2,'2026-07-16','08:30',''),
  ('Cô Mai Sinh 2','Phòng to','Ca 1h30',2,'2026-07-17','08:30','sáng'),
  ('K78 Lý 2','Phòng nhỏ','Ca 1h30',1,'2026-07-14','13:30',''),
  ('Cô Hường','Phòng nhỏ','Ca 1h30',2,'2026-07-14','14:00',''),
  ('Diệu Liên','Phòng nhỏ','Ca 1h30',2,'2026-07-15','14:00',''),
  ('12 chuyên Pháp','Phòng nhỏ','Ca 1h30',2,'2026-07-17','14:00',''),
  ('Cô Hà Hoá','Phòng to','Ca 1h30',1,'2026-07-19','14:00',''),
  ('Cô Mai Sinh 2','Phòng to','Ca 1h30',2,'2026-07-14','14:00',''),
  ('K78 Lý 2','Phòng to','Ca 1h30',1,'2026-07-16','15:30',''),
  ('K78 Lý 2','Phòng to','Ca 1h30',1,'2026-07-17','15:30',''),
  ('Cô Hà Hoá','Phòng to','Ca 2h30',1,'2026-07-14','18:00',''),
  ('Cô Hà Địa','Phòng to','Ca 1h30',2,'2026-07-15','18:00',''),
  ('Cô Hà Hoá','Phòng to','Ca 2h30',1,'2026-07-16','18:30',''),
  -- Tuần 4
  ('Natuan','Phòng nhỏ','Ca 1h30',2,'2026-07-23','08:30',''),
  ('Cô Mai Sinh 2','Phòng to','Ca 1h30',2,'2026-07-24','08:30','sáng'),
  ('K78 Lý 2','Phòng nhỏ','Ca 1h30',1,'2026-07-21','13:30',''),
  ('Cô Hường','Phòng nhỏ','Ca 1h30',2,'2026-07-21','14:00',''),
  ('Diệu Liên','Phòng nhỏ','Ca 1h30',2,'2026-07-22','14:00',''),
  ('12 chuyên Pháp','Phòng nhỏ','Ca 1h30',2,'2026-07-24','14:00',''),
  ('Cô Hà Hoá','Phòng to','Ca 1h30',1,'2026-07-26','14:00',''),
  ('Cô Mai Sinh 2','Phòng to','Ca 1h30',2,'2026-07-21','14:00',''),
  ('K78 Lý 2','Phòng to','Ca 1h30',1,'2026-07-23','15:30',''),
  ('K78 Lý 2','Phòng to','Ca 1h30',1,'2026-07-24','15:30',''),
  ('Cô Hà Hoá','Phòng to','Ca 2h30',1,'2026-07-21','18:00',''),
  ('Cô Hà Địa','Phòng to','Ca 1h30',2,'2026-07-22','18:00',''),
  ('Cô Hà Hoá','Phòng to','Ca 2h30',1,'2026-07-23','18:30',''),
  -- Tuần 5
  ('Natuan','Phòng nhỏ','Ca 1h30',2,'2026-07-30','08:30',''),
  ('Cô Mai Sinh 2','Phòng to','Ca 1h30',2,'2026-07-31','08:30','sáng'),
  ('K78 Lý 2','Phòng nhỏ','Ca 1h30',1,'2026-07-28','13:30',''),
  ('Cô Hường','Phòng nhỏ','Ca 1h30',2,'2026-07-28','14:00',''),
  ('Diệu Liên','Phòng nhỏ','Ca 1h30',2,'2026-07-29','14:00',''),
  ('12 chuyên Pháp','Phòng nhỏ','Ca 1h30',2,'2026-07-31','14:00',''),
  ('Cô Mai Sinh 2','Phòng to','Ca 1h30',2,'2026-07-28','14:00',''),
  ('K78 Lý 2','Phòng to','Ca 1h30',1,'2026-07-30','15:30',''),
  ('K78 Lý 2','Phòng to','Ca 1h30',1,'2026-07-31','15:30',''),
  ('Cô Hà Hoá','Phòng to','Ca 2h30',1,'2026-07-28','18:00',''),
  ('Cô Hà Địa','Phòng to','Ca 1h30',2,'2026-07-29','18:00',''),
  ('Cô Hà Hoá','Phòng to','Ca 2h30',1,'2026-07-30','18:30','')
) as v(rname, roomname, caname, cnt, d, s, note)
join renters  r  on r.name  = v.rname
join rooms    rm on rm.name = v.roomname
join ca_types ct on ct.name = v.caname;
