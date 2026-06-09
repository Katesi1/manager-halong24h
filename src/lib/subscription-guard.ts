import 'server-only';

import type { Subscription } from '@/core/entities/subscription';

/**
 * Subscription đang ngăn chủ nhà tạo property / nhận booking mới hay không?
 *
 * Trả về null nếu OK; trả message tiếng Việt nếu bị chặn.
 *
 * Spec §10.5 — 7-state lifecycle. Rule:
 *  - frozen   → chặn (admin chủ động khoá vì vi phạm)
 *  - past_due → chặn (quá hạn renew)
 *  - expired  → chặn (hết hạn dứt khoát)
 *  - cancelled → chặn (user/admin huỷ)
 *  - none     → cho phép (free tier hoặc chưa từng có sub)
 *  - trial    → cho phép
 *  - active   → cho phép
 */
export function blockedReason(sub: Subscription | null): string | null {
  if (!sub) return null;
  const reason = sub.frozenReason ?? sub.note;
  if (sub.status === 'frozen') {
    return reason
      ? `Tài khoản bị tạm khoá: ${reason}`
      : 'Tài khoản đang bị tạm khoá. Liên hệ admin Halong24h để mở khoá.';
  }
  if (sub.status === 'past_due') {
    const dateStr = sub.expireAt ? sub.expireAt.slice(0, 10) : 'kỳ trước';
    return `Gói cước đã quá hạn ngày ${dateStr}. Vui lòng thanh toán để tiếp tục sử dụng.`;
  }
  if (sub.status === 'expired') {
    return 'Gói cước đã hết hạn. Vui lòng mua lại để tiếp tục sử dụng.';
  }
  if (sub.status === 'cancelled') {
    return 'Gói cước đã bị huỷ. Vui lòng kích hoạt lại.';
  }
  return null;
}
