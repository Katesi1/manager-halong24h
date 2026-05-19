-- Halong24h MVP — Helper functions for pricing, availability, role checks

-- ===========================================================================
-- ROLE CHECKS (used in RLS policies)
-- ===========================================================================

create or replace function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() = 'super_admin', false)
$$;

create or replace function owns_property(prop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from properties
    where id = prop_id and owner_id = auth.uid()
  )
$$;

create or replace function owns_room(r_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from rooms r
    join properties p on p.id = r.property_id
    where r.id = r_id and p.owner_id = auth.uid()
  )
$$;

-- ===========================================================================
-- PRICING: tính giá cho 1 ngày của 1 phòng
-- Priority: pricing_overrides > weekend_price (T6/T7/CN) > base_price
-- ===========================================================================

create or replace function price_for_date(p_room_id uuid, p_date date)
returns numeric
language plpgsql
stable
as $$
declare
  v_price numeric;
  v_dow integer;
  v_base numeric;
  v_weekend numeric;
begin
  -- 1. Check pricing_overrides (giá theo mùa/lễ/ngày cụ thể)
  select price into v_price
  from pricing_overrides
  where room_id = p_room_id
    and p_date between start_date and end_date
  order by start_date desc
  limit 1;

  if v_price is not null then
    return v_price;
  end if;

  -- 2. Get room base + weekend price
  select base_price, weekend_price into v_base, v_weekend
  from rooms
  where id = p_room_id;

  -- 3. Weekend? T6=5, T7=6, CN=0 (theo Postgres dow)
  v_dow := extract(dow from p_date)::integer;
  if v_dow in (0, 5, 6) and v_weekend is not null then
    return v_weekend;
  end if;

  return coalesce(v_base, 0);
end;
$$;

-- ===========================================================================
-- PRICING: tính tổng giá cho khoảng [check_in, check_out)
-- ===========================================================================

create or replace function total_price(p_room_id uuid, p_check_in date, p_check_out date)
returns numeric
language plpgsql
stable
as $$
declare
  v_total numeric := 0;
  v_date date;
begin
  v_date := p_check_in;
  while v_date < p_check_out loop
    v_total := v_total + price_for_date(p_room_id, v_date);
    v_date := v_date + 1;
  end loop;
  return v_total;
end;
$$;

-- ===========================================================================
-- AVAILABILITY: phòng có trống trong khoảng [check_in, check_out) không?
-- Tránh overlap với booking active + room_blocks
-- ===========================================================================

create or replace function is_room_available(
  p_room_id uuid,
  p_check_in date,
  p_check_out date,
  p_exclude_booking_id uuid default null
)
returns boolean
language plpgsql
stable
as $$
begin
  -- Conflict với booking active?
  if exists (
    select 1 from bookings
    where room_id = p_room_id
      and status in ('pending', 'confirmed', 'checked_in')
      and (p_exclude_booking_id is null or id <> p_exclude_booking_id)
      and check_in < p_check_out
      and check_out > p_check_in
  ) then
    return false;
  end if;

  -- Conflict với block (sửa chữa)?
  if exists (
    select 1 from room_blocks
    where room_id = p_room_id
      and start_date < p_check_out
      and (end_date + 1) > p_check_in
  ) then
    return false;
  end if;

  return true;
end;
$$;
