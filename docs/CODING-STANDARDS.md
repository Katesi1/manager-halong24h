# Webhalong24h Manager — Chuẩn mực code

> Tài liệu này định nghĩa quy chuẩn viết code, mô tả task, và design pattern khuyến nghị cho dự án.
> Stack: **Next.js 15 (App Router) · React 19 · Supabase SSR · Tailwind v4 · TypeScript 5.7 · Zod**.

---

## 1. SOAP — Chuẩn mô tả thay đổi code

Mọi PR, commit message dài, hay spec feature đều phải trả lời được 4 câu hỏi:

| Mục | Câu hỏi | Ví dụ trong dự án |
|---|---|---|
| **S — Subject** | Đụng vào module/màn nào? | `host/bookings — danh sách & filter` |
| **O — Objective** | Kết quả nghiệp vụ mong muốn là gì? | "Host xem được booking đang chờ check-in trong 24h tới và xác nhận hàng loạt" |
| **A — Action** | Thay đổi kỹ thuật cụ thể nào? | "Thêm Server Action `confirmBookings`, sửa query có index trên `(host_id, check_in_at)`, thêm checkbox UI" |
| **P — Plan** | Trình tự, rollout, rollback ra sao? | "1) Migration index. 2) Server Action + test. 3) UI behind flag. 4) Bật flag với 1 host beta. Rollback = tắt flag." |

### Template SOAP cho commit/PR

```markdown
**S**: src/app/(host)/host/bookings — bulk confirm
**O**: Cho phép host xác nhận nhiều booking sắp check-in trong một lần
**A**:
  - actions/bookings.ts: confirmBookings(ids: string[])
  - components/host/BookingTable.tsx: thêm cột checkbox + thanh action
  - migration: index booking(host_id, check_in_at)
**P**:
  1. Apply migration (reversible)
  2. Deploy code sau feature flag `bulk_confirm`
  3. Bật cho 1 host beta, theo dõi 24h
  4. Rollback: tắt flag, revert migration nếu cần
```

### Khi nào bắt buộc dùng SOAP

- Đụng vào schema DB hoặc RLS policy
- Đụng vào tính tiền (`pricing.ts`, VietQR, billing)
- Thay đổi auth/middleware
- PR > 200 dòng diff

Bug fix nhỏ, đổi text, đổi style: chỉ cần một dòng commit `fix:` là đủ.

---

## 2. RISE — Chuẩn giao việc cho AI agent (Claude Code, Cursor, …)

Khi yêu cầu AI làm task, prompt nên đủ 4 phần:

| Mục | Nội dung | Ví dụ |
|---|---|---|
| **R — Role** | AI đóng vai gì? | "Là backend dev quen Supabase RLS và Next.js Server Actions" |
| **I — Issue** | Vấn đề/yêu cầu cụ thể | "Host hiện thấy được booking của host khác qua URL tay — RLS thiếu policy theo `host_id`" |
| **S — Steps** | Các bước AI nên làm theo thứ tự | "1) Đọc `database.types.ts` xác định bảng. 2) Viết migration RLS policy. 3) Thêm test integration." |
| **E — Expected outcome** | Tiêu chí "xong" có thể kiểm chứng | "GET `/host/bookings/{id}` của host khác trả 404; test integration pass; không hồi quy danh sách của chính host." |

### Template RISE

```markdown
**Role**: Senior Next.js + Supabase engineer thuộc team Webhalong24h
**Issue**: <mô tả vấn đề bằng 1-3 câu, kèm file path / triệu chứng>
**Steps**:
  1. <step nhỏ, có thể verify>
  2. ...
**Expected outcome**:
  - <điều kiện đạt 1>
  - <điều kiện đạt 2>
  - Tests: <tên test cụ thể> pass
  - Type check & lint pass
```

### Mẹo viết RISE hiệu quả

- **Issue** phải có **bằng chứng**: file path, line number, log, hoặc bước reproduce. Tránh "có vẻ chậm".
- **Steps** chỉ áp đặt khi bạn đã chắc cách làm. Nếu chưa chắc, bỏ Steps để AI tự đề xuất, **Expected outcome** vẫn giữ.
- **Expected outcome** phải **đo được**. "Code sạch hơn" không đo được; "file < 400 dòng, không còn import vòng tròn" thì đo được.

