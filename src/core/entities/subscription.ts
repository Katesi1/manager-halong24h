/**
 * Subscription — chu kỳ chủ nhà trả phí cho Halong24h.
 *
 * Business model 2026-05-15: Halong24h KHÔNG giữ tiền booking, doanh thu duy
 * nhất = subscription fee theo số phòng:
 *   - Miễn phí (1-3 phòng):       0đ
 *   - Cơ bản (4-10 phòng):    50.000đ / phòng / tháng
 *   - Tiêu chuẩn (11-30):     40.000đ / phòng / tháng
 *   - Chuyên nghiệp (31+):    30.000đ / phòng / tháng
 *
 * Lifecycle:
 *   pending (đã gửi hoá đơn, chờ chuyển khoản)
 *     → paid (đã thu, expireAt = startAt + 30/365 ngày)
 *     → overdue (quá expireAt mà chưa renew, FE chặn create-property)
 *     → frozen (admin chủ động tạm khoá vì quá nhiều dispute / nợ phí)
 */

export type SubscriptionPlan = 'free' | 'basic' | 'standard' | 'pro';
export type SubscriptionCycle = 'monthly' | 'yearly';

/**
 * Spec §10.5 — 7-state lifecycle.
 *
 *   none      → owner chưa từng có sub
 *   trial     → đang trial (admin cấp / sau KYC approve)
 *   active    → đã thanh toán, đang trong kỳ hiệu lực
 *   past_due  → hết kỳ chưa renew (= legacy 'overdue')
 *   cancelled → user/admin huỷ chủ động
 *   frozen    → admin tạm khoá vì vi phạm
 *   expired   → hết hạn dứt khoát (cancelled + qua kỳ)
 */
export type SubscriptionStatus =
  | 'none'
  | 'trial'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'frozen'
  | 'expired';

/** Spec v1.4 §10.4 — VNPay loại bỏ. v1.6 thêm casso, sepay. */
export type SubscriptionProvider =
  | 'apple_iap'
  | 'manual_bank'
  | 'manual'
  | 'casso'
  | 'sepay'
  | null;

export interface Subscription {
  id: string;
  ownerId: string;
  ownerName: string;
  /** Email chủ nhà — hiển thị cạnh tên cho admin dễ nhận diện (BE trả ở list). */
  ownerEmail?: string | null;
  /**
   * Id gói cước thật từ danh mục (`rooms_5`, `enterprise`, ...) do admin quản lý
   * ở `/admin/pricing`. Đây là nguồn chuẩn để tra tên + giá gói. `plan` (bucket
   * free/basic/...) chỉ là phân loại nội bộ phía admin.
   */
  planId: string;
  plan: SubscriptionPlan;
  cycle: SubscriptionCycle;
  /** Số phòng tính phí trong kỳ */
  roomCount: number;
  /** Tổng tiền kỳ này (VND) */
  amount: number;
  status: SubscriptionStatus;
  /** Bắt đầu kỳ */
  startAt: string;
  /**
   * Hết kỳ — legacy alias cho `nextChargeAt`. Giữ tên `expireAt` để UI không
   * vỡ; khi BE trả `nextChargeAt`/`endsAt`, repo set `expireAt = nextChargeAt`.
   */
  expireAt: string;
  /** Spec §10 — ngày charge kỳ tiếp theo. Cùng giá trị với `expireAt` khi BE expose. */
  nextChargeAt?: string | null;
  /** Spec §10 — thời điểm hết hạn trial (null nếu không trial). */
  trialEndsAt?: string | null;
  /** Spec §10.6 — admin override giá kỳ này (VND, null = dùng giá plan). */
  priceOverride?: number | null;
  /** Spec §10.5 — payment provider. */
  provider?: SubscriptionProvider;
  /** Spec §10.4 — thời điểm admin freeze. */
  frozenAt?: string | null;
  /** Spec §10.4 — lý do freeze (alias của `note` legacy). */
  frozenReason?: string | null;
  paidAt: string | null;
  /** Ngày BE/admin gửi hoá đơn */
  invoicedAt: string;
  /** Ghi chú admin (lý do freeze, etc.) */
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus;
  plan?: SubscriptionPlan;
  ownerId?: string;
  search?: string;
}

