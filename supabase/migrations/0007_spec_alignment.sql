-- Halong24h MVP — Align với HANDOFF-FOR-DEV.md spec
-- Bổ sung: tenants, tenant_members, subscriptions, invoices,
--         pricing_rules (replace pricing_overrides), hk_tasks, hk_issues,
--         guests (CRM), disputes, audit_logs

-- ===========================================================================
-- ENUMS mới
-- ===========================================================================

create type tenant_status as enum ('pending', 'active', 'frozen', 'rejected');
create type tenant_member_role as enum ('owner', 'sale', 'housekeeping');
create type subscription_tier as enum ('free', 'basic', 'standard', 'pro');
create type subscription_status as enum ('active', 'overdue', 'frozen');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue');
create type pricing_rule_type as enum ('weekend', 'seasonal', 'override');
create type pricing_adjustment_type as enum ('percent', 'flat');
create type hk_task_type as enum ('clean', 'inspect', 'restock');
create type hk_task_status as enum ('pending', 'in_progress', 'done', 'rejected');
create type hk_issue_severity as enum ('minor', 'medium', 'urgent');
create type hk_issue_status as enum ('open', 'fixing', 'closed');
create type dispute_status as enum ('open', 'investigating', 'resolved', 'rejected');

-- ===========================================================================
-- TENANTS — 1 chủ kinh doanh, có thể có nhiều property
-- ===========================================================================

create table tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  business_name text not null,
  cccd_front_url text,
  cccd_back_url text,
  license_url text,
  status tenant_status not null default 'pending',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tenants_owner_idx on tenants(owner_id);
create index tenants_status_idx on tenants(status);

create trigger tenants_updated_at before update on tenants
  for each row execute function set_updated_at();

-- tenant_members: 1 user có thể thuộc nhiều tenant với role khác nhau
create table tenant_members (
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role tenant_member_role not null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (tenant_id, user_id)
);

create index tenant_members_user_idx on tenant_members(user_id);

-- ===========================================================================
-- ALTER properties: link tenant_id (nullable transition; populate sau seed)
-- ===========================================================================

alter table properties add column tenant_id uuid references tenants(id);
create index properties_tenant_idx on properties(tenant_id);

-- ===========================================================================
-- SUBSCRIPTIONS + INVOICES
-- ===========================================================================

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  tier subscription_tier not null default 'free',
  room_count integer not null default 0,
  monthly_fee numeric(12,0) not null default 0,
  status subscription_status not null default 'active',
  next_billing_date date not null default (current_date + interval '30 days')::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_tenant_idx on subscriptions(tenant_id);
create index subscriptions_billing_idx on subscriptions(next_billing_date) where status = 'active';

create trigger subscriptions_updated_at before update on subscriptions
  for each row execute function set_updated_at();

create table invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  code text not null unique,
  period_month text not null,                           -- "2026-04"
  amount numeric(12,0) not null,
  due_date date not null,
  paid_at timestamptz,
  status invoice_status not null default 'draft',
  created_at timestamptz not null default now()
);

create index invoices_tenant_idx on invoices(tenant_id, period_month);
create index invoices_status_idx on invoices(status);

-- ===========================================================================
-- PRICING_RULES — thay thế pricing_overrides với engine mạnh hơn
-- ===========================================================================

create table pricing_rules (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,        -- nullable: áp cả property
  type pricing_rule_type not null,
  priority integer not null default 1,                          -- 1 = cao nhất
  start_date date,
  end_date date,
  weekdays integer[],                                           -- [0,5,6] = CN,T6,T7 (Postgres dow)
  adjustment_type pricing_adjustment_type not null,
  adjustment_value numeric(12,2) not null,                      -- +20 (percent) / +500000 (flat)
  label text,
  created_at timestamptz not null default now(),
  constraint pricing_rules_target check (property_id is not null or room_id is not null)
);