---

## 3. Design Patterns khuyến nghị cho dự án

Stack này có những đặc thù: multi-tenant (admin/host), thanh toán VND, Server Components/Actions, Supabase RLS. Dưới đây là pattern nên áp dụng + chống pattern cần tránh.

### 3.1. Tách rõ 4 môi trường Supabase client (BẮT BUỘC)

Đã có sẵn trong `src/lib/supabase/`:

| File | Dùng ở đâu | Auth context |
|---|---|---|
| `client.ts` | Client Component (`'use client'`) | Session của user qua cookie |
| `server.ts` | Server Component, Route Handler, Server Action | Session của user qua cookie SSR |
| `middleware.ts` | `middleware.ts` (refresh token) | — |
| `admin.ts` | Server Action **cần bypass RLS** (vd: cron, webhook, admin tool) | Service role key |

**Quy tắc vàng**:
- Không bao giờ import `admin.ts` trong Client Component (sẽ leak service key vào bundle).
- Không dùng `admin.ts` cho luồng do user kích hoạt trừ khi đã `assertRole('admin')` trước.

### 3.2. Server Action + Result type (thay cho throw)

**Anti-pattern** — throw từ Server Action:

```ts
// ❌ Lỗi không có shape, UI khó xử lý theo từng case
export async function createBooking(input: unknown) {
  const data = BookingSchema.parse(input) // throws ZodError
  const { error } = await supabase.from('bookings').insert(data)
  if (error) throw error
}
```

**Pattern khuyến nghị** — discriminated union:

```ts
// src/lib/result.ts
export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E; fieldErrors?: Record<string, string[]> }

// src/app/actions/bookings.ts
'use server'
export async function createBooking(
  input: unknown
): Promise<Result<{ id: string }>> {
  const parsed = BookingSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'VALIDATION', fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('bookings').insert(parsed.data).select('id').single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: { id: data.id } }
}
```

Client dùng với `useActionState` (React 19):

```tsx
const [state, action, pending] = useActionState(createBookingAction, null)
```

### 3.3. Repository / Data Access Layer

**Lý do**: bảng Supabase được query rải rác → khó tối ưu, khó đổi schema, dễ rò RLS.

Cấu trúc đề xuất:

```
src/lib/data/
├── bookings.ts      # findById, listForHost, createPending, ...
├── properties.ts
├── payments.ts
├── disputes.ts
└── _types.ts
```

Quy tắc:
- Một file = một bảng/aggregate root.
- Mỗi function nhận `SupabaseClient` làm tham số đầu (dependency injection) → test được.
- Không leak object Supabase ra ngoài (return type là model của domain, không phải `PostgrestResponse`).

```ts
// src/lib/data/bookings.ts
export async function findBookingById(
  supabase: SupabaseClient,
  id: string
): Promise<Booking | null> {
  const { data } = await supabase.from('bookings')
    .select('id, host_id, check_in_at, status').eq('id', id).maybeSingle()
  return data ? mapToBooking(data) : null
}
```

### 3.4. RBAC Guard cho route group

`src/app/(admin)` và `(host)` đang phân biệt bằng path nhưng phải có guard ở `layout.tsx`:

```ts
// src/app/(admin)/layout.tsx
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = await getUserRole(supabase, user.id)
  if (role !== 'admin') redirect('/') // hoặc forbidden()
  return <>{children}</>
}
```

Tương tự `(host)/layout.tsx`. **Không** dùng middleware làm RBAC chính (middleware chỉ refresh session) vì middleware không thấy được DB role chuẩn xác.

### 3.5. Money / VND — không dùng `number`

Tiền tệ VN không có phần lẻ thường gặp, nhưng vẫn dễ sai do làm tròn float khi nhân tỷ lệ chia chiết khấu.

```ts
// src/lib/money.ts
export type VND = number & { readonly __brand: 'VND' }
export const vnd = (n: number): VND => Math.round(n) as VND
export const formatVND = (n: VND) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
```

Mọi cột tiền trong DB lưu **integer (đồng)**, không lưu float.

### 3.6. Container / Presentational cho page admin & host

Page route trong App Router là **Server Component** → fetch data ở đó.
Component nhận props là **Client Component** thuần, không gọi Supabase.

