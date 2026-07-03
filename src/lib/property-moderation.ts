import type { ModerationStatus } from '@/core/entities/property';

/**
 * Nhãn + style hiển thị cho trạng thái duyệt cơ sở (spec §4.5).
 * Dùng chung giữa admin list, admin detail và host view → tránh drift.
 */

export const MODERATION_STATUS_LABEL: Record<ModerationStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
  suspended: 'Đã tạm ngưng',
};

export const MODERATION_STATUS_ICON: Record<ModerationStatus, string> = {
  pending: '⏳',
  approved: '✓',
  rejected: '✕',
  suspended: '🔒',
};

/** Variant của <Badge> tương ứng từng trạng thái. */
export const MODERATION_STATUS_VARIANT: Record<
  ModerationStatus,
  'warning' | 'success' | 'danger' | 'dark'
> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  suspended: 'dark',
};

/** Nhãn kèm icon, ví dụ "⏳ Chờ duyệt". */
export function moderationStatusLabel(status: ModerationStatus): string {
  return `${MODERATION_STATUS_ICON[status]} ${MODERATION_STATUS_LABEL[status]}`;
}