create index pricing_rules_room_idx on pricing_rules(room_id, priority desc);
create index pricing_rules_property_idx on pricing_rules(property_id, priority desc);
create index pricing_rules_dates_idx on pricing_rules(start_date, end_date);

-- ===========================================================================
-- HOUSEKEEPING — tasks + issues
-- ===========================================================================

create table hk_tasks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  related_booking_id uuid references bookings(id) on delete set null,
  type hk_task_type not null default 'clean',
  status hk_task_status not null default 'pending',
  assigned_to uuid references profiles(id) on delete set null,
  due_at timestamptz,
  done_at timestamptz,
  photos_before text[] default '{}',
  photos_after text[] default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create index hk_tasks_room_idx on hk_tasks(room_id, status);
create index hk_tasks_assigned_idx on hk_tasks(assigned_to, status);
create index hk_tasks_pending_idx on hk_tasks(status, due_at) where status in ('pending', 'in_progress');

create table hk_issues (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  reported_by uuid references profiles(id) on delete set null,
  category text,                                                -- 'water_leak','aircon','tv',...
  severity hk_issue_severity not null default 'medium',
  description text,
  photos text[] default '{}',
  status hk_issue_status not null default 'open',
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index hk_issues_room_idx on hk_issues(room_id, status);
create index hk_issues_open_idx on hk_issues(status, severity) where status in ('open', 'fixing');

-- ===========================================================================
-- GUESTS CRM — aggregated guest table per tenant
-- ===========================================================================

create table guests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  phone text not null,
  full_name text,
  email text,
  total_bookings integer not null default 0,
  total_spent numeric(12,0) not null default 0,
  tags text[] default '{}',                                     -- ['vip','returning','blacklist']
  notes_internal text,
  last_visit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone)
);

create index guests_tenant_idx on guests(tenant_id, last_visit_at desc);
create index guests_phone_idx on guests(phone);

create trigger guests_updated_at before update on guests
  for each row execute function set_updated_at();

-- ===========================================================================
-- DISPUTES — Admin xử lý
-- ===========================================================================

create table disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  opened_by uuid references profiles(id) on delete set null,
  type text,                                                    -- 'refund','quality','no_show'
  amount numeric(12,0),
  description text,
  evidence_urls text[] default '{}',
  status dispute_status not null default 'open',
  resolution text,
  resolved_by uuid references profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index disputes_status_idx on disputes(status, created_at desc);
create index disputes_booking_idx on disputes(booking_id);

-- ===========================================================================
-- AUDIT_LOGS — admin trace
-- ===========================================================================

