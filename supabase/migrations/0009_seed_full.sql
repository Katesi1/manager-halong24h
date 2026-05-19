-- Halong24h MVP — Production-ready seed cho schema mới
-- Bao phủ: tenants, subscriptions, hk_tasks, hk_issues, guests, disputes
--
-- HƯỚNG DẪN:
--   1. Chạy migrations 0001 → 0008 trước
--   2. Đăng ký 1 user qua /signup (sẽ tạo profile với role='customer')
--   3. Update profile đó thành super_admin:
--        update profiles set role='super_admin' where email='admin@halong24h.com';
--   4. Đăng ký thêm 1-2 user khác để làm "owner":
--        update profiles set role='owner' where email='owner1@example.com';
--        update profiles set role='owner' where email='owner2@example.com';
--   5. Chạy file này — sẽ auto-seed tenants/properties/rooms/subscriptions
--      gắn với owner đã đăng ký.
--
-- File này IDEMPOTENT — chạy nhiều lần không bị duplicate (do dùng UNIQUE constraint
-- trên slug, business_name, etc.).

do $$
declare
  v_admin_id      uuid;
  v_owner1_id     uuid;
  v_owner2_id     uuid;
  v_tenant1_id    uuid;
  v_tenant2_id    uuid;
  v_prop1_id      uuid;
  v_prop2_id      uuid;
  v_prop3_id      uuid;
  v_room1_id      uuid;
  v_room2_id      uuid;
  v_room3_id      uuid;
  v_room4_id      uuid;
  v_booking1_id   uuid;
  v_booking2_id   uuid;
  v_guest1_id     uuid;
  v_guest2_id     uuid;
