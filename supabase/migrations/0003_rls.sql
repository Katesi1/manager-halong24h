-- Halong24h MVP — Row Level Security policies
-- Mọi table public.* phải bật RLS. Service role bypass tự động.

alter table profiles            enable row level security;
alter table properties          enable row level security;
alter table property_images     enable row level security;
alter table rooms               enable row level security;
alter table room_images         enable row level security;
alter table pricing_overrides   enable row level security;
alter table room_blocks         enable row level security;
alter table bookings            enable row level security;
alter table leads               enable row level security;
alter table payments            enable row level security;
alter table reviews             enable row level security;

-- ===========================================================================
-- profiles
-- ===========================================================================

create policy "profiles: self can read"
  on profiles for select
  using (id = auth.uid());

create policy "profiles: admin can read all"
  on profiles for select
  using (is_admin());

create policy "profiles: self can update"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
  -- ngăn user tự nâng quyền

create policy "profiles: admin can update all"
  on profiles for update
  using (is_admin());

-- ===========================================================================
-- properties
-- ===========================================================================

create policy "properties: public read active+published"
  on properties for select
  using (status = 'active' and is_published = true);

create policy "properties: owner read own"
  on properties for select
  using (owner_id = auth.uid());

create policy "properties: admin read all"
  on properties for select
  using (is_admin());

create policy "properties: owner insert own"
  on properties for insert
  with check (owner_id = auth.uid() and auth_role() in ('owner', 'super_admin'));

create policy "properties: owner update own (limited fields)"
  on properties for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
  -- Note: owner KHÔNG đổi được status; admin mới đổi được. Enforce ở app layer hoặc trigger.

create policy "properties: admin update all"
  on properties for update
  using (is_admin());

create policy "properties: owner delete own pending"
  on properties for delete
  using (owner_id = auth.uid() and status = 'pending');

create policy "properties: admin delete"
  on properties for delete
  using (is_admin());

-- ===========================================================================
-- property_images
-- ===========================================================================

create policy "property_images: public read for active props"
  on property_images for select
  using (
    exists (
      select 1 from properties p
      where p.id = property_id and p.status = 'active' and p.is_published = true
    )
  );

create policy "property_images: owner crud own"
  on property_images for all
  using (owns_property(property_id))
  with check (owns_property(property_id));

create policy "property_images: admin all"
  on property_images for all
  using (is_admin());

-- ===========================================================================
-- rooms
-- ===========================================================================

create policy "rooms: public read of active properties"
  on rooms for select
  using (
    status = 'active' and exists (
      select 1 from properties p
      where p.id = property_id and p.status = 'active' and p.is_published = true
    )
  );

create policy "rooms: owner crud own"
  on rooms for all
  using (owns_property(property_id))
  with check (owns_property(property_id));

create policy "rooms: admin all"
  on rooms for all
  using (is_admin());

-- ===========================================================================
-- room_images
-- ===========================================================================

create policy "room_images: public read"
  on room_images for select
  using (
    exists (
      select 1 from rooms r
      join properties p on p.id = r.property_id
      where r.id = room_id and r.status = 'active'
        and p.status = 'active' and p.is_published = true
    )
  );

create policy "room_images: owner crud"
  on room_images for all
  using (owns_room(room_id))
  with check (owns_room(room_id));

create policy "room_images: admin all"
  on room_images for all
  using (is_admin());

-- ===========================================================================
-- pricing_overrides — chỉ owner + admin
-- ===========================================================================

create policy "pricing_overrides: owner crud"
  on pricing_overrides for all
  using (owns_room(room_id))
  with check (owns_room(room_id));

create policy "pricing_overrides: admin all"
  on pricing_overrides for all
  using (is_admin());

-- ===========================================================================
-- room_blocks
-- ===========================================================================

create policy "room_blocks: owner crud"
  on room_blocks for all
  using (owns_room(room_id))
  with check (owns_room(room_id));

create policy "room_blocks: admin all"
  on room_blocks for all
  using (is_admin());

-- ===========================================================================
-- bookings
-- ===========================================================================

create policy "bookings: customer read own"
  on bookings for select
  using (customer_id = auth.uid());

create policy "bookings: owner read on own properties"
  on bookings for select
  using (owns_property(property_id));

create policy "bookings: admin read all"
  on bookings for select
  using (is_admin());

-- INSERT bookings:
--   - Customer: only via API/server action (server creates with their customer_id)
--   - Owner: tạo walk-in / phone booking
-- Mở insert cho cả authenticated user; control cụ thể ở app layer.
create policy "bookings: authenticated insert"
  on bookings for insert
  with check (
    auth.uid() is not null
    and (
      -- customer tự đặt cho property published
      (
        customer_id = auth.uid()
        and exists (
          select 1 from properties p
          where p.id = property_id and p.status = 'active' and p.is_published = true
        )
      )
      -- hoặc owner tạo cho property của mình
      or owns_property(property_id)
      or is_admin()
    )
  );

create policy "bookings: customer cancel own"
  on bookings for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

create policy "bookings: owner update own"
  on bookings for update
  using (owns_property(property_id))
  with check (owns_property(property_id));

create policy "bookings: admin update"
  on bookings for update
  using (is_admin());

-- ===========================================================================
-- leads
-- ===========================================================================

-- Cho phép public (anon) tạo lead — khách chưa login vẫn gửi yêu cầu được
create policy "leads: public insert"
  on leads for insert
  with check (
    exists (
      select 1 from properties p
      where p.id = property_id and p.status = 'active' and p.is_published = true
    )
  );

create policy "leads: owner read own"
  on leads for select
  using (owns_property(property_id));

create policy "leads: admin read all"
  on leads for select
  using (is_admin());

create policy "leads: owner update own"
  on leads for update
  using (owns_property(property_id))
  with check (owns_property(property_id));

create policy "leads: admin update"
  on leads for update
  using (is_admin());

-- ===========================================================================
-- payments
-- ===========================================================================

create policy "payments: customer read own bookings"
  on payments for select
  using (
    exists (
      select 1 from bookings b
      where b.id = booking_id and b.customer_id = auth.uid()
    )
  );

create policy "payments: owner read on own bookings"
  on payments for select
  using (
    exists (
      select 1 from bookings b
      where b.id = booking_id and owns_property(b.property_id)
    )
  );

create policy "payments: admin all"
  on payments for all
  using (is_admin())
  with check (is_admin());

-- Insert/update payments: chỉ qua server (service role) hoặc owner cho booking của mình
create policy "payments: owner insert/update on own bookings"
  on payments for insert
  with check (
    exists (
      select 1 from bookings b
      where b.id = booking_id and owns_property(b.property_id)
    )
  );

create policy "payments: owner update"
  on payments for update
  using (
    exists (
      select 1 from bookings b
      where b.id = booking_id and owns_property(b.property_id)
    )
  );

-- ===========================================================================
-- reviews
-- ===========================================================================

create policy "reviews: public read published"
  on reviews for select
  using (is_published = true);

create policy "reviews: customer write for own checked_out booking"
  on reviews for insert
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from bookings b
      where b.id = booking_id
        and b.customer_id = auth.uid()
        and b.status = 'checked_out'
    )
  );

create policy "reviews: customer update own"
  on reviews for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- Owner reply: dùng update column owner_reply
create policy "reviews: owner reply own property"
  on reviews for update
  using (owns_property(property_id))
  with check (owns_property(property_id));

create policy "reviews: admin all"
  on reviews for all
  using (is_admin())
  with check (is_admin());