create table audit_logs (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete set null,
  tenant_id uuid references tenants(id) on delete set null,
  action text not null,                                         -- 'tenant.approve', 'booking.cancel', ...
  target_type text,
  target_id text,
  meta jsonb default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index audit_logs_user_idx on audit_logs(user_id, created_at desc);
create index audit_logs_tenant_idx on audit_logs(tenant_id, created_at desc);
create index audit_logs_action_idx on audit_logs(action, created_at desc);

-- ===========================================================================
-- RLS — enable + base policies cho các bảng mới
-- ===========================================================================

alter table tenants            enable row level security;
alter table tenant_members     enable row level security;
alter table subscriptions      enable row level security;
alter table invoices           enable row level security;
alter table pricing_rules      enable row level security;
alter table hk_tasks           enable row level security;
alter table hk_issues          enable row level security;
alter table guests             enable row level security;
alter table disputes           enable row level security;
alter table audit_logs         enable row level security;

-- Helper: check if user is member of tenant
create or replace function is_tenant_member(t_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from tenant_members
    where tenant_id = t_id and user_id = auth.uid()
  )
$$;

create or replace function is_tenant_owner(t_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from tenants
    where id = t_id and owner_id = auth.uid()
  )
$$;

-- TENANTS policies
create policy "tenants: owner read own" on tenants for select
  using (owner_id = auth.uid() or is_tenant_member(id));
create policy "tenants: admin all" on tenants for all using (is_admin());
create policy "tenants: owner insert" on tenants for insert
  with check (owner_id = auth.uid());
create policy "tenants: owner update own" on tenants for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- TENANT_MEMBERS policies
create policy "tenant_members: read own" on tenant_members for select
  using (user_id = auth.uid() or is_tenant_owner(tenant_id) or is_admin());
create policy "tenant_members: owner manage" on tenant_members for all
  using (is_tenant_owner(tenant_id) or is_admin())
  with check (is_tenant_owner(tenant_id) or is_admin());

-- SUBSCRIPTIONS policies
create policy "subscriptions: tenant read" on subscriptions for select
  using (is_tenant_member(tenant_id) or is_tenant_owner(tenant_id) or is_admin());
create policy "subscriptions: admin manage" on subscriptions for all using (is_admin());

-- INVOICES policies
create policy "invoices: tenant read" on invoices for select
  using (is_tenant_member(tenant_id) or is_tenant_owner(tenant_id) or is_admin());
create policy "invoices: admin manage" on invoices for all using (is_admin());

-- PRICING_RULES policies
create policy "pricing_rules: public read of active properties"
  on pricing_rules for select
  using (
    case
      when property_id is not null then exists (
        select 1 from properties p where p.id = property_id and p.is_published = true and p.status = 'active'
      )
      when room_id is not null then exists (
        select 1 from rooms r join properties p on p.id = r.property_id
        where r.id = room_id and p.is_published = true and p.status = 'active'
      )
      else false
    end
  );
create policy "pricing_rules: owner crud" on pricing_rules for all
  using (
    (property_id is not null and owns_property(property_id))
    or (room_id is not null and owns_room(room_id))
  )
  with check (
    (property_id is not null and owns_property(property_id))
    or (room_id is not null and owns_room(room_id))
  );
create policy "pricing_rules: admin all" on pricing_rules for all using (is_admin());

-- HK_TASKS — assigned HK + tenant members + admin
create policy "hk_tasks: assigned read" on hk_tasks for select
  using (assigned_to = auth.uid());
create policy "hk_tasks: tenant member crud" on hk_tasks for all
  using (
    exists (
      select 1 from rooms r join properties p on p.id = r.property_id
      join tenants t on t.id = p.tenant_id
      where r.id = room_id and (t.owner_id = auth.uid() or is_tenant_member(t.id))
    )
  );
create policy "hk_tasks: admin all" on hk_tasks for all using (is_admin());

-- HK_ISSUES — same pattern
create policy "hk_issues: tenant member crud" on hk_issues for all
  using (
    exists (
      select 1 from rooms r join properties p on p.id = r.property_id
      join tenants t on t.id = p.tenant_id
      where r.id = room_id and (t.owner_id = auth.uid() or is_tenant_member(t.id))
    )
  );
create policy "hk_issues: admin all" on hk_issues for all using (is_admin());

-- GUESTS CRM — chỉ tenant members thấy
create policy "guests: tenant member read" on guests for select
  using (is_tenant_owner(tenant_id) or is_tenant_member(tenant_id) or is_admin());
create policy "guests: tenant member manage" on guests for all
  using (is_tenant_owner(tenant_id) or is_tenant_member(tenant_id))
  with check (is_tenant_owner(tenant_id) or is_tenant_member(tenant_id));

-- DISPUTES — opener + admin
create policy "disputes: opener read" on disputes for select
  using (opened_by = auth.uid());
create policy "disputes: admin all" on disputes for all using (is_admin());
create policy "disputes: customer open" on disputes for insert
  with check (opened_by = auth.uid());

-- AUDIT_LOGS — chỉ admin đọc
create policy "audit_logs: admin read" on audit_logs for select using (is_admin());
-- writes: only via service role (server-side)
