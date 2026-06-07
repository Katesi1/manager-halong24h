/**
 * Audit log — ghi lại mọi hành động quan trọng của admin.
 *
 * Mục đích:
 *  - Truy vết khi có khiếu nại (admin có thiên vị không?).
 *  - Đối chiếu khi BE/owner phản hồi "tôi không làm việc đó".
 *  - Compliance — sau này sẽ kiểm toán định kỳ.
 *
 * BE chưa có endpoint /admin/audit-log. Dùng MockAuditLogRepository
 * để demo + capture từ Server Action. Khi BE ready: tạo ApiAuditLogRepository
 * + switch trong container. UI không cần đổi.
 */

/**
 * Spec §14.1 action slugs (BE format: dot-separated).
 * FE chuẩn hoá về snake_case underscore.
 */
export type AuditAction =
  | 'kyc_approve'
  | 'kyc_reject'
  | 'user_ban'
  | 'user_unban'
  | 'user_revoke_sessions'
  | 'user_reset_password'
  | 'user_change_plan'
  | 'user_change_role'
  | 'user_delete'
  | 'user_kyc_bypass_toggle'
  | 'property_approve'
  | 'property_reject'
  | 'property_suspend'
  | 'dispute_resolve'
  | 'dispute_reject'
  | 'dispute_investigate'
  | 'review_hide'
  | 'review_restore'
  | 'booking_mark_paid'
  | 'subscription_trial_grant'
  | 'subscription_trial_revoke'
  | 'subscription_set_price'
  | 'subscription_mark_paid'
  | 'subscription_freeze'
  | 'subscription_unfreeze';

/** Backward-compatible alias (cũ: dispute_start_investigation, user_revoke_session). */
export const AUDIT_ACTION_LEGACY_ALIAS: Record<string, AuditAction> = {
  dispute_start_investigation: 'dispute_investigate',
  user_revoke_session: 'user_revoke_sessions',
};

export type AuditTargetType =
  | 'user'
  | 'property'
  | 'booking'
  | 'dispute'
  | 'subscription'
  | 'kyc'
  | 'review';

export interface AuditTarget {
  type: AuditTargetType;
  id: string;
  label: string;
}

export interface AuditActor {
  id: string;
  name: string;
}

export interface AuditEntry {
  id: string;
  actor: AuditActor;
  action: AuditAction;
  target: AuditTarget;
  reason: string | null;
  /** ISO timestamp */
  at: string;
}

export interface AuditFilters {
  actorId?: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
}

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  kyc_approve: '✓ Duyệt KYC',
  kyc_reject: '✕ Từ chối KYC',
  user_ban: '🚫 Chặn người dùng',
  user_unban: '🔓 Mở chặn người dùng',
  user_revoke_sessions: '🔌 Đăng xuất tất cả thiết bị',
  user_reset_password: '🔑 Gửi reset mật khẩu',
  user_change_plan: '💼 Đổi gói cước',
  user_change_role: '👤 Đổi vai trò người dùng',
  user_delete: '🗑️ Xoá người dùng',
  user_kyc_bypass_toggle: '⚙️ Bật/tắt bỏ qua KYC',
  property_approve: '✓ Duyệt cơ sở',
  property_reject: '✕ Từ chối cơ sở',
  property_suspend: '🔒 Tạm khoá cơ sở',
  dispute_resolve: '⚖️ Giải quyết khiếu nại',
  dispute_reject: '✕ Bác khiếu nại',
  dispute_investigate: '🔍 Bắt đầu điều tra khiếu nại',
  review_hide: '🙈 Ẩn review',
  review_restore: '↩️ Khôi phục review',
  booking_mark_paid: '💵 Xác nhận thu tiền booking',
  subscription_trial_grant: '🎁 Cấp trial',
  subscription_trial_revoke: '⛔ Thu hồi trial',
  subscription_set_price: '💲 Điều chỉnh giá',
  subscription_mark_paid: '✓ Xác nhận thanh toán',
  subscription_freeze: '❄️ Đóng băng subscription',
  subscription_unfreeze: '☀️ Mở đóng băng',
};

export const AUDIT_TARGET_HREF: Record<AuditTargetType, (id: string) => string> = {
  user: (id) => `/admin/users/${id}`,
  property: (id) => `/admin/properties/${id}`,
  booking: (id) => `/admin/bookings/${id}`,
  dispute: (id) => `/admin/disputes/${id}`,
  subscription: (id) => `/admin/users/${id}/subscription`,
  kyc: (id) => `/admin/kyc/${id}`,
  review: (id) => `/admin/users?q=${id}`,
};
