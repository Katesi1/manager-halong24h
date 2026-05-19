import type {
  AdminUser,
  AdminUserFilters,
  BanUserInput,
  RevokeSessionInput,
  UnbanUserInput,
  UpdateSubscriptionInput,
} from '@/core/entities/admin-user';

export interface AdminUserRepository {
  list(filters?: AdminUserFilters): Promise<AdminUser[]>;
  getById(id: string): Promise<AdminUser | null>;
  ban(input: BanUserInput): Promise<AdminUser>;
  unban(input: UnbanUserInput): Promise<AdminUser>;
  /** Force logout — chỉ revoke active session, không ban */
  revokeSession(input: RevokeSessionInput): Promise<void>;
  /** Override subscription plan / miễn phí gói */
  updateSubscription(input: UpdateSubscriptionInput): Promise<AdminUser>;
  /** Reset password — gửi email reset, không lộ password mới */
  resetPassword(userId: string): Promise<void>;
}
