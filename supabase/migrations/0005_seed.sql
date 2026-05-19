-- Halong24h MVP — Seed data (chỉ để dev/test)
-- KHÔNG chạy seed này lên production

-- Tạo 2 properties mẫu (owner_id sẽ cần thay bằng user thật sau khi đăng ký)
-- Để chạy seed, đầu tiên đăng ký 1 owner qua /signup, lấy uid, paste vào đây

-- ví dụ:
--   select id from auth.users where email = 'owner@example.com';

-- =============================================================================
-- HƯỚNG DẪN dùng seed:
-- 1. Đăng ký 1 user qua trang /signup với role='owner'
-- 2. Lấy user.id (UUID), paste vào biến v_owner_id dưới
-- 3. Đăng ký 1 user nữa với role='super_admin' (hoặc update profiles set role='super_admin' where email=...)
-- 4. Chạy file này
-- =============================================================================

do $$
declare
  v_owner_id uuid;
  v_prop1_id uuid := gen_random_uuid();
  v_prop2_id uuid := gen_random_uuid();
  v_room1_id uuid := gen_random_uuid();
  v_room2_id uuid := gen_random_uuid();
  v_room3_id uuid := gen_random_uuid();
  v_room4_id uuid := gen_random_uuid();
begin
  -- LẤY OWNER ĐẦU TIÊN trong profiles (giả định bạn đã đăng ký 1 owner)
  select id into v_owner_id
  from profiles
  where role = 'owner'
  order by created_at asc
  limit 1;

  if v_owner_id is null then
    raise notice 'Không tìm thấy owner trong profiles. Đăng ký owner qua /signup trước rồi chạy lại seed.';
    return;
  end if;

  -- Property 1: Hạ Long Bay Villa
  insert into properties (id, owner_id, name, slug, description, address, city, district, lat, lng, amenities, status, is_published, booking_mode, cover_image_url, check_in_time, check_out_time)
  values (
    v_prop1_id, v_owner_id,
    'Hạ Long Bay Villa',
    'ha-long-bay-villa',
    'Villa view biển 5 phòng ngủ, hồ bơi riêng, cách bãi tắm 200m. Không gian yên tĩnh, phù hợp gia đình và nhóm bạn.',
    '15 Bãi Cháy, Hồng Hải',
    'Hạ Long',
    'Bãi Cháy',
    20.957300, 107.075600,
    '["wifi","pool","parking","ac","kitchen","bbq","seaview"]'::jsonb,
    'active', true, 'B',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
    '14:00', '12:00'
  );

  -- Property 2: Sun Homestay
  insert into properties (id, owner_id, name, slug, description, address, city, district, lat, lng, amenities, status, is_published, booking_mode, cover_image_url)
  values (
    v_prop2_id, v_owner_id,
    'Sun Homestay Hạ Long',
    'sun-homestay-ha-long',
    'Homestay nhỏ xinh giữa lòng thành phố, gần chợ đêm và bến tàu. View đẹp, giá tốt cho cặp đôi và backpacker.',
    '88 Nguyễn Văn Cừ',
    'Hạ Long',
    'Hồng Hà',
    20.952100, 107.082300,
    '["wifi","ac","kitchen","balcony"]'::jsonb,
    'active', true, 'A',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200'
  );

  -- Rooms property 1
  insert into rooms (id, property_id, name, room_type, area_sqm, capacity, bed_count, amenities, description, base_price, weekend_price, status, cover_image_url)
  values
    (v_room1_id, v_prop1_id, 'Deluxe View Biển', 'deluxe', 35, 2, 1,
      '["wifi","ac","tv","minibar","balcony","seaview"]'::jsonb,
      'Phòng cao cấp tầng 3, ban công view vịnh. Giường King 1m8.',
      1500000, 2000000, 'active',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'),
    (v_room2_id, v_prop1_id, 'Family Suite', 'family', 60, 4, 2,
      '["wifi","ac","tv","minibar","kitchenette","balcony"]'::jsonb,
      'Suite gia đình 2 phòng ngủ, có bếp nhỏ và phòng khách.',
      2800000, 3500000, 'active',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800');

  -- Rooms property 2
  insert into rooms (id, property_id, name, room_type, area_sqm, capacity, bed_count, amenities, description, base_price, weekend_price, status, cover_image_url)
  values
    (v_room3_id, v_prop2_id, 'Standard Double', 'standard', 18, 2, 1,
      '["wifi","ac","tv"]'::jsonb,
      'Phòng tiêu chuẩn 1 giường đôi.',
      450000, 600000, 'active',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'),
    (v_room4_id, v_prop2_id, 'Twin Room', 'standard', 20, 2, 2,
      '["wifi","ac","tv"]'::jsonb,
      '2 giường đơn, phù hợp bạn bè.',
      500000, 650000, 'active',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800');

  -- Một vài property/room images
  insert into property_images (property_id, url, sort_order) values
    (v_prop1_id, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200', 0),
    (v_prop1_id, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200', 1),
    (v_prop1_id, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200', 2),
    (v_prop2_id, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200', 0),
    (v_prop2_id, 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200', 1);

  insert into room_images (room_id, url, sort_order) values
    (v_room1_id, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200', 0),
    (v_room1_id, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200', 1),
    (v_room2_id, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200', 0),
    (v_room3_id, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200', 0),
    (v_room4_id, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200', 0);

  -- Pricing override: lễ 30/4 - 3/5
  insert into pricing_overrides (room_id, start_date, end_date, price, label) values
    (v_room1_id, '2026-04-30', '2026-05-03', 2500000, 'Lễ 30/4 - 1/5'),
    (v_room2_id, '2026-04-30', '2026-05-03', 4200000, 'Lễ 30/4 - 1/5');

  raise notice 'Seed thành công: 2 properties, 4 rooms, owner_id=%', v_owner_id;
end $$;
