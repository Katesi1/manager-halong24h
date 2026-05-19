# Supabase setup (production)

## 1. Tạo project

1. supabase.com → New project → đặt password mạnh
2. Lấy 3 thông số ở **Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (giữ bí mật) → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Chạy migrations theo thứ tự

Vào **SQL Editor** → paste lần lượt:

| File | Mục đích |
|---|---|
| `0001_init.sql` | Extensions, enums, tables, indexes, triggers |
| `0002_helpers.sql` | Helper functions (is_admin, owns_property, price_for_date,...) |
| `0003_rls.sql` | Row Level Security cho tất cả bảng cũ |
| `0004_storage.sql` | Storage policies (cần tạo bucket trước — xem mục 3) |
| `0006_messaging_notifications.sql` | Conversations, messages, notifications, favorites |
| `0007_spec_alignment.sql` | tenants, subscriptions, pricing_rules, hk_tasks, guests, disputes, audit_logs |
| `0008_booking_enums.sql` | Rename booking_mode A/B → lead_only/lead_and_pay, thêm status `hold`, drop pricing_overrides |

**Bỏ qua `0005_seed.sql`** — nó là seed cũ. Dùng `0009_seed_full.sql` ở mục 5.

## 3. Storage buckets

Vào **Storage → New bucket**, tạo 1 bucket public:

| Name | Public | Size limit | MIME types |
|---|---|---|---|
| `halong24h` | ✅ | 5 MB | `image/jpeg, image/png, image/webp` |

(Tất cả ảnh property/room/CCCD đều dùng chung bucket này, phân biệt qua path prefix.)

## 4. Tạo super_admin

1. Chạy `npm run dev` local hoặc deploy → vào `/signup`
2. Đăng ký với email + mật khẩu (mặc định role = `customer`)
3. Vào Supabase **SQL Editor**:
   ```sql
   update profiles set role = 'super_admin'
   where email = 'admin@halong24h.com';   -- thay email của bạn
   ```
4. Đăng ký 1-2 user nữa làm owner:
   ```sql
   update profiles set role = 'owner'
   where email = 'owner1@example.com';
   ```

## 5. Seed sample data (optional — skip nếu launch DB sạch)

Sau khi đã có ít nhất 1 super_admin + 1 owner ở mục 4:

```sql
-- Paste 0009_seed_full.sql vào SQL Editor → Run
```

Sẽ tạo:
- 2 tenants (1 active "Halong Premier", 1 pending "Bãi Cháy Homestay")
- 3 properties + 4 rooms
- 1 subscription tier `standard` (12 phòng, 480k/tháng)
- 4 guests (VIP/returning/blacklist tags)
- 2 bookings + 4 hk_tasks + 2 hk_issues + 1 dispute

File này **idempotent** — chạy nhiều lần cũng không duplicate.

## 6. Auth config

Vào **Authentication → URL Configuration**:
- **Site URL:** `https://halong24h.com`
- **Redirect URLs:** thêm `https://halong24h.com/**` và `http://localhost:3000/**` (cho dev)

Vào **Authentication → Providers → Email**:
- Bật `Confirm email` nếu muốn double opt-in
- Hoặc tắt nếu muốn signup tức thì (nhanh hơn nhưng dễ bị spam)

## 7. SMTP (cho password reset email)

Free tier Supabase chỉ cho 4 email/giờ. Production nên dùng SMTP riêng:

**Authentication → SMTP Settings:**
- Gợi ý: Resend ($0/tháng < 3000 mail), SendGrid, Postmark, Mailgun
- Sender email: `noreply@halong24h.com` (cần verify DNS SPF/DKIM)

## 8. Cron (refresh subscriptions hàng tháng)

Migration `0008` đã tạo function `refresh_all_subscriptions()`. Chạy hằng tháng để recompute tier theo room_count + monthly_fee:

**Database → Cron Jobs → New job:**
```sql
select cron.schedule(
  'refresh-subscriptions',
  '0 2 1 * *',  -- 02:00 ngày 1 hằng tháng
  $$ select refresh_all_subscriptions(); $$
);
```

## Schema overview

```
profiles ──┬── (role: super_admin/owner/sale/housekeeping/customer)
           │
           └── tenants ──┬── tenant_members
                         ├── subscriptions ── invoices
                         ├── guests (CRM)
                         └── properties ──┬── property_images
                                          ├── rooms ──┬── room_images
                                          │           ├── pricing_rules
                                          │           ├── room_blocks
                                          │           ├── hk_tasks ──── hk_issues
                                          │           └── bookings ──┬── payments
                                          ├── leads                  ├── reviews
                                          └── reviews                └── disputes
audit_logs ── (tracks all admin/owner actions)
```
