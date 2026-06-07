# Halong24h Backend — Full API Spec for Frontend

> Tài liệu chính thức cho team FE Web (Next.js admin/host) và App Mobile (Android/iOS).
> Bao gồm tất cả endpoint, schema response, business rule, WebSocket guide và integration checklist.
>
> **Cập nhật**: 2026-06-05 (v1.3 — FE Q&A response + add endpoints, xem §21 & §22) · **BE base**: NestJS 11 · **DB**: PostgreSQL + Prisma · **Auth**: JWT · **Real-time**: Socket.IO

---

## Mục lục

1. [Quy ước chung](#1-quy-ước-chung)
2. [Auth & RBAC](#2-auth--rbac)
3. [Users](#3-users)
4. [Properties](#4-properties)
5. [Bookings](#5-bookings)
6. [Calendar](#6-calendar)
7. [Reviews](#7-reviews)
8. [Notifications & Devices](#8-notifications--devices)
9. [KYC](#9-kyc)
10. [Payment & Subscription](#10-payment--subscription)
11. [Staff Invites](#11-staff-invites)
12. [Permissions](#12-permissions)
13. [Disputes](#13-disputes)
14. [Audit Log](#14-audit-log)
15. [Leads](#15-leads)
16. [Admin Emails](#16-admin-emails)
17. [Chat (REST + WebSocket)](#17-chat-rest--websocket)
18. [App Version](#18-app-version)
19. [Enums reference](#19-enums-reference)
20. [FE integration checklist](#20-fe-integration-checklist)
21. [Changelog & Bug fixes](#21-changelog--bug-fixes)
22. [FE Q&A — Confirms & Design decisions](#22-fe-qa--confirms--design-decisions)

---

## 1. Quy ước chung

### 1.1 Base URL

| Environment | URL |
|---|---|
| Production | `https://api.halong24h.com` |
| Dev (nếu có) | `http://localhost:3000` |

Không có prefix `/api/v1`. Endpoint gọi thẳng `/auth/login`, `/properties`...

### 1.2 Headers

| Header | Bắt buộc | Mô tả |
|---|---|---|
| `Authorization: Bearer <accessToken>` | Có (trừ endpoint `Public`) | JWT access token (15 phút) |
| `Accept-Language` | Không | `vi` (mặc định) hoặc `en` — quyết định ngôn ngữ message |
| `Content-Type: application/json` | Có (POST/PUT/PATCH) | Trừ multipart upload |
| `X-Partner-Key` | Có (partner only) | Chỉ cho `/partner/*` |

### 1.3 Response envelope

**Thành công (2xx)**:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": { ... }
}
```

**Lỗi (4xx/5xx)**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "email": ["Email đã được sử dụng"],
    "password": ["Mật khẩu phải có ít nhất 8 ký tự"]
  },
  "path": "/auth/register",
  "timestamp": "2026-06-04T10:30:00.000Z"
}
```

FE đọc `errors[field]` để hiện inline error per-field.

### 1.4 HTTP status mapping

| Status | Ý nghĩa | Hành động FE |
|---|---|---|
| 200/201 | OK | Đọc `data` |
| 400 | Validation lỗi | Hiển thị `errors` từng field |
| 401 | Token sai/hết hạn | Tự gọi `/auth/refresh`, retry. Fail → logout |
| 403 | Không có quyền | Toast `message` |
| 404 | Không tìm thấy | "Không tìm thấy..." |
| 409 | Conflict (trùng email, trùng date, ...) | Hiển thị `message` |
| 410 | Gone (token đã dùng / expired) | Hiển thị `message` |
| 422 | Validation | Như 400 |
| 429 | Rate limit | "Quá nhiều yêu cầu, thử lại sau" |
| 5xx | Server error | Toast + retry exponential backoff 3 lần |

### 1.5 Kiểu dữ liệu

| Kiểu | Format | Ví dụ |
|---|---|---|
| Date chỉ ngày | `YYYY-MM-DD` | `2026-06-15` |
| DateTime | ISO 8601 UTC | `2026-06-04T10:30:00.000Z` |
| Tiền VND | Integer (không thập phân) | `1500000` = 1.500.000đ |
| Phone | 10 số bắt đầu `0` | `0901234567` |
| UUID | 36 ký tự v4 | `7c9e6679-7425-40de-944b-e07fc1f90ae7` |

### 1.6 Rate limit

| Nhóm | Giới hạn |
|---|---|
| `/auth/register`, `/auth/forgot-password`, `/auth/reset-password` | 5 req/giờ/IP |
| `/auth/login`, `/auth/google`, `/auth/apple` | 10 req/15 phút/IP |
| `/staff/invites/verify/:token`, `/leads (POST public)` | 10 req/phút/IP |
| Mặc định | 100 req/phút/IP (qua ThrottlerGuard) |

Vượt → `429 Too Many Requests`.

### 1.7 Token refresh flow

```
Request gốc → 401
  ↓ (Authenticator lock mutex)
POST /auth/refresh { refreshToken } → tokens mới
  ↓
Lưu access + refresh mới (httpOnly cookie / EncryptedSharedPreferences)
  ↓
Retry request gốc
  ↓ Nếu refresh fail (401) → logout về /login
```

---

## 2. Auth & RBAC

### 2.1 Roles

| Code | Role | Tạo bằng |
|---|---|---|
| `0` | ADMIN | Seed trong DB |
| `1` | OWNER | Tự đăng ký |
| `2` | SALE | Owner mời qua staff invite hoặc admin tạo |
| `3` | CUSTOMER | Tự đăng ký |

### 2.2 Endpoints

| Method | Path | Auth | Body |
|---|---|---|---|
| `POST` | `/auth/register` | Public | `{ name, email, password, role: 1\|3, phone? }` |
| `POST` | `/auth/login` | Public | `{ identifier, password }` (`identifier` = email hoặc phone) |
| `POST` | `/auth/google` | Public | `{ idToken, role? }` (`role` bắt buộc cho user mới) |
| `POST` | `/auth/apple` | Public | `{ idToken, role?, email?, name?, identityToken? }` |
| `POST` | `/auth/refresh` | Public | `{ refreshToken }` |
| `POST` | `/auth/forgot-password` | Public | `{ identifier }` |
| `POST` | `/auth/reset-password` | Public | `{ token, newPassword }` |
| `POST` | `/auth/logout` | Bearer | — |
| `GET` | `/auth/profile` | Bearer | — |
| `POST` | `/auth/change-password` | Bearer | `{ currentPassword, newPassword }` |

### 2.3 Response

**`/login`, `/register`, `/google`, `/apple`, `/refresh`** đều trả:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "name": "...",
    "email": "...",
    "phone": "...",
    "avatar": "https://...",
    "role": 1,
    "ownerId": null,
    "isActive": true,
    "emailVerified": true,
    "kycStatus": "approved",
    "subscriptionStatus": "active",
    "subscriptionPlanId": "rooms_5",
    "subscriptionCycle": "monthly",
    "subscriptionProvider": "vnpay",
    "subscriptionPriceOverride": null,
    "subscriptionFrozenAt": null,
    "subscriptionFrozenReason": null,
    "trialEndsAt": null,
    "nextChargeAt": "2026-07-04T00:00:00.000Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 2.4 GET /auth/profile

Trả `user` object như trên + thêm field `permissions[]` cho SALE:
```json
{
  "...": "...",
  "permissions": [
    { "module": "properties", "canCreate": false, "canRead": true, "canUpdate": false, "canDelete": false },
    { "module": "bookings",   "canCreate": true,  "canRead": true,  "canUpdate": true,  "canDelete": false }
  ]
}
```

### 2.5 Device anti-spam

Backend chặn quá 3 account tạo cùng 1 device trong 24h (dựa trên `User-Agent` + IP). App nên gắn UA ổn định.

---

## 3. Users

Base path: `/users`. Tất cả cần Bearer.

### 3.1 Owner / Admin endpoints

| Method | Path | Role | Body / Query | Mô tả |
|---|---|---|---|---|
| `GET` | `/users?role=` | ADMIN | `?role` (0-3) | List toàn hệ |
| `GET` | `/users/available-staff` | ADMIN/OWNER | — | SALE chưa gán owner |
| `GET` | `/users/my-staff` | OWNER | — | Nhân viên của tôi |
| `GET` | `/users/:id` | ADMIN/OWNER | — | Admin: bất kỳ; Owner: SALE thuộc team |
| `POST` | `/users` | ADMIN | `{ name, email, password?, phone?, role, ownerId? }` | Admin tạo user |
| `POST` | `/users/my-staff` | OWNER | `{ email }` | Owner add SALE đã có account vào team |
| `PUT` | `/users/:id` | Any auth | `{ name?, phone?, email?, gender?, dateOfBirth?, avatar? }` | Admin sửa anyone, user khác sửa chính mình |
| `PATCH` | `/users/:id/kyc-bypass` | ADMIN | `{ bypass: boolean }` | Cấp/thu hồi quyền bỏ qua KYC |
| `DELETE` | `/users/me` | Any auth | `{ reason? }` | Self-delete (GDPR) |
| `DELETE` | `/users/my-staff/:id` | OWNER | — | Owner gỡ nhân viên |
| `DELETE` | `/users/:id` | ADMIN | — | Admin xoá user |

### 3.2 Admin moderation actions

| Method | Path | Body | Mô tả |
|---|---|---|---|
| `POST` | `/users/:id/ban` | `{ reason }` (≥5 chars) | Ban user, xoá refresh token + FCM |
| `POST` | `/users/:id/unban` | — | Gỡ ban |
| `POST` | `/users/:id/revoke-sessions` | — | Xoá refresh token + tất cả FCM token |
| `POST` | `/users/:id/reset-password` | `{ newPassword? }` | Không truyền → BE sinh mật khẩu tạm và trả về 1 lần trong `data.tempPassword` |
| `PATCH` | `/users/:id/role` | `{ role: 0\|1\|2\|3 }` | Đổi role; ADMIN/OWNER/CUSTOMER → tự clear ownerId |

> Mỗi action tự ghi audit log.

---

## 4. Properties

Base path: `/properties`.

### 4.1 Public

| Method | Path | Query |
|---|---|---|
| `GET` | `/properties/public` | `checkinDate?, checkoutDate?, guests?, minPrice?, maxPrice?, type?, view?` |
| `GET` | `/properties/share/:id` | — (trả PropertyDto không kèm giá) |

### 4.2 Authenticated CRUD

| Method | Path | Role |
|---|---|---|
| `GET` | `/properties?includeInactive&view` | ADMIN/OWNER/SALE |
| `GET` | `/properties/:id` | Any auth |
| `POST` | `/properties` | ADMIN/OWNER (+ permission) |
| `PATCH` | `/properties/:id` | ADMIN/OWNER/SALE (+ permission) |
| `PUT` | `/properties/:id/prices` | ADMIN/OWNER/SALE (+ permission) |
| `DELETE` | `/properties/:id` | ADMIN/OWNER (+ permission) |

### 4.3 Images (multipart)

| Method | Path |
|---|---|
| `POST` | `/properties/:id/images` — field `images[]`, max 20 file × 10MB, JPG/PNG/WEBP |
| `DELETE` | `/properties/:id/images/:imageId` |
| `PATCH` | `/properties/:id/images/:imageId/cover` |

### 4.4 Admin moderation

| Method | Path | Body |
|---|---|---|
| `POST` | `/properties/:id/approve` | — |
| `POST` | `/properties/:id/reject` | `{ reason }` (≥5 chars) |
| `POST` | `/properties/:id/suspend` | `{ reason? }` |

> **Business rule**: OWNER tạo property → mặc định `moderationStatus = "pending"`, `isActive = false` (chưa public). ADMIN/SALE tạo → `approved` ngay.
> **OWNER/SALE list:** `GET /properties` tự động bao gồm property `pending/rejected/suspended` của mình (không cần truyền `?includeInactive=true`). ADMIN/khác phải truyền `?includeInactive=true` mới thấy inactive.

**Moderation status** (sau fix v1.1):
- `pending` — OWNER vừa tạo, chờ admin duyệt
- `approved` — admin đã duyệt, property công khai
- `rejected` — admin từ chối (property chưa bao giờ hoạt động hoặc bị reject lần đầu) → OWNER có thể edit và submit lại
- `suspended` — admin tạm ngưng property đang hoạt động (đã từng approved) → khác `rejected` về semantic, OWNER không tự reactivate được

### 4.5 PropertyDto

```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "name": "Villa Hạ Long View",
  "type": 0,
  "code": "VL001",
  "view": "sea",
  "address": "Bãi Cháy",
  "mapLink": "https://maps.google.com/...",
  "isActive": true,
  "moderationStatus": "approved",
  "moderationRejectedReason": null,
  "moderationReviewedAt": null,
  "moderationReviewedBy": null,
  "bedrooms": 3, "bathrooms": 2,
  "standardGuests": 6, "maxGuests": 8,
  "weekdayPrice": 2000000, "weekendPrice": 3000000, "holidayPrice": 4500000,
  "adultSurcharge": 200000, "childSurcharge": 100000,
  "amenities": ["wifi", "pool"],
  "cancellationPolicy": 1,
  "rules": "...", "services": ["..."], "description": "...",
  "checkInTime": "14:00", "checkOutTime": "12:00",
  "images": [{ "id": "uuid", "url": "https://...", "isCover": true }]
}
```

---

## 5. Bookings

Base path: `/bookings`. Auth required.

### 5.1 Endpoints

| Method | Path | Role | Body / Query |
|---|---|---|---|
| `GET` | `/bookings?propertyId&status&page&limit` | ADMIN/OWNER/SALE | — |
| `GET` | `/bookings/my-bookings?status&page&limit` | Any auth | — |
| `GET` | `/bookings/calendar/:propertyId?year&month` | ADMIN/OWNER/SALE | Lịch tháng cho 1 property |
| `GET` | `/bookings/:id` | ADMIN/OWNER/SALE | — |
| `POST` | `/bookings/hold` | ADMIN/OWNER/SALE (CUSTOMER bị chặn) | Hold 30 phút |
| `POST` | `/bookings/customer-hold` | CUSTOMER (+all) | Hold 24h |
| `PATCH` | `/bookings/:id/confirm` | ADMIN/OWNER/SALE | HOLD → CONFIRMED |
| `PATCH` | `/bookings/:id/paid` | ADMIN/OWNER/SALE | `{ amount? }` Ghi nhận thu tiền |
| `PATCH` | `/bookings/:id/cancel` | ADMIN/OWNER/SALE | — |
| `PATCH` | `/bookings/:id/customer-cancel` | Any auth | Customer huỷ HOLD của mình |
| `PUT` | `/bookings/:id` | ADMIN/OWNER/SALE | Update customerName/Phone/guests/notes/deposit |

### 5.2 POST /bookings/hold body

```json
{
  "propertyId": "uuid",
  "checkinDate": "2026-06-15",
  "checkoutDate": "2026-06-17",
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0901234567",
  "depositAmount": 500000,
  "guestCount": 4,
  "notes": "..."
}
```

### 5.3 BookingDto

```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "saleId": "uuid?",
  "customerId": "uuid?",
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0901234567",
  "checkinDate": "2026-06-15",
  "checkoutDate": "2026-06-17",
  "status": 0,
  "holdExpireAt": "2026-06-04T11:00:00.000Z",
  "holdRemainingSeconds": 1700,
  "depositAmount": 500000,
  "totalAmount": 4000000,
  "paidAmount": null,
  "paidAt": null,
  "guestCount": 4,
  "notes": "..."
}
```

Status: `0=HOLD, 1=CONFIRMED, 2=CANCELLED, 3=COMPLETED`

### 5.4 PATCH /bookings/:id/paid

Body optional: `{ amount? }`. Nếu bỏ trống → BE dùng `totalAmount` hoặc `depositAmount`. Nếu booking đang HOLD → tự chuyển sang CONFIRMED + clear `holdExpireAt`.

---

## 6. Calendar

Base path: `/calendar`.

### 6.1 Endpoints

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/calendar/properties?type&ownerId` | Bearer | List properties cho calendar |
| `GET` | `/calendar/public-grid?startDate&endDate&propertyId&type` | Public | Master calendar không cần auth |
| `GET` | `/calendar/grid?startDate&endDate&propertyId&type` | Bearer | Same nhưng kèm note (tên khách) |
| `POST` | `/calendar/lock` | Bearer | `{ propertyId, date, status? }` |
| `DELETE` | `/calendar/lock` | Bearer | `{ propertyId, date }` |
| `PATCH` | `/calendar/sold` | Bearer | `{ propertyId, date }` |
| `POST` | `/calendar/bulk` | Bearer | `{ mode: "lock"\|"unlock", items: [{propertyId, date}] }` (≤100 items) |
| `GET` | `/calendar/admin-contact` | Public | Phone/email admin để khách liên hệ |

### 6.2 Grid response

```json
{
  "properties": [
    {
      "id": "uuid", "name": "...", "type": 0,
      "days": [
        { "date": "2026-06-15", "status": "available", "note": null, "bookingId": null },
        { "date": "2026-06-16", "status": "hold", "note": "Nguyễn Văn A", "bookingId": "..." },
        { "date": "2026-06-17", "status": "booked", "note": "...", "bookingId": "..." },
        { "date": "2026-06-18", "status": "locked", "note": null, "bookingId": null }
      ]
    }
  ]
}
```

Status string: `available | hold | booked | locked`.

### 6.3 Bulk response

```json
{
  "mode": "lock",
  "total": 30,
  "succeeded": 28,
  "failed": 2,
  "results": [
    { "propertyId": "...", "date": "2026-06-15", "ok": true },
    { "propertyId": "...", "date": "2026-06-16", "ok": false, "error": "Ngày này đã được khoá hoặc đặt" }
  ]
}
```

---

## 7. Reviews

### 7.1 Customer + Public

| Method | Path | Role | Body |
|---|---|---|---|
| `POST` | `/properties/:id/reviews` | CUSTOMER | `{ bookingId, cleanliness, location, amenities, service, value, accuracy (1-5), comment?, photos?[] }` |
| `GET` | `/properties/:id/reviews?page&pageSize&sort&minRating` | Public | sort: `newest\|oldest\|highest\|lowest` |
| `POST` | `/properties/:id/reviews/:reviewId/reply` | ADMIN/OWNER | `{ reply }` |

### 7.2 Admin moderation

| Method | Path | Body |
|---|---|---|
| `GET` | `/admin/reviews?status=visible\|hidden\|all&rating&search&page&pageSize` | — |
| `GET` | `/admin/reviews/count-flagged` | Badge sidebar |
| `DELETE` | `/admin/reviews/:reviewId` | `{ reason }` ≥5 chars (hide) |
| `POST` | `/admin/reviews/:reviewId/restore` | — |

### 7.3 ReviewDto

```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "bookingId": "uuid",
  "customerId": "uuid",
  "cleanliness": 5, "location": 4, "amenities": 5,
  "service": 5, "value": 4, "accuracy": 5,
  "avgRating": 4.67,
  "comment": "Phòng đẹp...",
  "photos": ["https://..."],
  "ownerReply": "Cảm ơn...", "ownerReplyAt": "...",
  "isHidden": false, "hiddenReason": null,
  "createdAt": "...", "updatedAt": "..."
}
```

---

## 8. Notifications & Devices

### 8.1 Notifications

Base path: `/notifications`. Auth required.

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/notifications?type&isRead&page&limit` | List |
| `GET` | `/notifications/unread-count` | `{ count }` |
| `PATCH` | `/notifications/:id/read` | Mark 1 read |
| `PATCH` | `/notifications/read-all` | Mark all read |

### 8.2 NotificationDto

```json
{
  "id": "uuid",
  "title": "Đặt phòng được xác nhận",
  "subtitle": "Villa A — booking đã confirm",
  "type": 0,
  "isRead": false,
  "createdAt": "...",
  "targetId": "<bookingId>",
  "targetType": "booking"
}
```

Type: `0=BOOKING, 1=PAYMENT, 2=SYSTEM`.

### 8.3 Devices (FCM)

Base path: `/devices`. Auth required.

| Method | Path | Body | Khi nào gọi |
|---|---|---|---|
| `POST` | `/devices` | `{ fcmToken, platform: "ios"\|"android", deviceModel?, osVersion?, appVersion?, locale? }` | Sau login + mỗi `onNewToken` |
| `DELETE` | `/devices/:token` | — | Trước khi logout |
| `GET` | `/devices` | — | Màn "Quản lý phiên" |

> Idempotent: gọi lại cùng token → no-op. Nếu token đang gắn user khác → tự transfer sang user mới.

### 8.4 FCM push payload

BE gửi data-message (không phải notification message):
```json
{
  "type": "booking",
  "title": "Booking mới",
  "subtitle": "...",
  "targetId": "<bookingId>",
  "targetType": "booking",
  "notificationId": "<uuid>",
  "pushType": "booking_confirmed",
  "deepLink": "/bookings/<bookingId>"
}
```

`pushType` mới: `chat_message`, `lead_new`, `dispute_opened`, `dispute_resolved`, `subscription_frozen`, `subscription_price_changed`, ...

---

## 9. KYC

### 9.1 Owner self KYC

Base path: `/kyc`. Role: OWNER.

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/kyc/upload-cccd-front` | multipart `image`, optional `ocrResult` (JSON string) |
| `POST` | `/kyc/upload-cccd-back` | Same |
| `POST` | `/kyc/upload-selfie` | Same |
| `POST` | `/kyc/submit` | Submit → status=pending |
| `GET` | `/kyc/status` | Owner xem trạng thái |
| `GET` | `/kyc/submissions/:id` | Detail (owner hoặc admin) |
| `POST` | `/kyc/submissions/:id/resubmit` | `{ items: ["cccdFront", "selfie"] }` |

Status string: `none | pending | approved | rejected`.

### 9.2 Admin KYC

Base path: `/admin/kyc`. Role: ADMIN.

| Method | Path | Body |
|---|---|---|
| `GET` | `/admin/kyc/queue?page&pageSize&status` | — |
| `GET` | `/admin/kyc/count-pending` | Badge |
| `GET` | `/kyc/submissions/:id` | Detail (admin gọi được) |
| `POST` | `/admin/kyc/submissions/:id/approve` | `{ trialDays? }` (default 7) |
| `POST` | `/admin/kyc/submissions/:id/reject` | `{ reason, items?[] }` |

---

## 10. Payment & Subscription

### 10.1 Plans + Owner self

| Method | Path | Role | Mô tả |
|---|---|---|---|
| `GET` | `/billing/plans` | Public | Danh sách gói (rooms_1, rooms_5, ...) |
| `GET` | `/subscriptions/me` | OWNER/SALE | Subscription của mình (SALE tự resolve theo ownerId) |

### 10.2 Owner payment

Base path: `/payments`. Role: OWNER.

| Method | Path | Body |
|---|---|---|
| `POST` | `/payments/initiate` | `{ planId, cycle, method, rooms, totalAmount }` → trả session với `paymentUrl/qrCode` |
| `POST` | `/payments/renew` | `{ method }` |
| `GET` | `/payments/history?limit&cursor` | — |
| `GET` | `/payments/:sessionId/status` | — |
| `POST` | `/payments/:sessionId/refund` | — |

Method values: `vnpay_qr | bank_transfer | card`.

### 10.3 Apple IAP

| Method | Path | Role | Body |
|---|---|---|---|
| `POST` | `/payments/apple/verify` | OWNER | `{ productId, purchaseId }` |
| `POST` | `/webhooks/apple/s2s-notifications` | Public | Apple JWT signed |

### 10.4 Admin subscription management

Base path bắt đầu `/admin/users/:id/subscription` hoặc `/admin/subscriptions`. Role: ADMIN.

| Method | Path | Body | Mô tả |
|---|---|---|---|
| `GET` | `/admin/subscriptions?status&plan&search&page&limit` | — | List toàn hệ |
| `GET` | `/admin/subscriptions/count-overdue` | — | Badge |
| `GET` | `/admin/subscriptions/sum-paid?from&to` | — | Tổng doanh thu kỳ |
| `GET` | `/admin/users/:id/subscription` | — | Snapshot user |
| `POST` | `/admin/users/:id/trial` | `{ days, planId?, cycle?, rooms?, reason? }` | Cấp/gia hạn trial |
| `DELETE` | `/admin/users/:id/trial?reason` | — | Thu hồi trial |
| `PATCH` | `/admin/users/:id/subscription/price` | `{ priceOverride: number\|null, reason? }` | **Điều chỉnh giá** cho user (VND/kỳ). `null` = xoá override |
| `POST` | `/admin/users/:id/subscription/mark-paid` | `{ amount, days?, planId?, cycle?, rooms?, reference?, note? }` | Manual mark-paid |
| `POST` | `/admin/users/:id/subscription/freeze` | `{ reason }` (≥5) | Đóng băng |
| `POST` | `/admin/users/:id/subscription/unfreeze` | — | Mở đóng băng |

### 10.5 Subscription status

`none | trial | active | past_due | cancelled | frozen | expired`.

Provider: `apple_iap | vnpay | manual_bank | manual | null`.

### 10.6 Pricing override

`User.subscriptionPriceOverride` (VND/kỳ) — admin set giá custom. Khi user gọi `POST /payments/initiate`/`renew`, BE sẽ dùng giá này thay vì công thức plan. Tolerance 1%.

- `priceOverride = 0` được phép, nghĩa là **miễn phí** cho user đó — `expectedTotal = 0`, FE truyền `totalAmount: 0`.
- `priceOverride = null` (xoá override) → fallback về giá plan.

### 10.7 State transitions

- **Mark-paid idempotency**: nếu admin click 2 lần trong 10 giây → request thứ 2 bị reject với 409 (`markPaidDuplicate`), tránh tạo double Subscription row.
- **Grant trial cấm khi `frozen`**: phải unfreeze trước khi grant trial. Trả 409 `cannotGrantTrialFrozen`.
- **Unfreeze restore policy**: tự khôi phục đúng trạng thái trước freeze:
  - User có `trialEndsAt` còn hiệu lực → `TRIAL`
  - Subscription `endsAt > now` → `ACTIVE`
  - Else → `PAST_DUE`
- **Mark-paid khi user đang trial**: BE clear `trialEndsAt` (chuyển sang ACTIVE), nhưng lưu `previousTrialEndsAt` vào audit metadata để có thể trace.

---

## 11. Staff Invites

Base path: `/staff`.

### 11.1 Owner / Admin endpoints

| Method | Path | Role | Body / Query |
|---|---|---|---|
| `POST` | `/staff/invites` | OWNER/ADMIN | `{ email, ownerId? }` (`ownerId` bắt buộc khi caller là ADMIN) |
| `GET` | `/staff/invites?status&ownerId` | OWNER/ADMIN | — |
| `DELETE` | `/staff/invites/:id` | OWNER/ADMIN | — |
| `GET` | `/staff?isActive&ownerId` | OWNER/ADMIN | List SALE |
| `DELETE` | `/staff/:userId` | OWNER/ADMIN | Remove SALE |

ADMIN dùng `?ownerId=` để filter theo OWNER cụ thể, không truyền → xem tất cả.

### 11.2 Public endpoints (cho landing page accept invite)

| Method | Path | Body |
|---|---|---|
| `GET` | `/staff/invites/verify/:token` | — (token đầy đủ 64 chars hoặc short `HL-XXXXXX`) |
| `POST` | `/staff/invites/accept` | `{ token, method: "google"\|"password", idToken?, name?, password?, phone? }` |

### 11.3 Status invite

`pending | accepted | expired | cancelled`.

TTL invite: 7 ngày. Khi expire → tự chuyển status `expired` (qua cleanup query).

---

## 12. Permissions

Base path: `/permissions`. Role: ADMIN.

| Method | Path | Body |
|---|---|---|
| `GET` | `/permissions/:userId` | — |
| `PUT` | `/permissions/:userId` | `{ permissions: [{ module, canCreate, canRead, canUpdate, canDelete }] }` |

Modules: `properties | bookings | calendar | reviews`.

---

## 13. Disputes

### 13.1 Open (any authenticated)

| Method | Path | Body |
|---|---|---|
| `POST` | `/disputes` | `{ bookingId, type, subject (≥5), description (≥10), amount?, attachments?[≤10 URL] }` |

ACL: OWNER/SALE của property, CUSTOMER của booking, hoặc ADMIN.

### 13.2 Admin

| Method | Path | Body |
|---|---|---|
| `GET` | `/admin/disputes?status&type&search&page&limit` | — |
| `GET` | `/admin/disputes/count-active` | Badge (pending + investigating) |
| `GET` | `/admin/disputes/:id` | Detail kèm property/booking/owner/customer |
| `POST` | `/admin/disputes/:id/investigate` | — pending → investigating |
| `POST` | `/admin/disputes/:id/resolve` | `{ resolution (≥5), refundAmount? }` |
| `POST` | `/admin/disputes/:id/reject` | `{ resolution (≥5) }` |

### 13.3 Enums

- Type: `refund_request | service_quality | damage_claim | no_show | overbooking | other`
- Status: `pending | investigating | resolved | rejected`
- Opener type (BE tự tính, FE đọc): `owner | sale | customer | admin`

---

## 14. Audit Log

| Method | Path | Role | Query |
|---|---|---|---|
| `GET` | `/admin/audit-log?action&targetType&actorId&search&from&to&page&limit` | ADMIN | — |

> **Audit log do BE tự ghi mỗi khi admin gọi API**. FE KHÔNG cần gọi thêm endpoint nào để log. FE chỉ cần endpoint này để xem.

### 14.1 Action slugs

`user.ban`, `user.unban`, `user.revoke_sessions`, `user.reset_password`, `user.change_role`,
`property.approve`, `property.reject`, `property.suspend`,
`user.delete`, `user.kyc_bypass_toggle`,
`subscription.trial_grant`, `subscription.trial_revoke`, `subscription.set_price`, `subscription.mark_paid`, `subscription.freeze`, `subscription.unfreeze`,
`review.hide`, `review.restore`,
`kyc.approve`, `kyc.reject`,
`dispute.investigate`, `dispute.resolve`, `dispute.reject`,
`booking.mark_paid`.

### 14.2 Target types

`user | property | booking | dispute | subscription | review | kyc`

> **Note (v1.1)**: tất cả subscription admin action lưu `targetType=user` (vì identifier là userId, không phải subscriptionId). Filter `targetType=user` + `action=subscription.*` để lấy lịch sử subscription của user.

### 14.3 Audit entry

```json
{
  "id": "uuid",
  "actorId": "uuid",
  "actorRole": 0,
  "actor": { "id": "...", "name": "...", "email": "...", "role": 0 },
  "action": "user.ban",
  "targetType": "user",
  "targetId": "<userId>",
  "targetLabel": "spammer@example.com",
  "metadata": { "reason": "..." },
  "ipAddress": "1.2.3.4",
  "userAgent": "Mozilla/...",
  "createdAt": "..."
}
```

---

## 15. Leads

| Method | Path | Auth | Body / Query |
|---|---|---|---|
| `POST` | `/leads` | **Public** (rate-limit 10/phút/IP) | `{ propertyId?, guestName, guestPhone, guestEmail?, checkIn?, checkOut?, numGuests?, message?, source? }` |
| `GET` | `/leads?status&propertyId&page&limit` | ADMIN/OWNER/SALE | OWNER/SALE: của mình; ADMIN: tất cả |
| `GET` | `/leads/:id` | ADMIN/OWNER/SALE | — |
| `PATCH` | `/leads/:id` | ADMIN/OWNER/SALE | `{ status?, assignedToId?, notes? }` |

Status: `new | contacted | rejected | expired | converted`.
Source: `public_form | landing_page | partner | manual`.

> Khi đổi sang `contacted` → BE tự set `contactedAt + contactedById`.

---

## 16. Admin Emails

Base path: `/admin/emails`. Role: ADMIN.

| Method | Path | Body |
|---|---|---|
| `GET` | `/admin/emails/templates` | — → `{ smtpEnabled, templates: [{ key }] }` |
| `POST` | `/admin/emails/test` | `{ template, to }` → `{ sent: boolean }` |

15 template keys: `welcome_owner`, `welcome_sale`, `password_reset`, `booking_confirmed`, `booking_cancelled`, `booking_paid`, `kyc_approved`, `kyc_rejected`, `staff_invite`, `subscription_due`, `subscription_overdue`, `subscription_paid`, `dispute_opened`, `review_received`, `property_approved`.

---

## 17. Chat (REST + WebSocket)

### 17.1 REST endpoints

Base path: `/conversations`. Auth required.

| Method | Path | Body / Query | Mô tả |
|---|---|---|---|
| `GET` | `/conversations?role&page&limit` | — | Inbox sort `lastMessageAt DESC`. Trả `myUnread` per item |
| `GET` | `/conversations/unread-count` | — | Badge tổng |
| `POST` | `/conversations` | `{ type: "booking"\|"support"\|"staff", bookingId?, subject? }` | Idempotent với booking-type |
| `GET` | `/conversations/:id` | — | Detail kèm members hydrated |
| `GET` | `/conversations/:id/messages?cursor&limit` | — | Cursor-based, return oldest-first + `nextCursor` |
| `POST` | `/conversations/:id/messages` | `{ content, attachments? }` | REST fallback gửi tin — tự broadcast qua WS |
| `PATCH` | `/conversations/:id/read` | — | Mark read |
| `PATCH` | `/conversations/messages/:messageId` | `{ content }` | Sửa tin nhắn (chỉ sender, trong 15 phút). Broadcast `message:edit` |
| `DELETE` | `/conversations/messages/:messageId` | — | Xoá tin (sender hoặc admin). Soft-delete. Broadcast `message:delete` |

### 17.2 ConversationDto

```json
{
  "id": "uuid",
  "type": "booking",
  "bookingId": "uuid?",
  "propertyId": "uuid?",
  "subject": "...",
  "lastMessageAt": "2026-06-04T10:30:00.000Z",
  "lastMessagePreview": "Chào bạn, ...",
  "lastSenderId": "uuid",
  "hasDispute": false,
  "archivedAt": null,
  "createdAt": "...",
  "members": [
    {
      "userId": "uuid",
      "role": "owner",
      "lastReadAt": "...",
      "unreadCount": 0,
      "user": { "id": "uuid", "name": "...", "avatar": "..." }
    }
  ],
  "myUnread": 3
}
```

### 17.3 MessageDto

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "content": "...",
  "attachments": [{ "url": "https://...", "type": "image/jpeg", "name": "...", "size": 12345 }],
  "isSystem": false,
  "editedAt": null,
  "deletedAt": null,
  "createdAt": "..."
}
```

### 17.4 WebSocket

**URL**: `wss://api.halong24h.com/chat`

**Connect với JWT**:
```js
import { io } from 'socket.io-client';

const socket = io('https://api.halong24h.com/chat', {
  auth: { token: accessToken },
  query: { lang: 'vi' }, // hoặc 'en' — BE resolve locale cho error messages
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
});

socket.on('connect', () => console.log('connected'));
socket.on('error', (e) => console.error(e.message));
```

> **Note**: BE đọc locale từ `query.lang` hoặc `Accept-Language` header. Mọi error message trả về qua `error` event đã dịch theo locale.

**Client → Server events**:

| Event | Payload |
|---|---|
| `message:send` | `{ conversationId, content, attachments? }` |
| `read` | `{ conversationId }` |
| `typing:start` | `{ conversationId }` |
| `typing:stop` | `{ conversationId }` |

**Server → Client events**:

| Event | Payload | Khi nào |
|---|---|---|
| `message:new` | `{ conversationId, message: MessageDto }` | Tin mới (cả sender + recipient nhận, sender check để tránh duplicate) |
| `message:ack` | `{ localContent, message }` | Riêng cho sender — xác nhận message id thật |
| `message:edit` | `{ conversationId, message: { id, conversationId, content, editedAt } }` | Tin nhắn được sửa (recipient cập nhật content + show "đã chỉnh sửa") |
| `message:delete` | `{ conversationId, messageId }` | Tin nhắn bị xoá (recipient ẩn tin hoặc hiển thị "Tin nhắn đã bị xoá") |
| `read:update` | `{ conversationId, userId, lastReadAt }` | Member khác đã đọc |
| `typing` | `{ conversationId, userId, typing: boolean }` | Member khác đang gõ |
| `presence` | `{ userId, online: boolean }` | Member có conversation chung lên/xuống mạng |
| `error` | `{ message }` | Lỗi (token sai, không phải member, ...) |

### 17.5 Behavior tự động

- **Offline → FCM**: nếu recipient không có socket nào active, BE tự gửi FCM push với `pushType: "chat_message"` và `deepLink: "/conversations/:id"`.
- **Multi-device**: tất cả socket của 1 user đều nhận → đồng bộ web + mobile.
- **Retention 180 ngày**: cron 3AM xoá messages cũ. Conversation có `hasDispute=true` được giữ.
- **Presence narrow**: chỉ broadcast tới member của conversation chung (active members, `leftAt=null`), không leak cho user lạ và không gửi cho member đã rời.
- **Race protection**: tạo conversation cho cùng booking 2 lần đồng thời sẽ trả về conversation đã có (idempotent).
- **Cursor sai/expired**: server tự degrade về đầu danh sách thay vì throw 500.
- **Attachment validation**: URL phải `https://`, tối đa 5 file, 2048 chars URL, 100 chars `type`, 255 chars `name`. WS path cũng strip item không hợp lệ.
- **Member đã `leftAt`** không thể gửi tin, mark read, hay nhận presence/read broadcast.

### 17.6 FE Chat checklist

**Web (Next.js)**:
- [ ] Singleton socket sau login, disconnect khi logout
- [ ] Lắng `message:new` → upsert vào active chat hoặc bump `myUnread` ở inbox
- [ ] Lắng `read:update`, `typing`, `presence`
- [ ] Throttle `typing:start` (vd 1 emit / 3s)
- [ ] Optimistic UI: render local trước, update id từ `message:ack`
- [ ] Reconnect → re-fetch missed messages qua REST từ `nextCursor` cuối

**Android**:
- [ ] `io.socket:socket.io-client:2.x`
- [ ] Connection trong service singleton, refresh token khi cần
- [ ] FCM handler `chat_message` → mở conversation deeplink
- [ ] Khi mở chat: REST history → join WS events

---

## 18. App Version

| Method | Path | Auth | Query |
|---|---|---|---|
| `GET` | `/app/version?platform=android\|ios&currentVersion=` | Public | Force-update check |
| `POST` | `/admin/app-version` | ADMIN | `{ platform, latestVersion, minSupportedVersion, releaseNotes?, storeUrl }` |

Response GET:
```json
{
  "platform": "android",
  "latestVersion": "1.5.0",
  "minSupportedVersion": "1.3.0",
  "releaseNotes": "...",
  "storeUrl": "https://play.google.com/..."
}
```

Logic FE: `currentVersion < minSupportedVersion` → **force update** (chặn); `< latestVersion` → banner.

---

## 19. Enums reference

```ts
// Role
ROLE = { ADMIN: 0, OWNER: 1, SALE: 2, CUSTOMER: 3 }

// Property
PROPERTY_TYPE = { VILLA: 0, HOMESTAY: 1, HOTEL: 2 }
CANCELLATION_POLICY = { FLEXIBLE: 0, MODERATE: 1, STRICT: 2 }
MODERATION_STATUS = 'pending' | 'approved' | 'rejected' | 'suspended'

// Booking
BOOKING_STATUS = { HOLD: 0, CONFIRMED: 1, CANCELLED: 2, COMPLETED: 3 }

// Calendar
CALENDAR_DAY_STATUS = 'available' | 'hold' | 'booked' | 'locked'

// Notification
NOTIFICATION_TYPE = { BOOKING: 0, PAYMENT: 1, SYSTEM: 2 }

// KYC
KYC_STATUS = 'none' | 'pending' | 'approved' | 'rejected'

// Subscription
SUBSCRIPTION_STATUS = 'none' | 'trial' | 'active' | 'past_due' | 'cancelled' | 'frozen' | 'expired'
SUBSCRIPTION_PROVIDER = 'apple_iap' | 'vnpay' | 'manual_bank' | 'manual' | null
SUBSCRIPTION_CYCLE = 'monthly' | 'yearly'

// Payment
PAYMENT_METHOD = 'vnpay_qr' | 'bank_transfer' | 'card'
PAYMENT_STATUS = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded'

// Dispute
DISPUTE_TYPE = 'refund_request' | 'service_quality' | 'damage_claim' | 'no_show' | 'overbooking' | 'other'
DISPUTE_STATUS = 'pending' | 'investigating' | 'resolved' | 'rejected'

// Lead
LEAD_STATUS = 'new' | 'contacted' | 'rejected' | 'expired' | 'converted'
LEAD_SOURCE = 'public_form' | 'landing_page' | 'partner' | 'manual'

// Chat
CONVERSATION_TYPE = 'booking' | 'support' | 'staff'
CONVERSATION_MEMBER_ROLE = 'owner' | 'sale' | 'customer' | 'admin'
```

---

## 20. FE integration checklist

### 20.1 Web Admin (Next.js)

#### Setup
- [ ] HTTP client (Axios/Fetch) với interceptor `Authorization` + `Accept-Language`
- [ ] Refresh-token interceptor (401 → refresh → retry, 401 lần 2 → logout)
- [ ] Lưu token httpOnly cookie hoặc EncryptedStorage
- [ ] Global error toast theo HTTP status mapping

#### Module swap mock → real
- [ ] `/auth/*` ✅ (chắc đã live)
- [ ] `/users/*` + admin actions (ban/unban/revoke/reset/role)
- [ ] `/properties/*` + moderation (approve/reject/suspend)
- [ ] `/bookings/*` + `/bookings/:id/paid`
- [ ] `/calendar/grid`, `/lock`, `/unlock`, `/sold`, `/bulk`
- [ ] `/notifications/*`
- [ ] `/kyc/*` + `/admin/kyc/queue|approve|reject|count-pending`
- [ ] `/payments/*` + `/subscriptions/me`
- [ ] `/admin/users/:id/subscription/*` (trial/price/mark-paid/freeze/unfreeze)
- [ ] `/admin/subscriptions` + `count-overdue` + `sum-paid`
- [ ] `/staff/*` (invite list/create/cancel; staff list/remove)
- [ ] `/permissions/:userId`
- [ ] `/disputes` + `/admin/disputes/*`
- [ ] `/admin/audit-log`
- [ ] `/leads` (public POST + auth list/detail/update)
- [ ] `/admin/emails/templates` + `/test`
- [ ] `/admin/reviews` + restore + count-flagged
- [ ] `/conversations/*` + Socket.IO `/chat` namespace

#### Bỏ mock cũ
- [ ] Bỏ logic FE ghi audit log từ client — BE tự ghi
- [ ] Bỏ mô hình "admin nhập STK chuyển khoản" — STK lấy từ `POST /payments/initiate` (session.bankInfo)
- [ ] Subscription path: `/admin/users/:id/subscription/*` (KHÔNG phải `/admin/subscriptions/:id`)
- [ ] Staff invite body chỉ `{ email, ownerId? }` — không có `phone, permissions[], expiresAt`
- [ ] Booking schema: KHÔNG có `channel`, `roomTypeId`, `guestEmail` ở booking level

### 20.2 Mobile (Android/iOS)

#### Setup
- [ ] OkHttp/URLSession interceptor `Authorization` + `Accept-Language`
- [ ] Authenticator xử lý 401 → refresh
- [ ] EncryptedSharedPreferences/Keychain lưu token
- [ ] Đăng ký FCM token sau login (`POST /devices`) + mỗi `onNewToken`
- [ ] Huỷ FCM token khi logout (`DELETE /devices/:token`)
- [ ] Force-update check ở splash (`GET /app/version`)
- [ ] Countdown timer cho booking HOLD (`holdRemainingSeconds`)
- [ ] Multipart upload cho KYC (compress < 5MB)
- [ ] Chrome Custom Tab cho payment URL + deeplink return

#### Chat
- [ ] Socket.IO client connection sau login
- [ ] FCM handler `pushType=chat_message` → mở conversation
- [ ] Optimistic UI cho gửi tin

#### Push handler theo pushType
- [ ] `booking_*` → `/bookings/:id`
- [ ] `subscription_*` → `/dashboard/billing`
- [ ] `chat_message` → `/conversations/:id`
- [ ] `dispute_*` → `/host/bookings/:bookingId`
- [ ] `lead_new` → `/host/leads/:id`
- [ ] `kyc_*` → `/dashboard` hoặc `/verify/rejected`
- [ ] `staff_invite_accepted` → `/staff/manage`
- [ ] `property_approved`, `property_rejected`, `property_suspended` → `/host/properties/:id`

### 20.3 Common test cases trước khi ship

- [ ] Login flow đầy đủ (email/phone, Google, Apple, refresh, logout)
- [ ] Token expired (15 phút) → tự refresh, không user-visible logout
- [ ] CRUD property + upload 5+ ảnh + đặt cover
- [ ] Booking HOLD → CONFIRMED → PAID flow + countdown
- [ ] Customer book + huỷ + completed → tạo review
- [ ] Calendar grid cho 30 ngày × 10 property
- [ ] Bulk lock 50 ngày
- [ ] KYC flow OWNER full (upload 3 ảnh → submit → admin approve)
- [ ] Subscription: trial → admin set price → user pay VNPay → active
- [ ] Subscription: admin freeze → user thấy banner → admin unfreeze
- [ ] Dispute mở từ booking, admin investigate → resolve
- [ ] Chat 2 user → message + typing + read + presence + offline FCM
- [ ] Lead public POST → owner thấy + notify
- [ ] Audit log filter theo action + targetType + date range

---

## Liên hệ

- **Backend repo**: `c:\website\backend`
- **Swagger UI**: `https://api.halong24h.com/index.html` (mở khi server chạy)
- **Channel coordination**: cập nhật theo tổ chức team

---

---

## 21. Changelog & Bug fixes

### v1.3 — 2026-06-05 (FE Q&A response)

Confirm field shape + add endpoints theo yêu cầu FE. Chi tiết đối chiếu trong §22.

| Fix | Endpoint / Field | Mô tả |
|---|---|---|
| Booking flat fields | `GET /bookings*` | Thêm `propertyName` (string) + `nights` (number) computed |
| Users stats | `GET /users?withStats=true` | Bundle `stats: { propertyCount, bookingCount }` per user |
| Users shape extended | `GET /users` | Thêm `avatar`, `subscriptionStatus`, `subscriptionPlanId`, `subscriptionCycle`, `bannedAt`, `bannedReason`, `updatedAt` vào select |
| Review detail | `GET /admin/reviews/:reviewId` (NEW) | Hydrate property + customer + booking |
| Calendar multi-property | `GET /calendar/grid?propertyIds=...` (CSV/array) | Cùng range cho N property — không phải N request |
| Lead hydrate | `GET/PATCH /leads*` | Thêm `assignedToName`, `contactedByName` (batch lookup, no N+1) |

### v1.2 — 2026-06-05 (fix nốt)

Hoàn thiện các MEDIUM/LOW issue còn lại từ v1.1 và thêm tính năng đã defer.

#### Audit log enrichment

| Fix | Mô tả | Ảnh hưởng FE |
|---|---|---|
| IP + User-Agent tự động ghi | Mọi admin action audit log giờ tự include `ipAddress` + `userAgent` của request (qua `AsyncLocalStorage` global interceptor) | Hiển thị thêm cột IP/UA trong `GET /admin/audit-log` UI |

#### Chat

| Fix | Mô tả | Ảnh hưởng FE |
|---|---|---|
| `PATCH /conversations/messages/:messageId` | Sender sửa tin trong 15 phút sau gửi. System messages không sửa được. Broadcast `message:edit` qua WS | Hiển thị "đã chỉnh sửa" + cập nhật content live |
| `DELETE /conversations/messages/:messageId` | Sender hoặc admin xoá. Soft-delete. Broadcast `message:delete` | Hiển thị "Tin nhắn đã bị xoá" hoặc ẩn |
| i18n locale at handshake | Gateway resolve locale từ `query.lang` hoặc `Accept-Language` header → error message đúng ngôn ngữ | Truyền `query: { lang: 'vi'\|'en' }` khi connect socket |
| `JwtModule.registerAsync` | Secret từ ConfigService consistent với AuthModule | Không ảnh hưởng FE |

#### Properties

| Fix | Mô tả | Ảnh hưởng FE |
|---|---|---|
| OWNER PATCH property rejected/suspended → tự về `pending` | OWNER edit property bị reject/suspended, BE tự reset moderation về pending + notify admin | Hiển thị toast "Đã gửi lại để duyệt" khi OWNER save |

#### Leads

| Fix | Mô tả | Ảnh hưởng FE |
|---|---|---|
| Dedup theo phone + propertyId trong 1h | Submit form 2 lần (F5, retry) trả về lead cũ thay vì tạo trùng | Không thay đổi UX (idempotent từ phía FE) |

#### Users

| Fix | Mô tả | Ảnh hưởng FE |
|---|---|---|
| `unbanUser` block self-target | Admin không tự unban được mình (giống `banUser` đã có) | Disable nút unban khi `userId === self.id` |
| Reset password complexity check | Mật khẩu phải có ít nhất 1 chữ + 1 số (cộng MinLength 8) | Hiển thị error `passwordWeak` nếu validate fail |

### v1.1 — 2026-06-05

Tổng hợp các fix dựa trên rà soát code (3 reviewer độc lập).

#### Chat module

| Fix | Mô tả | Ảnh hưởng FE |
|---|---|---|
| Idempotent `POST /conversations` | Tạo conversation 2 lần đồng thời cho cùng booking → request thua tự re-fetch conv đã có | Không cần thay đổi |
| Cursor không hợp lệ | `GET /conversations/:id/messages?cursor=<invalid>` không còn throw 500 — server degrade về đầu danh sách | Có thể safely retry cursor cũ |
| `leftAt` filter | Member đã rời conversation không nhận `read:update`, `presence`, không gửi tin, không mark-read được | Đảm bảo data clean khi member rời |
| WS UUID validate | `message:send` reject payload có `conversationId` không phải UUID | Tránh ăn 500 |
| Attachment validate chặt | URL bắt buộc `https://`, item shape validated cả ở REST DTO lẫn WS strip | FE phải upload trước rồi gửi URL https |

#### Subscription

| Fix | Mô tả | Ảnh hưởng FE |
|---|---|---|
| `priceOverride = 0` hợp lệ | Trước: ignore 0, dùng giá plan. Sau: 0 = free, expectedTotal = 0 | FE có thể set 0 nếu admin muốn free |
| Mark-paid idempotency | 2 click trong 10s → 409 `markPaidDuplicate` (i18n) | Disable nút sau click, hoặc retry với mã 409 hiển thị toast |
| Grant trial bị cấm khi `frozen` | 409 `cannotGrantTrialFrozen` — phải unfreeze trước | Disable nút grant trial khi `subscriptionStatus=frozen` |
| Unfreeze restore TRIAL | Nếu user đang TRIAL khi bị freeze → unfreeze về TRIAL, không phải ACTIVE | Hiển thị `trialEndsAt` countdown sau unfreeze nếu còn |
| Audit `targetType` | Tất cả subscription action lưu `targetType=user` thay vì `subscription` | Filter audit log theo `targetType=user` |
| `/subscriptions/me` SALE chưa gán | Trả 400 `saleNotAssigned` thay vì subscription rỗng vô nghĩa | Hiển thị empty state "chưa gán team" |

#### Properties

| Fix | Mô tả | Ảnh hưởng FE |
|---|---|---|
| OWNER/SALE tự thấy property pending | `GET /properties` cho OWNER/SALE tự include pending/rejected/suspended (không cần `?includeInactive=true`) | Loại bỏ hardcode `?includeInactive=true` ở host UI |
| `moderationStatus='suspended'` | Khác `'rejected'` — semantic riêng cho property đã từng approved bị admin tạm ngưng | UI phân biệt 2 trạng thái: "Bị từ chối lần đầu" vs "Bị tạm ngưng" |

#### Bookings

| Fix | Mô tả | Ảnh hưởng FE |
|---|---|---|
| `POST /bookings/hold` thêm `@Roles(ADMIN/OWNER/SALE)` | CUSTOMER không gọi được endpoint này → bắt buộc dùng `/customer-hold` | CUSTOMER UI không hiển thị nút staff-hold |
| `PATCH /bookings/:id/paid` ghi audit log | `action=booking.mark_paid` tự log | Filter audit theo action này |

#### Users

| Fix | Mô tả | Ảnh hưởng FE |
|---|---|---|
| `PATCH /users/:id/kyc-bypass` ghi audit log | `action=user.kyc_bypass_toggle` | Hiển thị trong audit log filter |
| `DELETE /users/:id` ghi audit log | `action=user.delete` | Same |

#### Disputes

| Fix | Mô tả | Ảnh hưởng FE |
|---|---|---|
| `POST /admin/disputes/:id/resolve` notify cả opener | Trước: chỉ notify owner+customer. Sau: cộng thêm opener nếu là admin/sale | Push notification arrive nhiều hơn — chuẩn business logic |

### Issue đã biết — chưa fix (chấp nhận trade-off)

| Issue | Lý do giữ nguyên |
|---|---|
| Chat retention dùng hard delete (không `deletedAt`) | Intent: tiết kiệm DB; soft-delete cũng bị purge sau retention period. Đã document trong §17.5 |
| Chat presence event broadcast tới mọi peer của user | Có thể fan out lớn (vài chục peer × vài chục member). Acceptable cho v1 < 1000 user |
| Email template manager dùng sample text/HTML đơn giản | Khi wire production renderer cho template nào, chỉ cần thay sample trong `EMAIL_TEMPLATE_SAMPLES`. FE không cần đổi |
| Chat audit log không log từng message | Chi phí storage quá lớn (1M+ messages/năm). Chỉ log moderation actions |
| Conversation không có DB-level `@@unique([type, bookingId])` | Tránh migration phá data hiện có. App-level retry đủ an toàn cho v1 |
| Subscription audit `actorRole` hardcode `ROLE.ADMIN` | Endpoint guarded `@Roles(ROLE.ADMIN)` nên luôn đúng. Future-proof khi mở rộng role thì thay |
| Message edit sender multi-tab sync | Edit broadcast tới recipients, không phải tab khác của sender. Sender đã có response REST đồng bộ. Polish sau |

---

---

## 22. FE Q&A — Confirms & Design decisions

Trả lời cho danh sách câu hỏi từ team FE (received 2026-06-05). Các fix đã apply ở v1.3 (cuối session này).

### A. Field shape

#### A1. Booking — naming convention ✅ CONFIRMED + FIXED

- **Field names**: BE dùng đúng spec — `customerName`, `customerPhone`, `checkinDate`, `checkoutDate`, `totalAmount`, `depositAmount`, `paidAmount`, `paidAt`. Không phải `guestName`/`checkInAt`/snake_case.
- **Hydration**: `property` được include sẵn (`{ id, name, code, type, images[cover] }`) + `sale` (`{ id, name, phone }`). FE không cần N+1.
- **v1.3 thêm flat fields**: BE trả thêm 2 field phẳng cho FE tiện dùng:
  - `propertyName` (string) — denormalize từ `property.name`
  - `nights` (number) — computed từ `checkoutDate - checkinDate` (UTC date diff)

Response shape:
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "property": { "id": "uuid", "name": "...", "code": "...", "type": 0, "images": [...] },
  "propertyName": "Villa A",
  "nights": 2,
  "customerName": "...", "customerPhone": "...",
  "checkinDate": "...", "checkoutDate": "...",
  "status": 0, "holdRemainingSeconds": 1700,
  "totalAmount": 4000000, "paidAmount": null, "paidAt": null,
  "depositAmount": 500000, "guestCount": 4,
  "sale": { "id": "...", "name": "...", "phone": "..." }
}
```

#### A2. Users aggregation stats ✅ FIXED — Option 1

`GET /users?withStats=true` (v1.3) — bundle stats trong response:
```json
{
  "id": "...", "name": "...", "...": "...",
  "subscriptionStatus": "active", "subscriptionPlanId": "rooms_5",
  "bannedAt": null, "bannedReason": null,
  "stats": {
    "propertyCount": 3,
    "bookingCount": 25
  }
}
```

`bookingCount` = `saleBookings` + `customerBookings` (tổng booking user là sale hoặc khách).
`lastActiveAt` chưa có (chưa track session time). Có thể derive từ `updatedAt` tạm thời.

#### A3. Properties aggregation ✅ CONFIRMED

`GET /properties` đã include `_count: { bookings }` (`property._count.bookings` là số booking). FE map sang `bookingCount` từ field này.

Phân biệt 3 trạng thái dùng `moderationStatus` trực tiếp (không cần aggregate):
- `pending` — chờ duyệt lần đầu
- `approved + isActive=true` — hoạt động
- `rejected` — bị reject (chưa hoạt động bao giờ)
- `suspended` — đã từng approved nhưng admin tạm ngưng

#### A4. Subscription list response shape ✅ CONFIRMED

`GET /admin/subscriptions` trả **user-level** field, không phải Subscription row. Không có `startsAt`/`endsAt`. FE không cần fallback `endsAt ?? nextChargeAt ?? expireAt ?? updatedAt`.

Shape chính xác mỗi item:
```json
{
  "id": "uuid (=userId)",
  "name": "...",
  "email": "...",
  "phone": "...",
  "isActive": true,
  "subscriptionStatus": "active",
  "subscriptionPlanId": "rooms_5",
  "subscriptionCycle": "monthly",
  "subscriptionProvider": "vnpay",
  "subscriptionPriceOverride": 1200000,
  "subscriptionFrozenAt": null,
  "subscriptionFrozenReason": null,
  "trialEndsAt": null,
  "nextChargeAt": "2026-07-04T00:00:00.000Z"
}
```

**Plan ID format**: `rooms_1`, `rooms_5`, `rooms_10`, `rooms_20`, `rooms_50`, `enterprise`. **KHÔNG** có `_monthly`/`_yearly` suffix — `cycle` lưu riêng ở field `subscriptionCycle`.

#### A5. Subscription identification → Option A ✅ CONFIRMED

**1 user = 1 active subscription tại 1 thời điểm**. Subscription rows lưu lịch sử period (mark-paid tạo row mới cho period mới), nhưng User table có duy nhất 1 set field `subscriptionStatus/PlanId/Cycle/...` đại diện active.

→ FE đổi tham số endpoint từ `subscriptionId` sang `userId`. Tất cả admin action subscription đều `/admin/users/:id/subscription/*`.

`Subscription.id` (UUID của row) chỉ dùng nội bộ BE để theo dõi period — FE không cần.

#### A6. permissions[] cho non-SALE ✅ CONFIRMED

Prisma relation luôn trả mảng. Non-SALE user nhận `permissions: []` (mảng rỗng), không phải `undefined`.

FE check: `if (user.role === 2 && user.permissions.length > 0) {...}`.

### B. Endpoint còn thiếu (NEW v1.3)

#### B1. GET /admin/reviews/:reviewId ✅ ADDED

Trả full ReviewDto + hydrate:
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "bookingId": "uuid",
  "customerId": "uuid",
  "cleanliness": 5, "...": "...",
  "avgRating": 4.67,
  "comment": "...", "photos": [...],
  "ownerReply": "...", "ownerReplyAt": "...",
  "isHidden": false, "hiddenReason": null,
  "property": { "id": "...", "name": "...", "code": "...", "type": 0, "ownerId": "..." },
  "customer": { "id": "...", "name": "...", "email": "...", "phone": "...", "avatar": "..." },
  "booking": { "id": "...", "checkinDate": "...", "checkoutDate": "...", "status": 3, "totalAmount": ..., "paidAmount": ... }
}
```

#### B2. Calendar multi-property ✅ ADDED

`GET /calendar/grid?propertyIds=uuid1,uuid2,uuid3` (CSV) hoặc array form `?propertyIds=a&propertyIds=b`.

- `propertyIds` ưu tiên hơn `propertyId` nếu cả 2 truyền.
- Multi-property + range giữ giới hạn 90 ngày × N property (verify `assertRangeWithinLimit`).
- Áp dụng cho cả `/calendar/grid` và `/calendar/public-grid`.

#### B3. Dispute extended fields ❌ DEFER v2

Spec hiện chỉ có: `type, subject, description, amount, status, resolution, refundAmount, attachments?, resolvedById, resolvedAt`.

**KHÔNG có** trong v1.3: `evidence[]`, `chatExcerpt[]`, `verdict`, `penaltyType`. FE strip khỏi UI ở v1.

Khi cần v2:
- `evidence[]` = `attachments[]` đã có sẵn (URL upload). FE chỉ cần rename.
- `chatExcerpt[]` — cần ID range của messages trong conversation. Có thể link qua `bookingId` → conversation → messages.
- `verdict` — hiện dùng `status` (resolved/rejected) đủ. Nếu cần granular thêm `verdictDetail` enum sau.
- `penaltyType` — auto-apply qua action chain (admin `ban_temp` user thì gọi `POST /users/:id/ban` riêng).

#### B4. Lead hydrate assignedTo ✅ FIXED v1.3

GET/PATCH lead trả thêm:
- `assignedToName: string | null`
- `contactedByName: string | null`

(Batch lookup 1 query, không N+1.)

#### B5. KYC submission lifecycle ✅ CONFIRMED — 4 state

Web admin chỉ cần 4 state: `none | pending | approved | rejected`.

8-state lifecycle mobile spec cũ (`draft | kyc_submitted | payment_pending | paid | awaiting_approval | approved | rejected | refunded`) là **internal BE state** cho mobile flow. Web UI map xuống:
- `draft`, `kyc_submitted`, `payment_pending`, `paid`, `awaiting_approval` → web hiển thị **pending**
- `approved` → **approved**
- `rejected` → **rejected**
- `refunded` → **none** (đã thoái KYC)

Field BE trả về web: `kycStatus: 'none' | 'pending' | 'approved' | 'rejected'` (4 state) — đã map sẵn ở `/auth/profile` và `/kyc/status`.

### C. Design decisions

#### C1. Idempotency keys

| Endpoint | Idempotent? | Cơ chế |
|---|---|---|
| `POST /conversations` (booking type) | ✅ Có | `findFirst` theo `bookingId`. Race → retry trả conv đã có |
| `POST /leads` | ✅ Có | Dedup theo `phone + propertyId` trong 1 giờ (v1.2) |
| `POST /payments/initiate` | ⚠️ Partial | BE expire pending sessions cũ trên cùng submission khi tạo session mới (line 246-249 payment.service.ts). FE click 2 lần → session đầu bị expire, session 2 mới active. Không hoàn hảo nhưng không double-charge thật |
| `POST /admin/users/:id/subscription/mark-paid` | ✅ Có | 10-second window check (v1.1) → 409 `markPaidDuplicate` |
| `POST /bookings/hold`, `/customer-hold` | ❌ Không | Mỗi call tạo booking mới. FE phải disable nút sau click |

FE có thể truyền optional header `X-Idempotency-Key` (UUID) — chưa support, nhưng có thể bổ sung v2 khi cần.

#### C2. Rate limit headers

ThrottlerModule mặc định **không trả** `X-RateLimit-Remaining` / `Retry-After`. FE nhận 429 với response body có message → toast generic.

Để có header, cần custom ThrottlerGuard — defer v2 nếu FE cần hiển thị countdown.

#### C3. Pagination format

**Chuẩn cuối cùng** (v1.3 đã đồng bộ):

**Listing endpoints đều trả 1 trong 2 shape**:

**Shape A** — `{ items, total, page, limit, totalPages }`:
- `/admin/subscriptions`, `/admin/disputes`, `/admin/audit-log`, `/admin/reviews`, `/conversations`, `/notifications`, `/bookings/my-bookings`, `/leads`

**Shape B** — array trực tiếp + `meta`:
- `/bookings` → `data: BookingDto[], meta: { total, page, limit }`

**Endpoint trả array plain (không paginate)**:
- `/users`, `/users/my-staff`, `/users/available-staff`, `/staff`, `/staff/invites`, `/properties`, `/properties/public`, `/billing/plans`, `/notifications/unread-count` (object), `/calendar/properties`, `/devices`, `/admin/emails/templates`

FE đang fallback `Array.isArray(data) ? data : data.items` — pattern đúng, giữ. Standardize sang 1 format chung sẽ là **breaking change** lớn, defer v2.

#### C4. WebSocket cursor

**Cursor là message UUID** (không phải timestamp). Lấy từ `nextCursor` của response REST trước.

```ts
// FE flow khi reconnect:
let lastCursor: string | null = null;
async function fetchMessages() {
  const res = await fetch(`/conversations/${id}/messages?cursor=${lastCursor ?? ''}&limit=50`);
  const { items, nextCursor } = res.data;
  if (items.length) lastCursor = nextCursor; // lưu cho lần fetch tiếp
  return items;
}
```

**Edge case v1.1 fix**: Cursor không hợp lệ (message bị purge/delete) → BE graceful degrade về đầu, không 500. FE có thể safely retry cursor cũ.

Khi reconnect WS:
1. Lưu `lastReceivedMessageId` cuối cùng trước disconnect
2. `connect` event fire sau reconnect → gọi REST với `cursor=lastReceivedMessageId` để fetch missed messages
3. Merge vào local state (skip duplicates qua message ID)

WS không tự replay missed messages — phải qua REST.

---

> **Phiên bản tài liệu**: v1.3 — 2026-06-05 (FE Q&A response). Mọi thay đổi schema/endpoint vui lòng cập nhật file này và thông báo team FE qua channel chung.
