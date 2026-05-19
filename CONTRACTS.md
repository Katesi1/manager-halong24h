# CONTRACTS.md — Shared contracts giữa Customer site & Manager site

> **Source of truth khi 2 site đồng bộ.** File này phải KHỚP NHAU ở cả 2 repo:
> - `D:\Webhalong24hOnline\CONTRACTS.md` (customer)
> - `D:\Webhalong24hManager\CONTRACTS.md` (host/admin)
>
> **Manager dẫn, Customer theo.** Khi BE / domain entity đổi → cập nhật ở Manager trước → copy file này sang customer → customer site sync UI/types.

---

## 1. Role

Source: [Manager core/value-objects/role.ts](file:///D:/Webhalong24hManager/src/core/value-objects/role.ts)

```
ADMIN    = 0   (admin.webhalong24h.com)
OWNER    = 1   (host.webhalong24h.com — chủ nhà)
SALE     = 2   (staff thuộc OWNER)
CUSTOMER = 3   (webhalong24h.com — khách)
```

- Customer site CHỈ tạo `role: 3` khi signup (ép cứng).
- Manager đăng nhập với role 0/1/2; nếu user role=3 cố vào → redirect ra customer site.

---

## 2. BookingStatus — 5 states (CANONICAL)

Source: [Manager core/entities/booking.ts](file:///D:/Webhalong24hManager/src/core/entities/booking.ts)

| Code | Label (host) | Label (customer) | Ý nghĩa |
|------|--------------|------------------|---------|
| `hold` | Giữ chỗ | Chờ chủ duyệt | Khách gửi yêu cầu, slot bị giữ 24h chờ chủ phản hồi. Staff walk-in: 30 phút. |
| `confirmed` | Chờ khách cọc | Chờ bạn cọc | Chủ đã xác nhận có phòng, đã gửi email kèm VietQR + memo `HL24H-{id}`. Đang chờ khách chuyển 50%. |
| `paid` | Đã nhận tiền | Đã xác nhận | Chủ đã nhận cọc + đã gửi email phiếu check-in. Booking chốt. |
| `cancelled` | Đã huỷ | Đã huỷ | Huỷ bởi chủ/khách/quá hạn không cọc/bất khả kháng. |
| `completed` | Hoàn tất | Hoàn tất | Khách đã check-out. Mở review 2 chiều. |

### Transition graph (BE enforce)

```
            (khách gửi)              (chủ duyệt)
   [start] ───────────────► hold ────────────────► confirmed
                              │                       │
                              │ (chủ từ chối /         │ (khách cọc + chủ confirm)
                              │  quá 24h không cọc)   │
                              ▼                       ▼
                          cancelled ◄─────────  paid
                                                       │
                                                       │ (sau ngày check-out)
                                                       ▼
                                                   completed
```

### Tab grouping ở UI customer

| Tab | Status thuộc tab |
|-----|------------------|
| `upcoming` (Sắp tới) | `confirmed`, `paid` |
| `pending` (Đang xử lý) | `hold` |
| `done` (Hoàn tất) | `completed` |
| `cancelled` (Đã huỷ) | `cancelled` |

### Variant màu badge (cả 2 site dùng chung)

| Status | Badge variant | Tailwind hint |
|--------|---------------|---------------|
| `hold` | `gold` | text-gold-700 |
| `confirmed` | `warning` | text-amber-600 |
| `paid` | `info` | text-navy-900 |
| `cancelled` | `danger` | text-red-700 |
| `completed` | `success` | text-emerald-600 |

> **CẢNH BÁO:** Customer site trước đây dùng 7 states (`pending_host`, `pending_deposit`, `pending_host_confirm`, `confirmed`, `checked_in`, `completed`, `cancelled`). **ĐÃ DEPRECATE.** Không phục hồi. Không có state `checked_in` riêng — `paid` đã ngụ ý booking active đến hết ngày check-out.

---

## 3. PropertyType / View / CancellationPolicy

Source: [Manager core/value-objects/property-type.ts](file:///D:/Webhalong24hManager/src/core/value-objects/property-type.ts)

```
PropertyType:
  VILLA    = 0
  HOMESTAY = 1
  HOTEL    = 2

PropertyView: 'sea' | 'city'

CancellationPolicy:
  FLEXIBLE = 0  → 'Linh hoạt'
  MODERATE = 1  → 'Vừa phải'
  STRICT   = 2  → 'Nghiêm ngặt'
```

BE trả number, FE map sang label tiếng Việt qua helper.

---

## 4. PaymentStatus / PaymentMethod

Source: [Manager core/entities/payment.ts](file:///D:/Webhalong24hManager/src/core/entities/payment.ts)

```
PaymentStatus: 'pending' | 'paid' | 'refunded' | 'failed'
PaymentMethod: 'vietqr' | 'cash' | 'card' | 'transfer'
```

> **Lưu ý customer site:** không hiển thị PaymentStatus trực tiếp cho khách — khách chỉ nhìn thấy `BookingStatus`. Payment chỉ là detail bên trong Manager.

---

## 5. NotificationType

### Manager (host nhận):
Source: [Manager core/entities/notification.ts](file:///D:/Webhalong24hManager/src/core/entities/notification.ts)

```
booking_new        → có yêu cầu mới (hold)
booking_paid       → khách đã cọc (paid)
booking_cancelled  → khách / chủ huỷ
lead_new           → lead chưa convert
message_new        → tin nhắn mới
review_new         → khách vừa đánh giá
payment_received   → nhận tiền (đối soát)
system             → system notice
```

### Customer (khách nhận):
Source: [customer src/app/(public)/my/notifications/types.ts](file:///d:/Webhalong24hOnline/src/app/(public)/my/notifications/types.ts)

```
request_new        → chủ đã duyệt / từ chối yêu cầu (BookingStatus: hold → confirmed/cancelled)
deposit_required   → chủ đồng ý, đến lượt khách cọc (confirmed)
deposit_received   → chủ đã nhận cọc, booking chốt (paid)
booking_check_in   → sắp check-in
booking_check_out  → ngày check-out
booking_cancelled  → bị huỷ
message_new        → tin nhắn từ chủ
review_new         → nhắc viết review (completed)
review_reply       → chủ trả lời review
host_approved      → chủ đã xác minh KYC (verified badge)
host_rejected      → host KYC reject (filter ra khỏi listing)
dispute_update     → cập nhật tranh chấp
system             → system notice
```

Hai bên KHÔNG ánh xạ 1:1 — host quan tâm flow nhận booking, khách quan tâm flow trải nghiệm. BE có thể fan-out 1 event → 2 notification khác nhau cho 2 phía.

---

## 6. Email/SMS trigger points

Trigger ứng với chuyển state booking:

| Booking transition | Email khách | Email chủ |
|--------------------|-------------|-----------|
| `(none)` → `hold` (khách submit) | "Đã gửi yêu cầu, chờ chủ phản hồi trong 24h" | "Có yêu cầu booking mới — duyệt trong 24h" |
| `hold` → `confirmed` (chủ duyệt) | **"Chủ đã duyệt — cọc 50% trong 24h kèm VietQR + memo `HL24H-{id}`"** | — |
| `confirmed` → `paid` (chủ nhận tiền) | "Đã nhận cọc — phiếu check-in đính kèm" | "Đã confirm nhận cọc cho booking #{code}" |
| `hold` → `cancelled` (quá 24h chủ ko trả lời) | "Yêu cầu hết hạn — vui lòng tìm phòng khác" | "Yêu cầu đã huỷ tự động (quá hạn duyệt)" |
| `confirmed` → `cancelled` (quá 24h ko cọc) | "Yêu cầu đã huỷ do chưa cọc" | "Khách không cọc — slot mở lại" |
| `paid` → `completed` (cron sau check-out) | "Trải nghiệm thế nào? Đánh giá để giúp khách sau" | "Khách đã check-out — mời đánh giá khách" |

**Quy ước:** email gửi NGAY khi chuyển state (synchronous với API response), không delay. VietQR + memo phải có trong email mốc `hold → confirmed`.

---

## 7. Property field shape (BE → FE)

Source: [Manager core/entities/property.ts](file:///D:/Webhalong24hManager/src/core/entities/property.ts)

Customer site nhận shape `BeProperty` (xem [customer lib/api/properties.ts](file:///d:/Webhalong24hOnline/src/lib/api/properties.ts)):
- BE field camelCase (`weekdayPrice`, `cancellationPolicy`)
- Customer site map sang `PropertyCardData` qua `mapBeToPropertyCard()`

**Field ẨN với customer (BE PHẢI strip ở `/properties/public`):**
- `owner.phone` (anti-scraping SĐT chủ)
- `owner.email`
- `internal_notes`
- Bất kỳ field thuộc subscription/tenant

---

## 8. CalendarStatus

Source: [Manager core/entities/calendar.ts](file:///D:/Webhalong24hManager/src/core/entities/calendar.ts)

```
AVAILABLE = 0  → 'Trống'
LOCKED    = 1  → 'Đã khóa'
HOLD      = 2  → 'Đang giữ'  (có booking hold)
BOOKED    = 3  → 'Đã đặt'    (có booking confirmed/paid)
```

Endpoint customer site dùng: `GET /properties/{id}/public-grid?from&to` (không có note tên khách, chỉ status).

---

## 9. Source-of-truth pointers

Khi nghi ngờ, đọc theo thứ tự:

1. `D:\Webhalong24hManager\src\core\entities\` — domain entities, label, transition
2. `D:\Webhalong24hManager\api-spec-website-admin.md` — BE endpoint contract
3. File `CONTRACTS.md` này (bản sao đồng bộ ở 2 repo)
4. `d:\Webhalong24hOnline\CLAUDE.md` mục 1 + BUSINESS_RISKS.md — context nghiệp vụ
5. `d:\Webhalong24hOnline\API.md` — BE endpoint shape (customer-facing endpoints)

Nếu 1–2 mâu thuẫn 3–4 → 1–2 thắng, cập nhật 3 + sync 4.

---

## 10. Changelog

- **2026-05-16 (Sonnet):** Tạo CONTRACTS.md. Đồng bộ BookingStatus từ 7 → 5 states theo Manager. Document email trigger, notification fan-out, calendar status.
