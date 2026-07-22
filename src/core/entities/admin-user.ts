import type { RoleCode } from '../value-objects/role';

/**
 * Admin user management — model thống nhất CUSTOMER + OWNER + SALE + ADMIN.
 *
 * Admin xem chung 1 list, filter theo role, drill-down vào từng người.
 */

export type AdminUserStatus = 'active' | 'suspended' | 'banned';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: RoleCode;
  status: AdminUserStatus;
  /** ID Owner (chỉ SALE có; null nếu SALE chưa được gán) */
  ownerId: string | null;
  /** Spec §26 — SALE scope: `owner` (thuộc chủ nhà) | `system` (Sale hệ thống, admin-grade) */
  scope: 'owner' | 'system' | null;
  /** Số booking đã tạo (cho mọi role — customer thì là booking đã đặt) */
  bookingCount: number;
  /** Số property sở hữu (chỉ OWNER) */
  propertyCount: number;
  /** Số dispute liên quan */
  disputeCount: number;
  /** KYC status (chỉ OWNER) */
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  /** ADMIN cấp quyền bỏ qua KYC (chỉ OWNER) — tạo phòng không cần KYC approved */
  kycBypass: boolean;
  /** Bucket gói (coarse, chỉ OWNER) — dùng cho màu/badge nội bộ. */
  subscriptionPlan: 'free' | 'basic' | 'standard' | 'pro' | null;
  /**
   * Id gói cước THẬT từ danh mục (`rooms_5`, `enterprise`...) — nguồn chuẩn để
   * hiển thị tên gói. `null` nếu chưa có gói. Dùng `planLabel()` để render.
   */
  subscriptionPlanId: string | null;
  createdAt: string;
  lastActiveAt: string | null;
}

export interface AdminUserFilters {
  role?: RoleCode;
  status?: AdminUserStatus;
  search?: string;
  ownerId?: string;
  kycStatus?: AdminUser['kycStatus'];
  /** Spec §26.3.2 — `GET /users?scope=` lọc SALE theo scope server-side */
  scope?: 'owner' | 'system' | 'all';
}

export interface BanUserInput {
  userId: string;
  reason: string;
}

export interface UnbanUserInput {
  userId: string;
}

export interface RevokeSessionInput {
  userId: string;
}

export interface UpdateSubscriptionInput {
  userId: string;
  plan: NonNullable<AdminUser['subscriptionPlan']>;
}

export interface UpdateRoleInput {
  userId: string;
  role: RoleCode;
}

/** Spec §2A.7 — ADMIN cấp/thu hồi quyền bỏ qua KYC cho OWNER. */
export interface SetKycBypassInput {
  userId: string;
  bypass: boolean;
}
