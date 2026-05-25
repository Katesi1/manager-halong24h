# CLAUDE.md — Webhalong24h Manager

> Tài liệu này điều phối Claude Code (và mọi AI agent) khi làm việc trên dự án.
> **Mọi đổi schema/cấu trúc folder/quy tắc ⇒ cập nhật file này luôn.** AI phải đọc lại file này ở đầu mỗi session.

---

## 1. Stack & Run

| | |
|---|---|
| Framework | **Next.js 15** (App Router, RSC, Server Actions) |
| UI runtime | **React 19** (`useActionState`, `useOptimistic`, `useFormStatus`) |
| Ngôn ngữ | TypeScript 5.7, strict mode |
| Style | Tailwind v4 (`@tailwindcss/postcss`), Radix UI, lucide-react, framer-motion |
| Validation | **Zod 3** (mọi boundary) |
| Form | react-hook-form + Zod resolver (khi cần phức tạp), Server Action + `useActionState` (khi đơn giản) |
| Data source chính | **REST API ngoài** — base URL: `http://103.183.118.148:3000` (BE chạy không có prefix `/api/v1` mặc dù spec ghi vậy) |
| Data source phụ | Mock (cho module BE chưa có endpoint) |
| Dev port | **3001** (`npm run dev`) |

```bash
npm run dev        # dev server
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run build      # next build
```

---

## 2. Kiến trúc — Clean Architecture

```
src/
├── core/                  # 🟢 Domain Layer (pure, không phụ thuộc gì)
│   ├── entities/          # User, Property, Booking, Permission, ...
│   ├── value-objects/     # VND, Email, Phone, RoleCode, PropertyType
│   └── errors.ts          # DomainError + subclasses
│
├── application/           # 🟡 Application Layer (use cases + ports)
│   ├── ports/             # Interface repository (auth/property/dashboard/...)
│   ├── auth/              # login, refresh, getProfile, logout (use case)
│   ├── properties/        # list, getById, create, update, delete, prices, images
│   ├── dashboard/         # getStats, getReports
│   └── result.ts          # Result<T, E> discriminated union
│
├── infrastructure/        # 🔴 Infrastructure Layer (chi tiết kỹ thuật)
│   ├── http/              # api-client, token-storage, api-config, error mapping
│   ├── repositories/      # ApiXxxRepository — concrete impl của ports
│   ├── mocks/             # MockXxxRepository — dữ liệu mock cho module chưa có API
│   └── container.ts       # DI: trả về repo phù hợp (api/mock) theo env
│
├── app/                   # 🔵 Presentation (Next.js App Router)
│   ├── (admin)/, (host)/, (auth)/   # Route groups
│   ├── actions/           # Server Actions — entry point của UI vào Application
│   └── auth/              # OAuth callback, signout
│
├── components/            # 🔵 Presentation (React)
│   ├── ui/                # Primitive (Button, Input, Dialog, ...)
│   ├── layout/, common/
│   ├── admin/, host/      # Feature components
│   └── auth/, chat/
│
└── lib/                   # 🛠 Generic utilities (KHÔNG đụng business logic)
    └── format.ts, calendar.ts, pricing.ts, vietqr.ts, utils.ts, result.ts
```

### Quy tắc phụ thuộc (Dependency Rule)

```
core ◄── application ◄── infrastructure
                    ◄── app/components (presentation)
```

- `core` **KHÔNG** import từ bất kỳ layer nào khác.
- `application` chỉ import `core`. Phụ thuộc Infrastructure qua **interface (port)**.
- `infrastructure` import `core` + `application/ports`, implement port.
- `app` (route/page) gọi **Server Action**, Server Action gọi **use case**, use case gọi **port** (Container resolve về Api/Mock impl).

**KHÔNG được** import trực tiếp:
- `infrastructure/*` từ Server Component / Client Component (luôn đi qua Server Action).
- `core/entities/*` từ Client Component nếu entity có method có thể bundle code lớn — nhưng type thì ok.

---