/** Loại hoá đơn gói cước. */
export type InvoiceKind = 'subscription' | 'renew' | 'upgrade' | 'refund';

/**
 * Hoá đơn gói cước của chủ nhà (`GET /subscriptions/me/invoices`).
 *
 * `amount` giữ nguyên `number` (VND, theo style các field tiền BE trả — xem
 * `Subscription.amount`). Format hiển thị qua `formatVND` ở UI.
 */
export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  kind: InvoiceKind;
  planId: string;
  planLabel: string;
  cycle: SubscriptionCycle;
  rooms: number;
  /** Kỳ hoá đơn dạng "YYYY-MM". */
  period: string;
  /** Số tiền hoá đơn (VND). */
  amount: number;
  /** Phương thức thanh toán, vd "bank_transfer". */
  method: string;
  /** Trạng thái hoá đơn, vd "paid". */
  status: string;
  /** Nhà cung cấp thanh toán, vd "manual_bank". */
  provider: string;
  referenceCode: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  refundedAmount: number | null;
  expiresAt: string | null;
  createdAt: string;
}

/** Admin được hydrate trong call-log (`admin: { id, name, email }`). */
export interface CallLogAdmin {
  id: string;
  name: string;
  email: string;
}

/**
 * Ghi chú cuộc gọi đòi nợ gói cước (`/admin/subscriptions/:id/call-log`).
 * `:id` là userId của OWNER.
 */
export interface SubscriptionCallLog {
  id: string;
  userId: string;
  adminId: string;
  note: string;
  createdAt: string;
  /** Hydrate ở GET list (newest-first). */
  admin?: CallLogAdmin | null;
}

export interface MarkPaidInput {
  /** = OWNER userId (spec §A5 Option A: 1 user = 1 subscription). */
  subscriptionId: string;
  /** Số tiền thực nhận từ chủ nhà (VND). Phải > 0. */
  paidAmount: number;
  /**
   * Gói muốn nâng/đổi (id danh mục `rooms_10`, `enterprise`...). Bỏ trống ⇒ BE
   * giữ gói hiện tại. Dùng khi admin nâng gói thủ công (tiền mặt / CK ngoài).
   */
  planId?: string;
  /** Chu kỳ. Bỏ trống ⇒ BE giữ chu kỳ hiện tại. */
  cycle?: SubscriptionCycle;
  /** Số phòng kỳ này (≥ 1). Bỏ trống ⇒ BE dùng số phòng cũ / 1. */
  rooms?: number;
  /** Số ngày gia hạn (1–3650). Bỏ trống ⇒ BE mặc định 30 (monthly) / 365 (yearly). */
  days?: number;
  /** Mã biên nhận (vd "TIEN_MAT", mã CK). */
  reference?: string;
  /** Ghi chú của admin. */
  note?: string;
}

/**
 * Kết quả nâng gói (`POST /admin/users/:id/subscription/mark-paid`).
 * BE trả gói mới đã kích hoạt + mốc hiệu lực.
 */
export interface MarkPaidResult {
  userId: string;
  amount: number;
  planId: string;
  cycle: SubscriptionCycle;
  rooms: number;
  startsAt: string;
  endsAt: string;
}

export interface FreezeInput {
  subscriptionId: string;
  reason: string;
}

export const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  free: 'Miễn phí',
  basic: 'Cơ bản',
  standard: 'Tiêu chuẩn',
  pro: 'Chuyên nghiệp',
};

export const PRICE_PER_ROOM: Record<SubscriptionPlan, number> = {
  free: 0,
  basic: 50_000,
  standard: 40_000,
  pro: 30_000,
};

export function planForRoomCount(rooms: number): SubscriptionPlan {
  if (rooms <= 3) return 'free';
  if (rooms <= 10) return 'basic';
  if (rooms <= 30) return 'standard';
  return 'pro';
}

export function calcSubscriptionAmount(
  plan: SubscriptionPlan,
  rooms: number,
  cycle: SubscriptionCycle = 'monthly',
): number {
  const monthly = PRICE_PER_ROOM[plan] * rooms;
  return cycle === 'yearly' ? monthly * 12 * 0.8 : monthly;
}
