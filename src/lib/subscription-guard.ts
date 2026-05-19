import 'server-only';

import type { Subscription } from '@/core/entities/subscription';

/**
 * Subscription đang ngăn chủ nhà tạo property / nhận booking mới hay không?
 *
 * Trả về null nếu OK; trả message tiếng Việt nếu bị chặn.
 *
 * Rule:
 *  - frozen → chặn (admin đã chủ động khoá)
 *  - overdue → chặn (quá hạn renew)
 *  - pending → cho phép (đã gửi invoice nhưng chưa quá hạn)
 *  - paid → cho phép
 *  - null (chưa từng có sub) → cho phép (free tier, hệ thống auto-bill khi đủ phòng)
 */
export function blockedReason(sub: Subscription | null): string | null {
  if (!sub) return null;
  if (sub.status === 'frozen') {
    return sub.note
      ? `Tài khoản bị tạm khoá: ${sub.note}`
      : 'Tài khoản đang bị tạm khoá. Liên hệ admin Halong24h để mở khoá.';
  }
  if (sub.status === 'overdue') {
    return `Gói cước đã quá hạn ngày ${sub.expireAt.slice(0, 10)}. Vui lòng thanh toán để tiếp tục sử dụng.`;
  }
  return null;
}