## 3. API Integration (Module 1–3)

**Base URL**: `http://103.183.118.148:3000` (env: `NEXT_PUBLIC_API_BASE_URL`)
**Swagger**: `http://103.183.118.148:3000/api` *(spec ghi `/api/v1` nhưng BE thực tế không có prefix — đã verify bằng curl)*
**Spec đầy đủ**: [`api-spec-website-admin.md`](./api-spec-website-admin.md)

### Module đã có API (TÍCH HỢP THẬT)

| Module | Path prefix | Use cases |
|---|---|---|
| **Auth** | `/auth/*` | login, register, googleLogin, refresh, forgotPassword, resetPassword, getProfile, logout, changePassword |
| **Properties** | `/properties/*` | list, getById, create, update, delete, updatePrices, uploadImages, deleteImage, setCover |
| **Dashboard** | `/dashboard/stats`, `/reports` | getStats, getReports |
| **Bookings** | `/bookings` (GET) | list, getById |
| **Notifications** | `/notifications`, `/notifications/unread-count`, `/notifications/:id/read`, `/notifications/read-all` | list, unreadCount, markRead, markAllRead |

### Module CHƯA có API → dùng MOCK

`bookings`, `calendar`, `notifications`, `reviews`, `kyc`, `billing`, `payment`, `permissions (admin)`, `users (admin)`, `disputes`, `messages`, `housekeeping`, `staff`, `leads`, `guests`, `reports (host)`.

→ Tạo `MockXxxRepository` trong `src/infrastructure/mocks/` và đăng ký trong `container.ts`.
→ Khi BE ra endpoint thật, **chỉ cần** thêm `ApiXxxRepository` và đổi 1 dòng trong container — UI không phải sửa.

### Authentication flow

- `accessToken` 15 phút, `refreshToken` 7 ngày — lưu **httpOnly cookie** server-side (qua `next/headers` `cookies()`).
- HTTP client tự thêm `Authorization: Bearer <accessToken>`.
- 401 → use case `refreshTokens()` → retry.
- 403/refresh fail → throw `UnauthorizedError` → Server Action redirect `/login`.

### Response format (theo spec)

```ts
// Success
{ success: true; message: string; data: T }
// Error
{ success: false; statusCode: number; message: string; errors: unknown; path: string; timestamp: string }
```

→ HTTP client unwrap thành `Result<T, ApiError>` cho use case.

---

## 4. Quy ước code

> Chuẩn đầy đủ ở [`docs/CODING-STANDARDS.md`](./docs/CODING-STANDARDS.md) (SOAP, RISE, design patterns).

### Tóm tắt quan trọng

- **Result type** — Server Action không throw, trả `Result<T>`:
  ```ts
  type Result<T, E = string> =
    | { ok: true; data: T }
    | { ok: false; error: E; fieldErrors?: Record<string, string[]> }
  ```
- **VND brand type** — tiền tệ là `VND` không phải `number`.
- **RBAC ở `layout.tsx`** — không dùng middleware làm RBAC chính.
- **Validation Zod** ở mọi Server Action input.
- **File ≤ 400 dòng**, function ≤ 50 dòng, nesting ≤ 4 cấp.
- **No `any`, no `console.log`, no `as any` không có lý do.**

### Naming

- File: kebab-case (`api-auth-repository.ts`)
- Component: PascalCase (`BookingTable.tsx`)
- Hook: camelCase với prefix `use` (`useDebounce.ts`)
- Type/Interface: PascalCase (`type LoginInput`, `interface Property`)
- Boolean: prefix `is/has/can/should`

---

## 5. Roles & Permissions (theo spec)

| Code | Role | Truy cập |
|---|---|---|
| 0 | `ADMIN` | Toàn bộ `(admin)/*` |
| 1 | `OWNER` | `(host)/*`, scope `ownerId === user.id` |
| 2 | `SALE` | `(host)/*`, scope `ownerId === user.ownerId` |
| 3 | `CUSTOMER` | **CHẶN** — không vào trang quản lý |