begin
  -- ========================================================================
  -- 1. Tìm super_admin + 2 owner đã đăng ký sẵn
  -- ========================================================================
  select id into v_admin_id from profiles where role = 'super_admin' limit 1;
  if v_admin_id is null then
    raise exception 'Chưa có super_admin. Tạo qua /signup rồi update role trước.';
  end if;

  select id into v_owner1_id from profiles where role = 'owner' order by created_at asc limit 1;
  if v_owner1_id is null then
    raise exception 'Chưa có owner. Tạo qua /signup rồi update role=owner trước.';
  end if;

  select id into v_owner2_id from profiles where role = 'owner' and id <> v_owner1_id
    order by created_at asc limit 1;
  -- owner2 optional — nếu chưa có thì tenant 2 sẽ dùng owner1

  if v_owner2_id is null then
    v_owner2_id := v_owner1_id;
  end if;

  raise notice 'Admin: %, Owner1: %, Owner2: %', v_admin_id, v_owner1_id, v_owner2_id;

  -- ========================================================================
  -- 2. TENANTS — 2 doanh nghiệp mẫu
  -- ========================================================================
  insert into tenants (owner_id, business_name, status, approved_by, approved_at,
                       cccd_front_url, cccd_back_url, license_url)
  values (
    v_owner1_id,
    'Công ty TNHH Du lịch Hạ Long Premier',
    'active', v_admin_id, now() - interval '60 days',
    'https://placehold.co/800x500?text=CCCD+Front',
    'https://placehold.co/800x500?text=CCCD+Back',
    'https://placehold.co/800x500?text=License'
  )
  on conflict do nothing;
  select id into v_tenant1_id from tenants where business_name = 'Công ty TNHH Du lịch Hạ Long Premier';

  insert into tenants (owner_id, business_name, status, cccd_front_url)
  values (
    v_owner2_id,
    'Bãi Cháy Homestay',
    'pending',
    'https://placehold.co/800x500?text=CCCD+Front'
  )
  on conflict do nothing;
  select id into v_tenant2_id from tenants where business_name = 'Bãi Cháy Homestay';

  -- tenant_members: owner luôn là member với role=owner
  insert into tenant_members (tenant_id, user_id, role, accepted_at)
  values (v_tenant1_id, v_owner1_id, 'owner', now()),
         (v_tenant2_id, v_owner2_id, 'owner', now())
  on conflict do nothing;

  -- ========================================================================
  -- 3. SUBSCRIPTIONS — gói cước cho tenant đã active
  -- ========================================================================
  insert into subscriptions (tenant_id, tier, room_count, monthly_fee, status, next_billing_date)
  values
    (v_tenant1_id, 'standard', 12, 480000, 'active', current_date + interval '20 days'),
    (v_tenant2_id, 'free', 0, 0, 'active', current_date + interval '30 days')
  on conflict (tenant_id) do update
    set tier = excluded.tier,
        room_count = excluded.room_count,
        monthly_fee = excluded.monthly_fee;

  -- ========================================================================
  -- 4. PROPERTIES + tenant link
  -- ========================================================================
  insert into properties (
    owner_id, tenant_id, name, slug, description, address, city, district,
    lat, lng, amenities, status, is_published, booking_mode, cover_image_url,
    check_in_time, check_out_time, cancel_policy, house_rules
  ) values
  (
    v_owner1_id, v_tenant1_id,
    'À La Carte Hạ Long Bay',
    'a-la-carte-ha-long-bay',
    'Tổ hợp căn hộ dịch vụ cao cấp 5 sao bên Vịnh Hạ Long. Tòa 36 tầng với hồ bơi vô cực, sky bar view 360°.',
    '1 Đường Hoàng Quốc Việt, Bãi Cháy', 'Hạ Long', 'Bãi Cháy',
    20.957300, 107.075600,
    ARRAY['seaview','pool','wifi','parking','ac','kitchen','gym','spa','bbq','breakfast'],
    'active', true, 'lead_and_pay',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=85',
    '14:00', '12:00',
    'Hủy miễn phí trong 48h sau khi đặt. Hoàn 50% nếu hủy trước 7 ngày.',
    'Không hút thuốc trong phòng. Không tổ chức tiệc/sự kiện.'
  ),
  (
    v_owner1_id, v_tenant1_id,
    'Sun Grand City Feria HD7',
    'sun-grand-feria-hd7',
    'Căn hộ dịch vụ tại Sun Grand City Feria, gần biển 5 phút đi bộ. Studio + 2PN, view vịnh.',
    'Sun Grand City Feria, Hùng Thắng', 'Hạ Long', 'Hùng Thắng',
    20.940500, 107.063200,
    ARRAY['pool','wifi','ac','parking'],
    'active', true, 'lead_and_pay',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=85',
    '14:00', '12:00',
    'Hủy miễn phí trong 24h sau khi đặt.',
    'Tuân thủ nội quy tòa nhà.'
  ),
  (
    v_owner2_id, v_tenant2_id,
    'Mộc Homestay — Phong cách Bắc Bộ',
    'moc-homestay',
    'Homestay phong cách Bắc Bộ, không gian gỗ ấm cúng, gia đình.',
    'Yên Hưng, Hạ Long', 'Hạ Long', 'Yên Hưng',
    20.890100, 107.020400,
    ARRAY['breakfast','wifi','kitchen'],
    'pending', false, 'lead_only',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&q=85',
    '14:00', '11:00',
    null, null
  )
  on conflict (slug) do update
    set tenant_id = excluded.tenant_id;

  select id into v_prop1_id from properties where slug = 'a-la-carte-ha-long-bay';
  select id into v_prop2_id from properties where slug = 'sun-grand-feria-hd7';
  select id into v_prop3_id from properties where slug = 'moc-homestay';

  -- ========================================================================
  -- 5. ROOMS — vài phòng cho mỗi property
  -- ========================================================================
  insert into rooms (property_id, name, room_type, capacity, bed_count, area_sqm,
                     amenities, description, base_price, weekend_price, status, cover_image_url)
  values
  (v_prop1_id, 'Studio Premium View Vịnh', 'studio', 2, 1, 38,
   ARRAY['seaview','wifi','ac','kitchen','balcony'],
   'Studio cao cấp tầng 18-25, ban công riêng view trực diện vịnh.',
   1850000, 2400000, 'active',
   'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=85'),
  (v_prop1_id, 'Căn hộ 2PN Family Suite', 'family', 4, 2, 72,
   ARRAY['seaview','wifi','ac','kitchen','balcony'],
   'Căn hộ 2 phòng ngủ rộng rãi, view vịnh + view núi.',
   3200000, 4100000, 'active',
   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85'),
  (v_prop1_id, 'Penthouse 3PN Sky Suite', 'penthouse', 6, 3, 145,
   ARRAY['seaview','wifi','ac','kitchen','bbq','gym'],
   'Penthouse tầng 35, sân thượng riêng, BBQ ngoài trời.',
   8500000, 11000000, 'active',
   'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=85'),
  (v_prop2_id, 'Studio HD7-28', 'studio', 2, 1, 32,
   ARRAY['wifi','ac'],
   'Studio HD7 tầng 28 view biển.',
   1200000, 1600000, 'active',
   'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=85')
  on conflict do nothing;

  select id into v_room1_id from rooms where property_id = v_prop1_id and name = 'Studio Premium View Vịnh' limit 1;
  select id into v_room2_id from rooms where property_id = v_prop1_id and name = 'Căn hộ 2PN Family Suite' limit 1;
  select id into v_room3_id from rooms where property_id = v_prop1_id and name = 'Penthouse 3PN Sky Suite' limit 1;
  select id into v_room4_id from rooms where property_id = v_prop2_id and name = 'Studio HD7-28' limit 1;

  -- Refresh subscription room_count để khớp
  update subscriptions
    set room_count = (
      select count(*) from rooms r
      join properties p on p.id = r.property_id
      where p.tenant_id = v_tenant1_id and r.status = 'active'
    )
  where tenant_id = v_tenant1_id;

  -- ========================================================================
  -- 6. PRICING_RULES — vài override mẫu
  -- ========================================================================
  insert into pricing_rules (room_id, type, priority, start_date, end_date,
                             adjustment_type, adjustment_value, label)
  values
  (v_room1_id, 'override', 100,
   current_date + interval '14 days', current_date + interval '17 days',
   'flat', 2800000, 'Lễ 30/4 - 1/5'),
  (v_room2_id, 'seasonal', 50,
   current_date + interval '60 days', current_date + interval '90 days',
   'percent', 20, 'Cao điểm hè')
  on conflict do nothing;

  -- ========================================================================
  -- 7. GUESTS CRM — vài khách mẫu
  -- ========================================================================
  insert into guests (tenant_id, phone, full_name, email, total_bookings, total_spent,
                      tags, last_visit_at, notes_internal)
  values
  (v_tenant1_id, '0901234567', 'Lê Văn Đức', 'leduc@example.com',
   5, 28500000, ARRAY['vip'], now() - interval '7 days',
   'Khách quen, thích phòng tầng cao view biển.'),
  (v_tenant1_id, '0987654321', 'Trần Minh Quân', null,
   2, 8400000, ARRAY['returning'], now() - interval '21 days', null),
  (v_tenant1_id, '0912345678', 'Phạm Thúy Linh', 'linh@example.com',
   7, 42000000, ARRAY['vip'], now() - interval '40 days',
   'Đặt theo đoàn 4-6 người. Cần xe đón sân bay.'),
  (v_tenant1_id, '0977000111', 'Nguyễn Hữu Cường', null,
   1, 2400000, ARRAY['blacklist'], now() - interval '5 months',
   'Gây ồn 3h sáng, làm hư đồ. Không nhận đặt nữa.')
  on conflict (tenant_id, phone) do nothing;

  select id into v_guest1_id from guests where tenant_id = v_tenant1_id and phone = '0901234567';
  select id into v_guest2_id from guests where tenant_id = v_tenant1_id and phone = '0912345678';

  -- ========================================================================
  -- 8. BOOKINGS — vài booking mẫu (cần cho disputes + hk_tasks)
  -- ========================================================================
  insert into bookings (property_id, room_id, guest_name, guest_phone, guest_email,
                        check_in, check_out, total_amount, paid_amount,
                        status, source, customer_id)
  values
  (v_prop1_id, v_room1_id, 'Lê Văn Đức', '0901234567', 'leduc@example.com',
   current_date + interval '4 days', current_date + interval '7 days',
   5550000, 1665000, 'confirmed', 'web', null),
  (v_prop1_id, v_room2_id, 'Trần Minh Quân', '0987654321', null,
   current_date - interval '2 days', current_date,
   6400000, 6400000, 'checked_out', 'web', null)
  on conflict do nothing;

  select id into v_booking1_id from bookings
    where property_id = v_prop1_id and guest_phone = '0901234567'
    order by created_at desc limit 1;
  select id into v_booking2_id from bookings
    where property_id = v_prop1_id and guest_phone = '0987654321'
    order by created_at desc limit 1;

  -- ========================================================================
  -- 9. HK_TASKS — vài task housekeeping
  -- ========================================================================
  insert into hk_tasks (room_id, related_booking_id, type, status, due_at, notes)
  values
  (v_room1_id, v_booking1_id, 'clean', 'pending',
   now() + interval '4 hours', 'Dọn deep-clean trước check-in của Lê Văn Đức'),
  (v_room2_id, v_booking2_id, 'clean', 'done',
   now() - interval '6 hours', 'Đã dọn sau check-out, ảnh trong photos_after'),
  (v_room3_id, null, 'inspect', 'in_progress',
   now() + interval '1 day', 'Kiểm tra điều hòa + bể sục tầng penthouse'),
  (v_room4_id, null, 'restock', 'pending',
   now() + interval '2 days', 'Bổ sung khăn tắm + amenities')
  on conflict do nothing;

  -- ========================================================================
  -- 10. HK_ISSUES — vài issue đang mở
  -- ========================================================================
  insert into hk_issues (room_id, reported_by, category, severity, description, status)
  values
  (v_room1_id, v_owner1_id, 'aircon', 'urgent',
   'Điều hòa không lạnh, khách phàn nàn lúc 22h.', 'open'),
  (v_room2_id, v_owner1_id, 'water_leak', 'medium',
   'Vòi sen rò nước nhẹ, cần sửa khi có thợ.', 'fixing')
  on conflict do nothing;

  -- ========================================================================
  -- 11. DISPUTES — 1 khiếu nại mẫu
  -- ========================================================================
  insert into disputes (booking_id, opened_by, type, amount, description,
                        evidence_urls, status)
  values
  (v_booking2_id, null, 'quality', 800000,
   'Phòng không sạch khi check-in, có mùi ẩm. Yêu cầu hoàn 1 phần tiền.',
   ARRAY['https://placehold.co/600x400?text=evidence-1',
         'https://placehold.co/600x400?text=evidence-2'],
   'open')
  on conflict do nothing;

  -- ========================================================================
  -- 12. AUDIT LOG — record việc seed này
  -- ========================================================================
  insert into audit_logs (user_id, action, target_type, target_id, meta)
  values
  (v_admin_id, 'seed.run', 'system', '0009_seed_full',
   jsonb_build_object('tenants', 2, 'properties', 3, 'rooms', 4, 'guests', 4));

  raise notice '✓ Seed hoàn tất.';
  raise notice '   Tenants: 2 (1 active, 1 pending)';
  raise notice '   Properties: 3 (a-la-carte, sun-grand-feria, moc-homestay)';
  raise notice '   Rooms: 4';
  raise notice '   Guests: 4 (1 VIP, 1 returning, 1 blacklist)';
  raise notice '   Bookings: 2, HK tasks: 4, HK issues: 2, Disputes: 1';
end $$;