```tsx
// src/app/(host)/host/bookings/page.tsx (Server)
export default async function Page() {
  const supabase = await createServerClient()
  const bookings = await listBookingsForCurrentHost(supabase)
  return <BookingTable bookings={bookings} />
}

// src/components/host/BookingTable.tsx ('use client')
export function BookingTable({ bookings }: { bookings: Booking[] }) { ... }
```

Lợi: SEO/streaming + bundle nhỏ + dễ test UI bằng Storybook/Playwright.

### 3.7. Optimistic Update với `useOptimistic` (React 19)

Cho thao tác hay dùng (đổi trạng thái booking, gửi message chat):

```tsx
const [optimistic, setOptimistic] = useOptimistic(bookings, (state, next: Booking) =>
  state.map(b => b.id === next.id ? next : b)
)
```

Rollback tự động nếu Server Action trả `{ ok: false }`.

### 3.8. Validation ở biên với Zod

Mỗi Server Action **bắt buộc** parse input qua Zod schema trước khi đụng DB.
Schema đặt cùng folder với action:

```
src/app/actions/
├── bookings.ts
├── bookings.schema.ts
├── payments.ts
└── payments.schema.ts
```

Schema có thể dùng lại ở client để validate form (tránh trùng logic).

### 3.9. Compound Component cho UI phức tạp

Dialog xử lý dispute, modal lập booking nhiều bước → compound component (đã có Radix làm mẫu):

```tsx
<DisputeReviewDialog>
  <DisputeReviewDialog.Header>...</DisputeReviewDialog.Header>
  <DisputeReviewDialog.Evidence />
  <DisputeReviewDialog.Decision />
  <DisputeReviewDialog.Footer />
</DisputeReviewDialog>
```

Tránh truyền 15 prop xuống một dialog phẳng.

### 3.10. Feature Flag nhẹ

Trước khi có hệ flag chuẩn, dùng env var đơn giản:

```ts
// src/lib/flags.ts
export const flags = {
  bulkConfirm: process.env.NEXT_PUBLIC_FLAG_BULK_CONFIRM === '1',
  newPricing: process.env.NEXT_PUBLIC_FLAG_NEW_PRICING === '1',
} as const
```

Mọi rollout rủi ro phải có flag. Có flag mới được dùng SOAP plan "rollback = tắt flag".

---

## 4. Quy tắc file & function

| Mục | Giới hạn | Lý do |
|---|---|---|
| Function | < 50 dòng | Dễ đọc, dễ test |
| File | < 400 dòng (tối đa 800) | Tách module |
| Component | < 300 dòng JSX | Tách presenter con |
| Nesting | < 4 cấp | Dùng early return |
| Server Action | 1 action / 1 export | Type rõ ràng cho `useActionState` |

---

## 5. Checklist trước khi mark "xong"

- [ ] `pnpm typecheck` (hoặc `npm run typecheck`) pass
- [ ] `npm run lint` pass
- [ ] Server Action có Zod schema và trả `Result<T>`
- [ ] Không có `supabase` được tạo trong Client Component (dùng hook `useSupabase()` hoặc prop drill)
- [ ] `admin.ts` không bị import từ Client Component
- [ ] Tiền tệ dùng `VND` brand type, không `number` thô
- [ ] Page mới có guard role nếu nằm trong `(admin)` hoặc `(host)`
- [ ] Không hardcode khóa Supabase / VietQR
- [ ] Đã test thủ công ở `http://localhost:3001` cho cả host & admin role

---

## 6. Anti-pattern cấm

1. Gọi `createServerClient()` trong vòng lặp (mỗi request đã có 1 client, dùng lại).
2. `select('*')` trong list view (kéo cột không dùng).
3. `useEffect` để fetch data ban đầu — dùng Server Component fetch.
4. State client mirror server state (giữ state ở Server, dùng `revalidatePath` / `revalidateTag`).
5. `as any`, `// @ts-ignore` không kèm comment giải thích.
6. RPC/Edge Function ẩn — mọi business rule phải có entry rõ trong `src/app/actions/` hoặc `src/lib/data/`.

---

## 7. Liên kết

- ECC rules đã cài: `~/.claude/rules/ecc/` (common + có thể bổ sung typescript layer)
- Supabase RLS reference: `supabase/migrations/` (TBD)
- VietQR spec: xem `src/lib/vietqr.ts`