### Quy tắc UI

- ADMIN bypass mọi check.
- OWNER/SALE: button CRUD chỉ hiện khi `permissions[module].canX === true`.
- KYC: `kycStatus !== 'approved' && !kycBypass` ⇒ banner cho OWNER + chặn create/update/delete property.
- SALE chưa được gán (`ownerId === null`) ⇒ empty state.

---

## 6. Workflow khi thêm feature

Áp dụng **SOAP** trong commit/PR và **RISE** khi giao việc cho AI (xem [`docs/CODING-STANDARDS.md`](./docs/CODING-STANDARDS.md)).

Trình tự cho 1 use case mới:

```
1. core/entities/<X>.ts        — model thuần
2. application/ports/<x>-repository.ts  — interface
3. application/<module>/<action>.ts     — use case (input/output type, gọi repo qua port)
4. infrastructure/repositories/api-<x>-repository.ts  — gọi REST API
5. infrastructure/mocks/mock-<x>-repository.ts        — mock nếu chưa có API
6. infrastructure/container.ts — đăng ký
7. app/actions/<module>.ts     — Server Action gọi use case, parse Zod
8. app/(admin|host)/.../page.tsx — Server Component fetch, render
9. components/<module>/...     — UI client
```

---

## 7. Mock Mode

Mỗi module có thể chạy **api** hoặc **mock**, điều khiển bằng env:

```bash
# .env.local
NEXT_PUBLIC_DATA_MODE_BOOKINGS=mock      # api | mock
NEXT_PUBLIC_DATA_MODE_PAYMENTS=mock
# Mặc định mọi module chưa có API = mock
# Auth/Properties/Dashboard mặc định = api (vì spec đã có)
```

Container nhìn env và return repo tương ứng:

```ts
export function bookingsRepo(): BookingRepository {
  return process.env.NEXT_PUBLIC_DATA_MODE_BOOKINGS === 'api'
    ? new ApiBookingRepository(httpClient)
    : new MockBookingRepository()
}
```

---

## 8. Self-Update Rule (BẮT BUỘC)

AI agent phải **tự động cập nhật CLAUDE.md** khi:

1. Tạo entity mới ⇒ cập nhật danh sách trong mục **§2** và **§6**.
2. Tích hợp endpoint mới (BE ra endpoint mới cho module đang mock) ⇒ chuyển từ §3 "MOCK" sang "TÍCH HỢP THẬT", note thay đổi env.
3. Đổi cấu trúc folder ⇒ cập nhật cây thư mục §2.
4. Thêm pattern/quy ước mới ⇒ ghi vào `docs/CODING-STANDARDS.md`, link từ §4.
5. Đổi data flow (auth, RLS, RBAC) ⇒ cập nhật §3 hoặc §5.

**Format cập nhật**: thêm dòng vào **§11 Changelog** với ngày + 1 dòng mô tả.

---

## 9. Data Source

Project dùng **REST API** qua Clean Architecture:
- Auth/Properties/Dashboard/Bookings/Notifications → `ApiXxxRepository` (REST API)
- Module chưa có endpoint → `MockXxxRepository`

Supabase đã được loại bỏ hoàn toàn (code, config, migrations, packages). Không còn bất kỳ reference nào trong source code.

---

## 10. Roadmap thoát Mock

| Module | Trạng thái | Ưu tiên |
|---|---|---|
| Auth | ✅ API | — |
| Properties | ✅ API | — |
| Dashboard | ✅ API | — |
| Bookings | ✅ API `GET /bookings` (read-only — chưa có CRUD) | High |
| Notifications | ✅ API `GET /notifications` + `unread-count` + `markRead` | Low |
| Calendar | 🟡 Mock (`MockCalendarRepository`) | High |
| Payments / Billing | 🟡 Mock (`MockPaymentRepository`) | High |
| Disputes | 🟡 Mock (`MockDisputeRepository`) | Medium |
| KYC | 🟡 Mock (chưa có repo) | Medium |
| Messages | 🟡 Mock (chưa có repo) | Medium |
| Reviews | 🟡 Mock (chưa có repo) | Low |
| Permissions/Users (admin) | 🟡 Mock (chưa có repo) | Low |

