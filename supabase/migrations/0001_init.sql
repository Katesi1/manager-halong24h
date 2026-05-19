-- Halong24h MVP — Schema initialization
-- Run on Supabase: Dashboard → SQL Editor → New query → paste & run

create extension if not exists "pgcrypto";

-- ===========================================================================
-- ENUMS
-- ===========================================================================

create type user_role as enum (
  'super_admin',
  'owner',
  'sale',
  'housekeeping',
  'customer'
);

create type property_status as enum (
  'pending',     -- chờ admin duyệt
  'active',      -- đã duyệt, hoạt động
  'rejected',    -- admin từ chối
  'suspended'    -- admin tạm khóa
);

create type booking_mode as enum (
  'A',  -- chỉ nhận Lead, không TT online
  'B'   -- cho phép đặt + TT cọc online qua VietQR
);

create type room_status as enum (
  'active',
  'paused',
  'maintenance'
);

create type booking_status as enum (
  'pending',      -- chờ xác nhận / chờ TT cọc
  'confirmed',    -- đã xác nhận (đã TT cọc với Mode B)
  'checked_in',
  'checked_out',
  'cancelled'
);

create type booking_source as enum (
  'walkin',       -- khách đến trực tiếp
  'web',          -- đặt qua web (Mode B)
  'lead',         -- từ Lead chuyển lên
  'phone'         -- gọi điện đặt
);

create type lead_status as enum (
  'new',
  'contacted',
  'converted',    -- đã chuyển thành booking
  'rejected',
  'expired'
);

create type payment_method as enum (
  'cash',
  'bank_transfer',
  'vietqr',
  'momo'
);

create type payment_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded'
);

-- ===========================================================================
-- TABLES
-- ===========================================================================

-- profiles: extends auth.users (1-1)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  avatar_url text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on profiles(role);

-- properties: cơ sở lưu trú (1 owner có thể có nhiều property)
create table properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  address text,
  city text,
  ward text,
  district text,
  lat numeric(9,6),
  lng numeric(9,6),
  amenities jsonb not null default '[]'::jsonb,   -- ["wifi","pool","parking",...]
  check_in_time text default '14:00',
  check_out_time text default '12:00',
  cancel_policy text,
  house_rules text,
  status property_status not null default 'pending',
  rejection_reason text,
  is_published boolean not null default false,
  booking_mode booking_mode not null default 'A',
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_owner_idx on properties(owner_id);
create index properties_status_idx on properties(status);
create index properties_city_idx on properties(city);
create index properties_published_idx on properties(is_published) where is_published = true;

-- property_images
create table property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  url text not null,
  storage_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index property_images_property_idx on property_images(property_id, sort_order);

-- rooms
create table rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,                          -- ví dụ "Deluxe view biển"
  room_type text,                              -- "deluxe", "standard", "family"...
  area_sqm integer,
  capacity integer not null default 2,
  bed_count integer default 1,
  amenities jsonb not null default '[]'::jsonb,
  description text,
  base_price numeric(12,0) not null default 0, -- VND, không lẻ
  weekend_price numeric(12,0),                 -- nullable: nếu null thì dùng base_price
  status room_status not null default 'active',
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_property_idx on rooms(property_id);
create index rooms_status_idx on rooms(status);

-- room_images
create table room_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  url text not null,
  storage_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index room_images_room_idx on room_images(room_id, sort_order);

-- pricing_overrides: giá theo khoảng ngày (mùa, lễ, ngày cụ thể)
create table pricing_overrides (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null,                      -- inclusive
  price numeric(12,0) not null,
  label text,                                  -- "Tết 2027", "Lễ 30/4", ...
  created_at timestamptz not null default now(),
  constraint pricing_overrides_dates_check check (end_date >= start_date)
);

create index pricing_overrides_room_dates_idx on pricing_overrides(room_id, start_date, end_date);

-- room_blocks: chặn phòng (sửa chữa, owner book riêng)
create table room_blocks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null,                      -- inclusive
  reason text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint room_blocks_dates_check check (end_date >= start_date)
);

create index room_blocks_room_dates_idx on room_blocks(room_id, start_date, end_date);

-- bookings
create table bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                   -- mã ngắn dễ tra: HL-2026-04-001
  property_id uuid not null references properties(id) on delete restrict,
  room_id uuid not null references rooms(id) on delete restrict,
  customer_id uuid references profiles(id) on delete set null,    -- null nếu walk-in
  guest_name text not null,
  guest_phone text not null,
  guest_email text,
  num_guests integer not null default 1,
  check_in date not null,
  check_out date not null,                     -- exclusive (đêm cuối là check_out - 1)
  total_amount numeric(12,0) not null,
  deposit_amount numeric(12,0) not null default 0,
  paid_amount numeric(12,0) not null default 0,
  notes text,
  internal_notes text,
  status booking_status not null default 'pending',
  source booking_source not null default 'web',
  cancel_reason text,
  cancelled_at timestamptz,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_dates_check check (check_out > check_in)
);

create index bookings_property_idx on bookings(property_id);
create index bookings_room_dates_idx on bookings(room_id, check_in, check_out);
create index bookings_customer_idx on bookings(customer_id);
create index bookings_status_idx on bookings(status);
create index bookings_code_idx on bookings(code);

-- leads: form khách gửi yêu cầu (Mode A)
create table leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  room_id uuid references rooms(id) on delete set null,
  guest_name text not null,
  guest_phone text not null,
  guest_email text,
  check_in date,
  check_out date,
  num_guests integer default 1,
  message text,
  status lead_status not null default 'new',
  booking_id uuid references bookings(id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create index leads_property_idx on leads(property_id, status);
create index leads_status_idx on leads(status);

-- payments
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  amount numeric(12,0) not null,
  method payment_method not null default 'vietqr',
  status payment_status not null default 'pending',
  reference text,                              -- mã memo VietQR / mã giao dịch bank
  bank_transaction_id text,                    -- ID từ webhook SePay/Casso
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index payments_booking_idx on payments(booking_id);
create index payments_status_idx on payments(status);
create index payments_reference_idx on payments(reference);

-- reviews
create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  owner_reply text,
  owner_replied_at timestamptz,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index reviews_property_idx on reviews(property_id, is_published);
create index reviews_customer_idx on reviews(customer_id);

-- ===========================================================================
-- TRIGGERS: auto-update updated_at
-- ===========================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

create trigger properties_updated_at before update on properties
  for each row execute function set_updated_at();

create trigger rooms_updated_at before update on rooms
  for each row execute function set_updated_at();

create trigger bookings_updated_at before update on bookings
  for each row execute function set_updated_at();

-- ===========================================================================
-- TRIGGER: tự tạo profile khi user đăng ký qua Supabase Auth
-- ===========================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ===========================================================================
-- HELPER: tự sinh mã booking code
-- ===========================================================================

create or replace function generate_booking_code()
returns text
language plpgsql
as $$
declare
  ym text := to_char(now(), 'YYYY-MM');
  seq integer;
  code text;
begin
  select count(*) + 1 into seq
  from bookings
  where created_at >= date_trunc('month', now());
  code := 'HL-' || ym || '-' || lpad(seq::text, 4, '0');
  return code;
end;
$$;

create or replace function set_booking_code()
returns trigger
language plpgsql
as $$
begin
  if new.code is null or new.code = '' then
    new.code := generate_booking_code();
  end if;
  return new;
end;
$$;

create trigger bookings_set_code before insert on bookings
  for each row execute function set_booking_code();
