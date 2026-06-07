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
| Data source chính | **REST API ngoài** — base URL: `http://api.halong24h.com` (BE chạy không có prefix `/api/v1` mặc dù spec ghi vậy) |
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

**Base URL**: `http://api.halong24h.com` (env: `NEXT_PUBLIC_API_BASE_URL`)
**Swagger**: `http://api.halong24h.com/api` *(spec ghi `/api/v1` nhưng BE thực tế không có prefix — đã verify bằng curl)*
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
| 2026-05-08 | api-fix | Fix base URL: BE thực tế chạy không có prefix `/api/v1`. Đổi `NEXT_PUBLIC_API_BASE_URL=http://api.halong24h.com` (verify: `POST /auth/login` → 401, `POST /api/v1/auth/login` → 404). |
| 2026-05-08 | supabase-removal | **Loại bỏ Supabase hoàn toàn.** Refactor 12 action files (`actions/property.ts`/`booking.ts`/`dispute.ts`/`tenant.ts`/`room.ts`/`lead.ts`/`pricing.ts`/`chat.ts`/`storage.ts`/`notification.ts`/`admin.ts`/`room-block.ts`) chỉ giữ Zod validation + return mock-success. 29 page files & components: strip Supabase imports + dead code blocks bằng Node script (brace matcher). Convert `image-uploader.tsx` sang gọi `uploadPropertyImagesAction` thay Supabase Storage. Xoá `src/lib/supabase/`, uninstall `@supabase/ssr` + `@supabase/supabase-js`. Giữ `src/lib/database.types.ts` làm legacy domain types (string-literal unions, không phụ thuộc DB). Typecheck: 0 lỗi mới — chỉ 5 lỗi pre-existing (component thiếu sẵn từ trước). |
| 2026-05-08 | missing-components | Tạo 4 component thiếu pre-existing: `components/listing/property-card.tsx` (export `PropertyCardData`), `components/property/amenity-list.tsx`, `components/account/profile-form.tsx`, `components/account/password-form.tsx`. Thêm `changePasswordAction` Server Action wrapping `POST /auth/change-password`. Typecheck **0 errors**. |
| 2026-05-08 | api-error-ux | HTTP client log lỗi với context `[api-client] METHOD /path → STATUS message`. Thêm `humanize()` translate BE messages thành tiếng Việt (Validation failed, Invalid token, Phone already registered, etc.). |
| 2026-05-08 | image-hosts | Thêm `res.cloudinary.com`, `*.googleusercontent.com`, `img.vietqr.io` vào `next.config.ts` `remotePatterns` (BE host ảnh property qua Cloudinary). |
| 2026-05-08 | api-expansion | BE thêm endpoint thật: `GET /bookings` + `/notifications` + `/notifications/unread-count`. Wire `ApiBookingRepository`, tạo `ApiNotificationRepository` + entity + port + use case + Server Action. Switch default mode booking từ `mock` sang `api` trong container. Refactor 5 page chính sang Clean Arch: `/host/bookings` (list), `/host/properties/[id]` (detail dùng `getPropertyAction` + adapter sang legacy form shape), `/admin` (dashboard dùng API stats + bookings), `/admin/properties` (list dùng `listPropertiesAction`), `/admin/bookings` (list dùng `listBookingsAction`). Pages còn lại (calendar, leads, messages, hk, guests, staff, settings, reports) vẫn render demo qua mock — sẽ migrate khi BE bổ sung endpoint. |
| 2026-05-16 | audit-self-write | Audit log không còn demo tĩnh. Tạo `core/entities/audit-log.ts` + `application/ports/audit-log-repository.ts` + `application/audit-log/actions.ts` + `infrastructure/mocks/mock-audit-log-repository.ts` (singleton in-memory store, seeded với 5 entry). Helper `lib/audit-recorder.ts` ghi best-effort từ Server Action (không throw nếu fail). Wire vào 12 admin action: `approveKycAdminAction`, `rejectKycAdminAction`, `banAdminUserAction`, `unbanAdminUserAction`, `revokeUserSessionAction`, `updateUserSubscriptionAction`, `resetUserPasswordAction`, `approvePropertyAction`, `rejectPropertyAction`, `suspendPropertyAction`, `startDisputeInvestigationAction`, `resolveDisputeAction`, `rejectDisputeAction`. Page `/admin/audit-log` dùng real repo + filter theo loại hành động / đối tượng / search query. |
| 2026-05-17 | reviews-emails-subscription | (1) Reviews moderation: `core/entities/review.ts` + port + use case + mock (5 seed: 1 spam có flag SĐT cạnh tranh, 1 profanity đã ẩn, 3 normal) + page `/admin/reviews` + filter status/rating/flagged/search + `ReviewModerationActions` (hide với reason ≥5, restore) + sidebar entry. (2) Test send email: Server Action `sendTestEmailAction` (mock mode log console, live mode chờ BE `POST /admin/emails/test`) + `TestEmailButton` thay nút disabled, pre-fill admin email. (3) Subscription tracking: `core/entities/subscription.ts` (4 plan, 4 status: paid/pending/overdue/frozen, expireAt + auto-mark overdue) + port + use case + mock (5 seed bao gồm 1 frozen + 1 overdue) + actions (`listSubscriptionsAction`, `getMySubscriptionAction`, `markSubscriptionPaidAction`, `freezeSubscriptionAction`, `unfreezeSubscriptionAction`) + helper `lib/subscription-guard.ts` `blockedReason()` + refactor `/admin/payments` dùng real repo + `SubscriptionRowActions` (mark paid / freeze / unfreeze) + `/host/settings/subscription` cho owner xem & STK chuyển khoản + banner ở host layout + guard chặn tạo property/booking khi overdue/frozen. |
| 2026-05-17 | dev-role-switch | `actions/auth.ts` mở rộng dev bypass: 7 profile (admin/owner/owner-nokyc/owner-overdue/sale/sale-noown/customer), switch bằng cookie `dev_role` (không cần restart server). Cho phép giả lập đầy đủ 4 vai trong test. |
| 2026-06-05 | spec-v1.3-phase-13 | **Phase 13 — Chat UX enhancements (typing/presence/edit/delete)**. (1) **Typing indicator** ([chat-thread.tsx](src/components/chat/chat-thread.tsx)): `handleTextChange` throttle emit `typing:start` mỗi 3000ms theo spec §17.6 FE checklist + auto `typing:stop` sau 4000ms không gõ. Hub state `typingUsers: Set<string>` update từ `onTyping` (skip self). Cleanup timer + emit stop khi unmount. UI hiển thị "Đang nhập tin nhắn..." italic ở indicator bar. (2) **Presence**: state `onlineUsers: Set<string>` từ `onPresence` event. ChatThread thêm prop `peerUserId?: string`, page truyền `customerOf(conv)?.userId`. Render badge "● Đang online" emerald khi peer online. (3) **Edit/Delete UI** ([message-bubble.tsx](src/components/chat/message-bubble.tsx) — component mới 191 dòng): extract khỏi ChatThread cho clean separation. Edit window 15 phút theo spec §17.1. Logic: hover hiện 2 nút "Sửa"/"Xoá" trên góc bubble (chỉ với own messages, không deleted, không optimistic, trong 15-min window cho Edit). Edit mode inline textarea với Ctrl+Enter submit, Esc cancel. Delete với `confirm()` native. Optimistic UI: callback `onEdited`/`onDeleted` cập nhật ChatThread state. WS broadcast trùng setState với content giống → no-op render. (4) **Bug fix tự rà 4 điểm**: (a) typing emit khi disconnected — `handleTextChange` early return `!socket\|\|!connected`; (b) onTyping/onPresence skip self event; (c) edit-window expire mid-render — chấp nhận stale UI minor, BE sẽ reject "out of window"; (d) edit/delete race với WS broadcast — setState identical content = no-op acceptable. (5) **Refactor**: bỏ inline message render trong ChatThread, thay bằng `<MessageBubble>`. Loại `formatDateTime` import unused. File chính 263→331 lines (vẫn <400). Typecheck **0 errors**, lint **0 warnings**. **Known limitation**: `confirm()` browser native — TODO Phase 14 thay bằng modal component. |
| 2026-06-05 | spec-v1.3-phase-12 | **Phase 12 — Chat detail page với full WebSocket integration**. (1) **`<ChatThread>` Client Component mới** ([components/chat/chat-thread.tsx](src/components/chat/chat-thread.tsx)): tích hợp `useChatSocket` hook cho realtime + REST cho hold pagination. Render message list, composer với optimistic UI, indicator "Trực tuyến" (connected) + connection error, nút "↑ Tin cũ hơn" với cursor pagination. (2) **Server Component shell** ([page.tsx](src/app/(host)/host/messages/[id]/page.tsx)): fetch song song qua Promise.all 4 thứ — `getConversationAction`, `listConversationsAction`, `getCurrentProfile`, `readTokens`. Truyền `accessToken` xuống ChatThread cho Socket.IO `auth.token`. Redirect login nếu thiếu profile/token. Sidebar list conversations với unread badge. (3) **Bug fix tự rà (4 bug)**: (a) **mark-read spam loop** — useEffect deps `[messages.length]` gọi mark-read mỗi tin gửi → fix: tách 2 effect, mount-once + lastFromOther-only (last message từ người khác); (b) **race condition WS+REST optimistic** — sender nhận lại tin mình gửi qua cả WS lẫn REST → duplicate; fix `onMessage` skip khi `senderId === currentUserId` (REST response authoritative); (c) **auto-scroll khi loadOlder** — prepend tin cũ → scroll xuống cuối (sai UX); fix: `lastAppendRef` track action, chỉ scroll khi append; (d) **optimistic id collision** — `local-${Date.now()}` không unique nếu 2 tin trong cùng ms; fix dùng `crypto.randomUUID()` fallback `Math.random()`. (4) **Cleanup orphan**: xoá `app/(host)/host/messages/[id]/message-composer.tsx` + `components/chat/message-composer.tsx` (cả 2 đã orphan, dùng action legacy) + `app/actions/chat.ts` (legacy, không có consumer). (5) **Security tradeoff documented**: accessToken expose vào client bundle vì WS cần. Acceptable: 15-min TTL + httpOnly cookie là primary auth. Comment trong Props. Typecheck **0 errors**, lint **0 warnings**. **Files xoá Phase 12**: 3 file legacy. **Components mới**: 1. |
| 2026-06-05 | spec-v1.3-phase-11 | **Phase 11 — Cleanup dead code + UI update**. (1) **Cleanup Payment dead module**: xoá 6 file (`core/entities/payment.ts`, `application/ports/payment-repository.ts`, `application/payments/list.ts` + folder, `infrastructure/mocks/mock-payment-repository.ts`, `app/actions/payments.ts`). Container bỏ `paymentRepository()` + import + type ref. Lý do: entity local (booking-level: bookingId/guestName/method:vietqr/cash/transfer) ≠ spec §10.2 (subscription-level: planId/cycle/method:vnpay_qr/bank_transfer/card). Action không có UI consumer. (2) **Skip cleanup Dispute extended fields**: `evidence/chatExcerpts/verdict/penalty` ĐANG được dùng UI (`/admin/disputes/page.tsx` show count badges + `/admin/disputes/[id]/page.tsx` render đầy đủ). BE Phase 10c trả `[]`/`null` an toàn → UI hiển thị blank section. Khi BE v2 trả data thật, UI tự fill. (3) **Permissions UI rewrite theo spec §12**: xoá `permission-matrix.tsx` cũ (hardcoded 5 group × N keys cho 3 role, có mock save setTimeout). Tạo mới `permission-editor.tsx` (Client Component) — bảng 4 module × 4 CRUD checkbox + nút "Bật/tắt hết" mỗi row + dirty banner + `useTransition` cho save (dùng `updatePermissionsAction` thật). Rewrite page `/admin/permissions/page.tsx`: nếu `?userId=` → load + show editor; không có → list SALE users (qua `listAdminUsersAction({ role: RoleCode.SALE })`) cho admin click chọn. Empty state khi chưa có SALE. (4) **Wire `/host/messages` list**: thay `getConversations() return DEMO_CONVERSATIONS` bằng `listConversationsAction()` + `getCurrentProfile()` (đồng bộ qua Promise.all). Adapter `adaptConversation(spec, currentUserId)` map `Conversation` spec §17.2 (`members[]`, `myUnread`, `lastSenderId`) → legacy demo shape (`customer_name`, `unread_owner`, `last_message_from_me`). 3-state pattern như leads page: `live`/`empty`/`demo-error`. Banner rose hiển thị error message khi fail. **Lưu ý** `property_name` BE không denormalize → dùng `subject` fallback, `online` = false (chờ presence WS). (5) **Wire `/host/leads/[id]` detail**: thay `getLead(id) return DEMO[id]` bằng `getLeadAction(id)`. Adapter `adaptLeadDetail(lead: Lead)` map entity camelCase → legacy snake_case (responded_at=contactedAt, property_id, etc.). Field `base_price/weekend_price/room_name` không có trong Lead entity (BE chưa hydrate) → undefined/null. DEMO[id] giữ làm fallback dev mode khi action fail. Typecheck **0 errors**. **Files xoá tổng (Phase 11)**: 7 file (5 Payment + 1 PermissionMatrix component + 1 application/payments/ folder). **UI page wired sang Clean Arch**: 4 page (`/admin/permissions`, `/host/messages`, `/host/leads`, `/host/leads/[id]`). |
| 2026-06-05 | spec-v1.3-phase-10 | **Phase 10 — Wire 3/4 module Mock còn lại sang API + security fix Phase 9 review**. (1) **SECURITY FIX** từ re-review: `token-storage.ts` đã bỏ `pendingTokens` module-level (cross-user leak risk khi serverless reuse module instance). Thay bằng pattern truyền `_accessTokenOverride` trực tiếp qua `RequestOptions` cho retry request. `writeTokens` giờ trả `boolean` (caller biết cookie ghi được không). `api-client.refreshTokens` giờ trả `{accessToken, refreshToken}` để retry dùng trực tiếp, không phụ thuộc cookie store. Refresh fail giờ log warn dev mode. (2) **Bug fix Booking mapper**: `isPaid` condition đổi từ `paidAt != null \|\| paidAmount >= totalAmount` → chỉ `paidAt != null`. Tránh edge case free booking (totalAmount=0) bị mark paid sai. (3) **Bug fix mock-booking update**: bỏ unsafe `as typeof b.deposit`, dùng `vnd(input.depositAmount)` đúng VND brand. (4) **ApiAdminUserRepository** (spec §3 + v1.3 §22 A2): `/users?withStats=true` map sang AdminUser entity. `propertyCount` + `bookingCount` từ BE, `disputeCount`+`lastActiveAt` defer v2 → default 0/null. `status` derive từ `bannedAt`+`isActive`. `subscriptionPlan` derive từ `subscriptionPlanId` prefix (`rooms_1\|5\|10\|30`). 6 endpoint: list+getById+ban+unban+revokeSession+resetPassword. `updateSubscription` qua `PATCH /admin/users/:id/subscription/price`. (5) **ApiKycAdminRepository** (spec §9.2 + v1.3 B5): 4-state confirmed. Local 8-state entity map xuống subset 4. `fields[]` 7-verification BE chưa expose → mảng rỗng (UI section blank đợi v2). 5 endpoint: list+getById+approve+reject+countPending. `reverseStatus` cho query: awaiting_approval/kyc_submitted → 'pending'. (6) **ApiDisputeRepository** (spec §13 + v1.3 B3): Type mapping `refund_request↔refund`, `service_quality↔quality`, `damage_claim↔fraud`. Status `pending↔open`. Extended fields (evidence/chatExcerpts/verdict/penalty) defer v2 → `[]` hoặc `null`. 7 endpoint: list+getById+countActive+open+startInvestigation+resolve+reject. `resolve` chỉ gửi `resolution + refundAmount` (extended penalty meta giữ FE-only). (7) **Skip ApiPaymentRepository**: local `Payment` entity (booking-level: bookingId/guestName/method:vietqr/cash) ≠ spec §10.2 `/payments/*` (subscription-level: planId/cycle/method:vnpay_qr). Local action `listPaymentsAction` không có UI consumer thật (admin/payments dùng subscription). **Dead code** — recommend Phase 11 dọn dẹp hoặc repurpose. (8) Container switch 3 repo sang default `api`, mock fallback qua env `NEXT_PUBLIC_DATA_MODE_{ADMIN_USERS\|KYC_ADMIN\|DISPUTES}=mock`. Typecheck **0 errors**. **Trạng thái mới**: 16/18 module wired API, 1/18 (subscriptions) opt-in API, 1/18 (payments) dead code. |
| 2026-06-05 | spec-v1.3-phase-9-fix | **Fix bug Phase 9 dựa trên BE response v1.3 + senior review**. (1) **CRITICAL Booking mapper** — `ApiBookingRepository` thêm `mapBooking(SpecBooking)` chuyển `customerName/customerPhone/checkinDate/checkoutDate/totalAmount/depositAmount/status:number/propertyName/nights` → entity `guestName/guestPhone/checkInAt/checkOutAt/totalPrice/deposit/status:string/propertyName/nights`. Numeric status map `0→hold, 1→confirmed, 2→cancelled, 3→completed`. Khi `paidAt != null \|\| paidAmount >= totalAmount` → upgrade status thành `paid`. `holdBody()` helper convert input lúc POST. Tất cả 10 method giờ qua mapper. (2) **B2 Calendar multi-property** — `ApiCalendarRepository.getGrid` join `propertyIds` thành CSV `?propertyIds=uuid1,uuid2` thay vì chỉ lấy `[0]`. (3) **B1 Review direct getById** — `ApiReviewRepository.getById` gọi thẳng `GET /admin/reviews/:id` thay vì list+find (bỏ N+1). (4) **A4 Subscription shape** — `mapSubscription` bỏ fallback chain `endsAt ?? nextChargeAt ?? expireAt ?? updatedAt`, chỉ dùng `nextChargeAt` (BE confirm không có `startsAt/endsAt`), bỏ legacy field. (5) **HIGH H1 token-storage** — write thất bại do RSC ctx giờ cache vào `pendingTokens` in-memory, `readTokens()` ưu tiên cache → retry request trong cùng request lifecycle dùng access token mới, không loop 401. (6) **H2 getCurrentProfile** — phân biệt 401/403 (login bình thường) vs 5xx/network (log warn dev mode). (7) **H3 fillDefaults permission** — warn dev mode khi BE trả thiếu module so với 4 module spec yêu cầu (raw.length > 0 nhưng < 4). (8) **H4 useChatSocket cleanup** — `disconnectChatSocket()` khi `token=null` (logout). Effect dependency đổi từ `[opts]` (object reference unstable) sang `[token, locale, baseUrl]` (primitive equality). (9) **H5 ApiSubscription** — cập nhật doc comment cho rõ `subscriptionId === userId` per BE confirm Option A. (10) **M1 container** — bỏ `void modeFor()` cho permissions+chat (env không có tác dụng → docstring chính xác). (11) **M2 middleware network** — phân biệt 5xx/TypeError (network down, giữ cookie + NextResponse.next()) vs 4xx (refresh invalid, xoá cookie + redirect login). Tránh logout user vì BE sập vài giây. (12) **M3 subscription-guard** — null guard `sub.expireAt?.slice() ?? 'kỳ trước'`. (13) **M7 subscription 400 catch** — bỏ catch 400 ở `getCurrentForOwner`, chỉ catch 404 (user thật sự không có sub). (14) **L1 audit-log validate** — `mapAction` check membership trong `ALLOWED_ACTIONS` array thay vì cast bừa. (15) **L2 forgotPassword console.error** — guard `NODE_ENV !== 'production'`. (16) **L3 leads page** — 3-state distinguish: `live` (data thật) / `empty` (BE OK nhưng 0 lead → show empty state, không DEMO) / `demo-error` (BE fail → show DEMO + error message rõ). Banner đổi sang rose color khi error. Typecheck **0 errors**. **Pending cần BE**: nothing critical — booking entity rename sang spec naming (customerName) là design choice, hiện adapter đủ tốt; subscription port rename `subscriptionId`→`ownerId` cosmetic, không gấp. |
| 2026-06-05 | spec-v1.2-phase-8-partial | **Wire UI pages cho module mới — Leads list page**. `/host/leads/page.tsx` thay `getLeads()` static DEMO bằng `listLeadsAction()` từ Clean Arch path. Thêm adapter `toCardData(lead: Lead)` map entity field (camelCase) → `LeadCardData` (snake_case legacy). Fallback DEMO khi: (a) action fail (BE chưa sẵn / unauthorized / 500), (b) BE trả mảng rỗng (đang phát triển). Thêm banner amber `Lightbulb` báo "Dữ liệu demo" khi đang fallback để dev nhận biết. Typecheck **0 errors**. **Pages chưa wire** (defer phase sau, tránh risk): `/host/leads/[id]/page.tsx` (entity divergence — UI expects `responded_at/property_slug/base_price/weekend_price` BE không trả), `/admin/permissions/page.tsx` (component hardcoded 5 group × N permission keys ≠ spec 4-module × 4-CRUD-bit — cần rewrite component), `/host/messages/*` (cần Conversation entity adapter + dùng `useChatSocket` hook đã viết Phase 6c). |
| 2026-06-05 | spec-v1.2-phase-7 | **Chat REST Server Actions + Property shape verify**. (1) `app/actions/conversations.ts` — 9 Server Action backed by `chatRepository()` port: `listConversationsAction`, `getUnreadCountAction`, `createConversationAction`, `getConversationAction`, `listMessagesAction` (cursor), `sendMessageAction` (REST fallback, BE tự broadcast WS), `markConversationReadAction`, `editMessageAction`, `deleteMessageAction`. Zod validate đầy đủ: attachment phải `https://` + ≤5 file + ≤2048 chars URL, content ≤5000 chars, conversationId/messageId UUID. Legacy `actions/chat.ts` giữ nguyên cho `message-composer.tsx` chưa migrate. (2) **Verify BE shape**: curl `GET /properties/public` 200 OK — response 100% khớp `Property` entity hiện tại (type numeric, moderationStatus string, đầy đủ field §4.5). Tin tưởng spec cho property. (3) **Booking/Subscription shape vẫn pending verify** — cần access token để test thực tế `/bookings`, `/admin/subscriptions`, `/admin/users/:id/subscription`. Booking entity dùng `guestName/checkInAt/totalPrice/deposit` vs spec `customerName/checkinDate/totalAmount/depositAmount` — nguy cơ runtime mismatch khi gọi list/getById/hold (BE có thể trả nguyên spec shape → entity field sẽ undefined). **Khuyến nghị tiếp theo**: tạo credential test, curl 1 booking, quyết định rename entity hoặc thêm adapter trong ApiBookingRepository. (4) **Phase 7c — Entity refactor skip lần này** (AdminUser/KycAdmin/Dispute): các entity có aggregation fields `bookingCount/propertyCount/disputeCount/lastActiveAt` BE không cấp + lifecycle state đa dạng vs spec đơn giản. Cần roadmap riêng để: hoặc (a) bỏ aggregation field khỏi UI (tác động `welcome-checklist`, `/admin/properties`, `/admin/page`), hoặc (b) BE bổ sung endpoint stats. Typecheck **0 errors**. |
| 2026-06-05 | spec-v1.2-phase-6 | **Booking endpoints còn thiếu + Permissions module + Chat WebSocket client**. (1) **Booking** (spec §5.1 missing): port + Api repo + Mock thêm 5 method `listMine` (GET /my-bookings), `monthCalendar` (GET /calendar/:propertyId?year&month), `customerHold` (POST /customer-hold cho CUSTOMER 24h), `customerCancel` (PATCH /:id/customer-cancel), `update` (PUT /:id với body customerName/Phone/guestCount/notes/depositAmount). Mock delegate `listMine→list`, `customerHold→hold`, `customerCancel→cancel`. (2) **Permissions** (full stack mới — spec §12): `core/entities/permission.ts` (4 module `properties\|bookings\|calendar\|reviews` × 4 CRUD bit), `application/ports/permission-repository.ts` (getForUser + update), `ApiPermissionRepository` (GET/PUT /permissions/:userId với normalize empty rows cho 4 module), container default `api`, `app/actions/permissions.ts` (getPermissionsAction + updatePermissionsAction với Zod). (3) **Chat WebSocket** (spec §17.4): cài `socket.io-client@4.8.3`. `lib/chat-socket.ts` — singleton per tab, auto-reconnect (1s→8s backoff), connect tới `/chat` namespace với `auth: { token }` + `query: { lang }` từ accessToken. Type-safe event subscription helpers cho 7 server→client event: `message:new`, `message:ack`, `message:edit`, `message:delete`, `read:update`, `typing`, `presence`, `error`. Token rotate → disconnect+recreate. Emit helpers: `sendChatMessage`, `emitChatRead`, `emitTypingStart/Stop`. `lib/use-chat-socket.ts` — React hook wrapper với ref-stable handlers (không re-subscribe mỗi render) + connected state. Typecheck **0 errors**. **Còn lại Phase 7**: entity refactor AdminUser/KycAdmin/Dispute (cần UI work), verify Booking field names + Subscription userId mapping với BE thật, KYC upload nếu cần trên web. |
| 2026-06-05 | spec-v1.2-phase-5 | **Modules mới**: Leads + Admin Emails real + Chat REST. (1) **Admin Emails**: `sendTestEmailAction` đảo default sang `live` (spec §16 endpoint live), gọi `POST /admin/emails/test` qua apiClient khi không bị tắt bằng `NEXT_PUBLIC_EMAIL_LIVE=false`. (2) **Leads** (full stack mới theo spec §15): `core/entities/lead.ts` (5-state + 4-source), `application/ports/lead-repository.ts` (create Public + list/getById/update Auth), `ApiLeadRepository` (POST /leads skipAuth, GET/PATCH /leads), `MockLeadRepository` in-memory, container default `api`. `app/actions/leads.ts` Server Actions với Zod validate (5 method) — note: file legacy `actions/lead.ts` giữ nguyên cho route public `/property/:id/book` chưa migrate. (3) **Chat REST** (spec §17.1, WS client để session sau): `core/entities/chat.ts` (Conversation/ConversationMember/Message/MessageAttachment + type/role enum), `application/ports/chat-repository.ts` (9 method: list/unread-count/create/get/listMessages cursor/sendMessage/markRead/editMessage/deleteMessage), `ApiChatRepository` đầy đủ 9 endpoint REST, container hardcode `api`. **WS chưa wire** — cần Socket.IO client + connection manager + event handlers (`message:new`, `message:ack`, `message:edit`, `message:delete`, `read:update`, `typing`, `presence`) — defer Phase 6. Typecheck **0 errors**. |
| 2026-06-05 | spec-v1.2-phase-4 | **Subscription rewrite 4-state → spec §10.5 7-state** (BREAKING entity, backward-compatible field expand). (1) `SubscriptionStatus` đổi `paid\|pending\|overdue\|frozen` → `none\|trial\|active\|past_due\|cancelled\|frozen\|expired`. (2) `Subscription` entity thêm optional fields theo spec §10: `nextChargeAt`, `trialEndsAt`, `priceOverride`, `provider` (`apple_iap\|vnpay\|manual_bank\|manual\|null`), `frozenAt`, `frozenReason`. Giữ `expireAt` làm alias của `nextChargeAt` để UI không vỡ. (3) `subscription-guard.ts` `blockedReason()` rewrite — chặn 4 trạng thái `frozen\|past_due\|expired\|cancelled` với message phù hợp; cho phép `none\|trial\|active`. (4) Mock seed: status literal `paid→active`, `pending→none`, `overdue→past_due`. Method `markPaid`/`unfreeze` map sang state mới. (5) UI updates: `/admin/payments` STATUS_LABEL+VARIANT+TABS+parseStatus cover 7 state mới, filter `pending→past_due`; `/host/settings/subscription` STATUS_LABEL+VARIANT, hint trỏ `past_due`; `/host/billing` literal `overdue→past_due`; `subscription-row-actions.tsx` action visibility map sang state mới (`active\|trial\|past_due` cho mark-paid + freeze, `past_due` cho call). (6) `ApiSubscriptionRepository` spec §10.4 — list/getById (via `/admin/users/:id/subscription`)/getCurrentForOwner (via `/subscriptions/me`)/count-overdue/sum-paid/mark-paid/freeze/unfreeze. Map BE response (`planId`, `endsAt`, `nextChargeAt`, `trialEndsAt`, etc.) sang local shape. **Lưu ý** BE identify theo `userId` chứ không phải `subscriptionId` — port hiện giả định `subscriptionId === ownerId` (1-1). (7) Container default `subscriptionRepository()` vẫn = `mock` (do mapping userId chưa verify end-to-end), bật `api` qua env `NEXT_PUBLIC_DATA_MODE_SUBSCRIPTIONS=api`. Typecheck **0 errors**. |
| 2026-06-05 | spec-v1.2-phase-3-partial | **Wire mock→API cho Calendar + Reviews** (clean shape mapping). (1) `ApiCalendarRepository` spec §6: `getGrid` map `startDate/endDate/propertyId` query + spec string status `available\|hold\|booked\|locked` → local numeric `CalendarStatus` enum; `lockDate`, `unlockDate` (DELETE body), `markSold`. `list()` legacy event API trả mảng rỗng. (2) `ApiReviewRepository` spec §7.2: `list` map status filter `published→visible/hidden→hidden/undefined→all`, response §7.3 → local Review shape (`avgRating` → `rating` round, hydrated fields fallback empty), `countFlagged`, `hide` (DELETE body reason), `restore`. (3) Container: `calendarRepository()` + `reviewRepository()` default sang `api`, mock fallback qua env. **Skip 4 module còn lại** (lý do entity divergence cần UI refactor riêng): `ApiAdminUserRepository` (entity có aggregation `bookingCount/propertyCount/disputeCount` spec không trả); `ApiKycAdminRepository` (entity có lifecycle 8-state `draft/payment_pending/paid/...` spec chỉ 4-state); `ApiDisputeRepository` (entity rich Vietnamese model với evidence/chatExcerpt/parties/verdict/penalty không khớp spec đơn giản); `ApiPermissionRepository` (chưa có port + entity). KYC host-side (`getStatus`) đã wire từ trước — spec §9.1 upload/submit/resubmit chỉ dùng trên mobile theo comment trong entity. Typecheck **0 errors**. |
| 2026-06-05 | spec-v1.2-phase-2 | **Audit log cleanup theo spec §14** (BE tự ghi, FE chỉ đọc). (1) Tạo `ApiAuditLogRepository` map spec response §14.3 → local shape: `targetType/targetId/targetLabel/createdAt/metadata.reason` → `target.{type,id,label}/at/reason`, action dot-slug `user.ban` → underscore `user_ban`. (2) Mở rộng `AuditAction` enum thêm 9 spec action: `user_delete`, `user_kyc_bypass_toggle`, `review_restore`, `booking_mark_paid`, `subscription_{trial_grant,trial_revoke,set_price,mark_paid,freeze,unfreeze}`. Đổi `user_revoke_session` → `user_revoke_sessions` (spec slug), `dispute_start_investigation` → `dispute_investigate`. (3) Mở rộng `AuditTargetType` thêm `booking`, `subscription`. (4) Bỏ method `record()` khỏi port + `recordAuditEntryUseCase` khỏi use case + `record()` khỏi MockAuditLogRepository. (5) Xoá `src/lib/audit-recorder.ts`. (6) Xoá `recordAudit()` calls trong 6 action file: `admin-users.ts` (6 calls), `admin.ts` (3), `disputes.ts` (3), `kyc-admin.ts` (2), `reviews.ts` (1), `subscriptions.ts` (3) — tổng 18 call sites + 6 import line. (7) Container default: `auditLogRepository()` → `api`, mock giữ làm fallback qua `NEXT_PUBLIC_DATA_MODE_AUDIT_LOG=mock`. (8) Cập nhật `/admin/audit-log` page: ACTION_VARIANT cover 24 action, TARGET_ICON + TARGET_COLOR thêm booking (CalendarCheck/sky) + subscription (CreditCard/violet), `parseTarget()` mở rộng. Typecheck **0 errors**. |
| 2026-06-05 | spec-v1.2-phase-1 | Rà soát `docs/API_SPEC_FULL.md` v1.2 (1204 dòng) đối chiếu code. Verify BE bằng curl: tất cả endpoint spec đều live (`/properties/public` 200, `/calendar/public-grid` 400 cần params, `/billing/plans` 200, `/app/version` 200, các endpoint admin 401 cần auth). `/dashboard/stats` + `/reports` vẫn live (spec sót, giữ). **Phase 1 — Quick wins (port + repo layer, không đụng UI)**: (1) `core/entities/user.ts` bổ sung field spec §2.3: `avatar`, `emailVerified`, `updatedAt`, `subscriptionProvider`, `subscriptionPriceOverride`, `subscriptionFrozenAt/Reason`. `SubscriptionStatus` enum đổi 5→7 state đúng spec §10.5 (`none\|trial\|active\|past_due\|cancelled\|frozen\|expired`) — thay literal `trialing` cũ. Thêm `SubscriptionProvider` type. (2) Bug fix: `ApiBookingRepository.markPaid` URL `/mark-paid` → `/paid` (spec §5.1). (3) `PropertyRepository` (port + Api + Mock) thêm: `listPublic(filters)` (Public §4.1), `getShare(id)` (Public §4.1), `approve/reject/suspend` (Admin §4.4). (4) `StaffRepository` (port + Api + Mock) thêm: `verifyInvite(token)` + `acceptInvite(input)` (Public §11.2 cho landing accept invite). Typecheck **0 errors**. **Phase 2–5 còn pending** (chờ phê duyệt từng phase do scope lớn): Audit log cleanup (spec §14 cấm FE ghi audit — phải xoá `recordAudit()` ở 12 file action + tạo `ApiAuditLogRepository` read-only), Wire mock→API (Calendar/Reviews/Disputes/Permissions/KycAdmin/AdminUser + expand Kyc upload+submit+resubmit), **Subscription entity rewrite BREAKING** (mock entity 4-state `paid\|pending\|overdue\|frozen` → spec 7-state, ảnh hưởng `/admin/payments` page + `/host/settings/subscription` + `/host/billing` + `subscription-guard.ts` + `subscription-row-actions.tsx`), New modules (Leads stack mới + Admin Emails real `POST /admin/emails/test` + Chat REST `/conversations/*` + Socket.IO `/chat` namespace). **Field mismatch flag**: `core/entities/booking.ts` dùng `guestName/checkInAt/totalPrice/deposit/nights` nhưng spec §5.3 dùng `customerName/checkinDate/totalAmount/depositAmount` — cần verify response thật BE trả về để quyết định adapter hay rename entity (risk cao, ưu tiên xác minh runtime trước khi sửa). |
| 2026-05-25 | supabase-final-cleanup | Loại bỏ hoàn toàn mọi reference Supabase còn sót: xoá thư mục `supabase/` (migrations + README), xoá env vars Supabase trong `.env.local.example`, xoá `*.supabase.co` khỏi `next.config.ts` (images + CSP), dọn `.gitignore`/`.prettierignore`/`eslint.config.mjs`. Rename `database.types.ts` → `legacy-types.ts` + cập nhật 11 file import. Cập nhật `README.md` và `docs/CODING-STANDARDS.md` thay mọi reference Supabase bằng Clean Architecture / REST API. Xoá prop `isSupabaseReady` khỏi `image-uploader.tsx`. Typecheck 0 errors, grep supabase trong src/ = 0 results. |

---

## 12. Liên kết nội bộ

- [`docs/CODING-STANDARDS.md`](./docs/CODING-STANDARDS.md) — SOAP/RISE + design patterns chi tiết
- [`api-spec-website-admin.md`](./api-spec-website-admin.md) — Spec API đầy đủ
- [`README.md`](./README.md) — Hướng dẫn chạy project