Khi BE bổ sung endpoint, cập nhật bảng này + §3.

---

## 11. Changelog

| Ngày | Người | Thay đổi |
|---|---|---|
| 2026-05-08 | init | Khởi tạo CLAUDE.md, áp dụng Clean Architecture, tích hợp API Auth/Properties/Dashboard, mock cho phần còn lại |
| 2026-05-08 | wire-up | Wire layouts `(admin)`/`(host)` dùng `getCurrentProfile()` + role guard. Wire `/host` dashboard và `/host/properties` qua Server Actions mới. Thêm mocks cho Payments/Disputes/Calendar (entities + ports + repos + use cases + actions). Loại bỏ Supabase foundation: `lib/supabase/*` thành stubs deprecated, `middleware.ts` no-op, `auth/callback` & `auth/signout` chuyển sang Clean Arch. `isSupabaseConfigured()` luôn `false` ⇒ 41 file legacy có guard `if (!isSupabaseConfigured()) return DEMO` tự động chạy demo mode. |
| 2026-05-08 | api-fix | Fix base URL: BE thực tế chạy không có prefix `/api/v1`. Đổi `NEXT_PUBLIC_API_BASE_URL=http://103.183.118.148:3000` (verify: `POST /auth/login` → 401, `POST /api/v1/auth/login` → 404). |
| 2026-05-08 | supabase-removal | **Loại bỏ Supabase hoàn toàn.** Refactor 12 action files (`actions/property.ts`/`booking.ts`/`dispute.ts`/`tenant.ts`/`room.ts`/`lead.ts`/`pricing.ts`/`chat.ts`/`storage.ts`/`notification.ts`/`admin.ts`/`room-block.ts`) chỉ giữ Zod validation + return mock-success. 29 page files & components: strip Supabase imports + dead code blocks bằng Node script (brace matcher). Convert `image-uploader.tsx` sang gọi `uploadPropertyImagesAction` thay Supabase Storage. Xoá `src/lib/supabase/`, uninstall `@supabase/ssr` + `@supabase/supabase-js`. Giữ `src/lib/database.types.ts` làm legacy domain types (string-literal unions, không phụ thuộc DB). Typecheck: 0 lỗi mới — chỉ 5 lỗi pre-existing (component thiếu sẵn từ trước). |
| 2026-05-08 | missing-components | Tạo 4 component thiếu pre-existing: `components/listing/property-card.tsx` (export `PropertyCardData`), `components/property/amenity-list.tsx`, `components/account/profile-form.tsx`, `components/account/password-form.tsx`. Thêm `changePasswordAction` Server Action wrapping `POST /auth/change-password`. Typecheck **0 errors**. |
| 2026-05-08 | api-error-ux | HTTP client log lỗi với context `[api-client] METHOD /path → STATUS message`. Thêm `humanize()` translate BE messages thành tiếng Việt (Validation failed, Invalid token, Phone already registered, etc.). |
| 2026-05-08 | image-hosts | Thêm `res.cloudinary.com`, `*.googleusercontent.com`, `img.vietqr.io` vào `next.config.ts` `remotePatterns` (BE host ảnh property qua Cloudinary). |
| 2026-05-08 | api-expansion | BE thêm endpoint thật: `GET /bookings` + `/notifications` + `/notifications/unread-count`. Wire `ApiBookingRepository`, tạo `ApiNotificationRepository` + entity + port + use case + Server Action. Switch default mode booking từ `mock` sang `api` trong container. Refactor 5 page chính sang Clean Arch: `/host/bookings` (list), `/host/properties/[id]` (detail dùng `getPropertyAction` + adapter sang legacy form shape), `/admin` (dashboard dùng API stats + bookings), `/admin/properties` (list dùng `listPropertiesAction`), `/admin/bookings` (list dùng `listBookingsAction`). Pages còn lại (calendar, leads, messages, hk, guests, staff, settings, reports) vẫn render demo qua mock — sẽ migrate khi BE bổ sung endpoint. |
| 2026-05-16 | audit-self-write | Audit log không còn demo tĩnh. Tạo `core/entities/audit-log.ts` + `application/ports/audit-log-repository.ts` + `application/audit-log/actions.ts` + `infrastructure/mocks/mock-audit-log-repository.ts` (singleton in-memory store, seeded với 5 entry). Helper `lib/audit-recorder.ts` ghi best-effort từ Server Action (không throw nếu fail). Wire vào 12 admin action: `approveKycAdminAction`, `rejectKycAdminAction`, `banAdminUserAction`, `unbanAdminUserAction`, `revokeUserSessionAction`, `updateUserSubscriptionAction`, `resetUserPasswordAction`, `approvePropertyAction`, `rejectPropertyAction`, `suspendPropertyAction`, `startDisputeInvestigationAction`, `resolveDisputeAction`, `rejectDisputeAction`. Page `/admin/audit-log` dùng real repo + filter theo loại hành động / đối tượng / search query. |
| 2026-05-17 | reviews-emails-subscription | (1) Reviews moderation: `core/entities/review.ts` + port + use case + mock (5 seed: 1 spam có flag SĐT cạnh tranh, 1 profanity đã ẩn, 3 normal) + page `/admin/reviews` + filter status/rating/flagged/search + `ReviewModerationActions` (hide với reason ≥5, restore) + sidebar entry. (2) Test send email: Server Action `sendTestEmailAction` (mock mode log console, live mode chờ BE `POST /admin/emails/test`) + `TestEmailButton` thay nút disabled, pre-fill admin email. (3) Subscription tracking: `core/entities/subscription.ts` (4 plan, 4 status: paid/pending/overdue/frozen, expireAt + auto-mark overdue) + port + use case + mock (5 seed bao gồm 1 frozen + 1 overdue) + actions (`listSubscriptionsAction`, `getMySubscriptionAction`, `markSubscriptionPaidAction`, `freezeSubscriptionAction`, `unfreezeSubscriptionAction`) + helper `lib/subscription-guard.ts` `blockedReason()` + refactor `/admin/payments` dùng real repo + `SubscriptionRowActions` (mark paid / freeze / unfreeze) + `/host/settings/subscription` cho owner xem & STK chuyển khoản + banner ở host layout + guard chặn tạo property/booking khi overdue/frozen. |
| 2026-05-17 | dev-role-switch | `actions/auth.ts` mở rộng dev bypass: 7 profile (admin/owner/owner-nokyc/owner-overdue/sale/sale-noown/customer), switch bằng cookie `dev_role` (không cần restart server). Cho phép giả lập đầy đủ 4 vai trong test. |
| 2026-05-25 | supabase-final-cleanup | Loại bỏ hoàn toàn mọi reference Supabase còn sót: xoá thư mục `supabase/` (migrations + README), xoá env vars Supabase trong `.env.local.example`, xoá `*.supabase.co` khỏi `next.config.ts` (images + CSP), dọn `.gitignore`/`.prettierignore`/`eslint.config.mjs`. Rename `database.types.ts` → `legacy-types.ts` + cập nhật 11 file import. Cập nhật `README.md` và `docs/CODING-STANDARDS.md` thay mọi reference Supabase bằng Clean Architecture / REST API. Xoá prop `isSupabaseReady` khỏi `image-uploader.tsx`. Typecheck 0 errors, grep supabase trong src/ = 0 results. |

---

## 12. Liên kết nội bộ

- [`docs/CODING-STANDARDS.md`](./docs/CODING-STANDARDS.md) — SOAP/RISE + design patterns chi tiết
- [`api-spec-website-admin.md`](./api-spec-website-admin.md) — Spec API đầy đủ
- [`README.md`](./README.md) — Hướng dẫn chạy project
