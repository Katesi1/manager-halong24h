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

export type AuditAction =
  | 'kyc_approve'
  | 'kyc_reject'
  | 'user_ban'
  | 'user_unban'
  | 'user_revoke_session'
  | 'user_reset_password'
  | 'user_change_plan'
  | 'user_change_role'
  | 'property_approve'
  | 'property_reject'
  | 'property_suspend'
  | 'dispute_resolve'
  | 'dispute_reject'
  | 'dispute_start_investigation'
  | 'review_hide';

export type AuditTargetType =
  | 'user'
  | 'property'
  | 'dispute'
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

export interface RecordAuditInput {
  actor: AuditActor;
  action: AuditAction;
  target: AuditTarget;
  reason?: string | null;
}

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  kyc_approve: '✓ Duyệt KYC',
  kyc_reject: '✕ Từ chối KYC',
  user_ban: '🚫 Chặn người dùng',
  user_unban: '🔓 Mở chặn người dùng',
  user_revoke_session: '🔌 Đăng xuất tất cả thiết bị',
  user_reset_password: '🔑 Gửi reset mật khẩu',
  user_change_plan: '💼 Đổi gói cước',
  user_change_role: '👤 Đổi vai trò người dùng',
  property_approve: '✓ Duyệt cơ sở',
  property_reject: '✕ Từ chối cơ sở',
  property_suspend: '🔒 Tạm khoá cơ sở',
  dispute_resolve: '⚖️ Giải quyết khiếu nại',
  dispute_reject: '✕ Bác khiếu nại',
  dispute_start_investigation: '🔍 Bắt đầu điều tra khiếu nại',
  review_hide: '🙈 Ẩn review',
};

export const AUDIT_TARGET_HREF: Record<AuditTargetType, (id: string) => string> = {
  user: (id) => `/admin/users/${id}`,
  property: (id) => `/admin/properties/${id}`,
  dispute: (id) => `/admin/disputes/${id}`,
  kyc: (id) => `/admin/kyc/${id}`,
  review: (id) => `/admin/users?q=${id}`,
};
