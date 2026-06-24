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
  /** Subscription status (chỉ OWNER) */
  subscriptionPlan: 'free' | 'basic' | 'standard' | 'pro' | null;
  createdAt: string;
  lastActiveAt: string | null;
}

export interface AdminUserFilters {
  role?: RoleCode;
  status?: AdminUserStatus;
  search?: string;
  ownerId?: string;
  kycStatus?: AdminUser['kycStatus'];
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
