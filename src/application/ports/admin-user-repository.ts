import type {
  AdminUser,
  AdminUserFilters,
  BanUserInput,
  RevokeSessionInput,
  SetKycBypassInput,
  UnbanUserInput,
  UpdateRoleInput,
  UpdateSubscriptionInput,
} from '@/core/entities/admin-user';

export interface AdminUserRepository {
  list(filters?: AdminUserFilters): Promise<AdminUser[]>;
  getById(id: string): Promise<AdminUser | null>;
  ban(input: BanUserInput): Promise<AdminUser>;
  unban(input: UnbanUserInput): Promise<AdminUser>;
  /** Đổi vai trò người dùng (0=ADMIN, 1=OWNER, 2=SALE, 3=CUSTOMER) */
  updateRole(input: UpdateRoleInput): Promise<AdminUser>;
  /** Cấp/thu hồi quyền bỏ qua KYC cho OWNER (ADMIN-only) */
  setKycBypass(input: SetKycBypassInput): Promise<AdminUser>;
  /** Force logout — chỉ revoke active session, không ban */
  revokeSession(input: RevokeSessionInput): Promise<void>;
  /** Override subscription plan / miễn phí gói */
  updateSubscription(input: UpdateSubscriptionInput): Promise<AdminUser>;
  /** Reset password — gửi email reset, không lộ password mới */
  resetPassword(userId: string): Promise<void>;
}
