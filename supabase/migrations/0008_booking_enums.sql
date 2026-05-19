-- Halong24h MVP — Rename booking_mode + thêm 'hold' status (theo HANDOFF spec)
-- Áp dụng SAU 0007. Postgres 12+ supports both ALTER TYPE operations.

-- ===========================================================================
-- 1. Rename booking_mode enum: A → lead_only, B → lead_and_pay
-- ===========================================================================

alter type booking_mode rename value 'A' to 'lead_only';
alter type booking_mode rename value 'B' to 'lead_and_pay';

-- ===========================================================================
-- 2. Add 'hold' to booking_status (giữ Mode B đang chờ thanh toán)
-- ===========================================================================

alter type booking_status add value if not exists 'hold' before 'confirmed';

-- ===========================================================================
-- 3. Drop old pricing_overrides (replaced bằng pricing_rules ở 0007)
-- LƯU Ý: nếu đã có data, migrate trước rồi mới drop
-- ===========================================================================

-- Migrate existing pricing_overrides → pricing_rules với type='override'
insert into pricing_rules (
  room_id, type, priority, start_date, end_date,
  adjustment_type, adjustment_value, label, created_at
)
select
  room_id,
  'override'::pricing_rule_type,
  100,                           -- priority cao nhất
  start_date, end_date,
  'flat'::pricing_adjustment_type,
  price,                         -- treat as absolute price (sẽ xử ở engine)
  label, created_at
from pricing_overrides
on conflict do nothing;

-- Drop bảng cũ + RLS policies tự động drop theo
drop table if exists pricing_overrides cascade;

-- ===========================================================================
-- 4. Auto-tier helper function (cho cron daily)
-- ===========================================================================

create or replace function calculate_tier(room_count integer)
returns subscription_tier
language sql immutable
as $$
  select case
    when room_count <= 3 then 'free'::subscription_tier
    when room_count <= 10 then 'basic'::subscription_tier
    when room_count <= 30 then 'standard'::subscription_tier
    else 'pro'::subscription_tier
  end
$$;

create or replace function calculate_monthly_fee(room_count integer, tier subscription_tier)
returns numeric
language sql immutable
as $$
  select room_count * case tier
    when 'free' then 0
    when 'basic' then 50000
    when 'standard' then 40000
    when 'pro' then 30000
  end::numeric
$$;

-- Cron-callable: refresh subscription cho mọi tenant
create or replace function refresh_all_subscriptions()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  t record;
  rc integer;
  new_tier subscription_tier;
  new_fee numeric;
begin
  for t in select id from tenants where status = 'active' loop
    select count(*) into rc
    from rooms r join properties p on p.id = r.property_id
    where p.tenant_id = t.id and r.status = 'active';

    new_tier := calculate_tier(rc);
    new_fee := calculate_monthly_fee(rc, new_tier);

    insert into subscriptions (tenant_id, tier, room_count, monthly_fee, status, next_billing_date)
    values (t.id, new_tier, rc, new_fee, 'active', current_date + interval '30 days')
    on conflict (tenant_id) do update set
      tier = excluded.tier,
      room_count = excluded.room_count,
      monthly_fee = excluded.monthly_fee,
      updated_at = now();
  end loop;
end;
$$;

-- ===========================================================================
-- 5. Auto-update tenant_id on properties when seed runs
-- (sample data sẽ tự gán tenant_id sau khi tạo tenants)
-- ===========================================================================
