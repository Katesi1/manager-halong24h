import 'server-only';

import type { Subscription } from '@/core/entities/subscription';

/**
 * Subscription đang ngăn chủ nhà tạo property / nhận booking mới hay không?
 *
 * Trả về null nếu OK; trả message tiếng Việt nếu bị chặn.
 *
 * Spec §10.5 — 7-state lifecycle + v1.12 entitlement (§2A.5). Rule:
 *  - frozen   → chặn (admin chủ động khoá vì vi phạm)
 *  - past_due → chặn (quá hạn renew)
 *  - expired  → chặn (hết hạn dứt khoát)
 *  - cancelled → chặn (user/admin huỷ)
 *  - trial    → cho phép NẾU trialEndsAt > now; hết trial → chặn (BE trả
 *               403 `subscription.featureLocked`)
 *  - none     → cho phép (free tier hoặc chưa từng có sub)
 *  - active   → cho phép
 *
 * Note: nguồn tin cậy nhất cho gate v1.12 là profile (`GET /auth/profile`) —
 * xem `ownerEntitlement()` trong `lib/entitlement.ts`. Hàm này dùng cho luồng
 * hiển thị dựa trên `Subscription` entity (trang billing/subscription).
 */
export function blockedReason(sub: Subscription | null): string | null {
  if (!sub) return null;
  const reason = sub.frozenReason ?? sub.note;
  if (sub.status === 'trial') {
    const trialEnds = sub.trialEndsAt
      ? new Date(sub.trialEndsAt).getTime()
      : null;
    if (trialEnds !== null && trialEnds <= Date.now()) {
      return 'Thời gian dùng thử đã kết thúc. Vui lòng đăng ký gói để tiếp tục sử dụng.';
    }
    return null;
  }
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
