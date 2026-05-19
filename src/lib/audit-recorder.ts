import 'server-only';

import { recordAuditEntryUseCase } from '@/application/audit-log/actions';
import type {
  AuditAction,
  AuditTarget,
} from '@/core/entities/audit-log';
import type { UserProfile } from '@/core/entities/user';
import { auditLogRepository } from '@/infrastructure/container';

/**
 * Ghi audit log từ Server Action.
 *
 * Best-effort: nếu ghi log fail, KHÔNG throw — action chính đã thành công.
 * Lý do: audit log là chứng cứ phụ; không được làm hỏng action chính nếu mock
 * crash. Sau này khi BE thật ra, có thể đổi sang strict mode (throw).
 *
 * Pattern dùng:
 * ```ts
 * const profile = await requireAdmin();
 * // ... do the action ...
 * await recordAudit(profile, 'kyc_approve', {
 *   type: 'kyc', id: submission.id, label: `Hồ sơ ${submission.userName}`,
 * }, reason);
 * ```
 */
export async function recordAudit(
  actor: UserProfile,
  action: AuditAction,
  target: AuditTarget,
  reason?: string | null,
): Promise<void> {
  try {
    await recordAuditEntryUseCase(auditLogRepository(), {
      actor: { id: actor.id, name: actor.name || actor.email || 'Quản trị viên' },
      action,
      target,
      reason: reason ?? null,
    });
  } catch (err) {
    console.error('[audit] failed to record', { action, target, err });
  }
}
