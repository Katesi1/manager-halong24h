/**
 * BillingPlan — gói cước Halong24h (spec §10.1, endpoint `GET /billing/plans`).
 *
 * Catalog 6 gói (cập nhật 2026-06-08, đã loại bỏ rooms_test):
 *   rooms_1     — Mini        199.000đ/tháng    1 phòng
 *   rooms_5     — Starter     599.000đ/tháng    5 phòng
 *   rooms_10    — Standard    999.000đ/tháng   10 phòng
 *   rooms_20    — Pro       1.799.000đ/tháng   20 phòng
 *   rooms_50    — Business  3.999.000đ/tháng   50 phòng
 *   enterprise  — Enterprise  Liên hệ           ∞ phòng (rooms = -1)
 *
 * Giá chưa bao gồm VAT 10% (trừ Enterprise tính riêng theo hợp đồng).
 * Gói năm giảm 16% so với 12 tháng (Business giảm 37%).
 */

export type BillingPlanId =
  | 'rooms_1'
  | 'rooms_5'
  | 'rooms_10'
  | 'rooms_20'
  | 'rooms_50'
  | 'enterprise';

export interface BillingPlan {
  id: BillingPlanId | string;
  /** Số phòng tối đa. -1 = không giới hạn (Enterprise). */
  rooms: number;
  /** Giá tháng (VND, chưa VAT). 0 với Enterprise (liên hệ). */
  monthlyPrice: number;
  /** Giá năm (VND, chưa VAT). 0 với Enterprise. */
  yearlyPrice: number;
  /** Tính năng nổi bật, hiển thị bullet. */
  features: string[];
  /** Admin endpoint trả thêm. Public endpoint chỉ trả gói active. */
  active?: boolean;
}

/** Input tạo gói mới (POST /admin/billing-plans). */
export interface CreateBillingPlanInput {
  id: string;
  rooms: number;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  active?: boolean;
}

/** Input sửa gói (PUT /admin/billing-plans/:id) — partial. */
export interface UpdateBillingPlanInput {
  rooms?: number;
  monthlyPrice?: number;
  yearlyPrice?: number;
  features?: string[];
  active?: boolean;
}

/**
 * Kết quả xoá: BE smart-delete. Hard xoá nếu không còn ref, soft (set
 * `active=false`) nếu vẫn có user/subscription tham chiếu.
 */
export interface DeleteBillingPlanResult {
  mode: 'hard' | 'soft';
}

/** Tên thương mại (BE chỉ trả id) — map id → label hiển thị. */
export const BILLING_PLAN_LABEL: Record<BillingPlanId, string> = {
  rooms_1: 'Mini',
  rooms_5: 'Starter',
  rooms_10: 'Standard',
  rooms_20: 'Pro',
  rooms_50: 'Business',
  enterprise: 'Enterprise',
};

/** Mô tả ngắn cho mỗi gói. */
export const BILLING_PLAN_TAGLINE: Record<BillingPlanId, string> = {
  rooms_1: 'Cho chủ nhà mới bắt đầu',
  rooms_5: 'Cho cơ sở nhỏ, multi-staff',
  rooms_10: 'Cơ sở vừa, pricing nâng cao',
  rooms_20: 'Multi-property, không giới hạn nhân viên',
  rooms_50: 'Đồng bộ kênh OTA, API + Webhook',
  enterprise: 'Tuỳ biến hợp đồng + SLA 24/7',
};

/** Gói được highlight là phổ biến nhất. */
export const POPULAR_PLAN_ID: BillingPlanId = 'rooms_10';

export function planLabel(id: string): string {
  return BILLING_PLAN_LABEL[id as BillingPlanId] ?? id;
}

export function planTagline(id: string): string {
  return BILLING_PLAN_TAGLINE[id as BillingPlanId] ?? '';
}

/** Số tiền tiết kiệm khi thanh toán năm so với 12 tháng. */
export function yearlySavings(plan: BillingPlan): number {
  if (plan.monthlyPrice <= 0 || plan.yearlyPrice <= 0) return 0;
  return plan.monthlyPrice * 12 - plan.yearlyPrice;
}

/** Phần trăm giảm khi mua năm. */
export function yearlySavingsPercent(plan: BillingPlan): number {
  if (plan.monthlyPrice <= 0 || plan.yearlyPrice <= 0) return 0;
  const full = plan.monthlyPrice * 12;
  return Math.round(((full - plan.yearlyPrice) / full) * 100);
}

/** Giá trên 1 phòng/tháng (chỉ áp dụng khi rooms > 0). */
export function pricePerRoom(plan: BillingPlan): number {
  if (plan.rooms <= 0 || plan.monthlyPrice <= 0) return 0;
  return Math.round(plan.monthlyPrice / plan.rooms);
}
