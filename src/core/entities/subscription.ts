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
export type SubscriptionStatus = 'pending' | 'paid' | 'overdue' | 'frozen';

export interface Subscription {
  id: string;
  ownerId: string;
  ownerName: string;
  plan: SubscriptionPlan;
  cycle: SubscriptionCycle;
  /** Số phòng tính phí trong kỳ */
  roomCount: number;
  /** Tổng tiền kỳ này (VND) */
  amount: number;
  status: SubscriptionStatus;
  /** Bắt đầu kỳ */
  startAt: string;
  /** Hết kỳ (sau ngày này = overdue) */
  expireAt: string;
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

export interface MarkPaidInput {
  subscriptionId: string;
  /** Số tiền thực thu — phải bằng amount */
  paidAmount: number;
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
