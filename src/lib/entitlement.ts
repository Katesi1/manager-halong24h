/**
 * Entitlement (Apple IAP compliance — BE v1.12, spec §2A.5).
 *
 * OWNER mới đăng ký được BE cấp trial ngầm 60 ngày (`subscriptionStatus="trial"`
 * + `trialEndsAt = now + 60d`). Trong trial, OWNER vẫn **bắt buộc hoàn tất KYC**
 * mới đăng được phòng. Hết trial mà chưa thanh toán → BE trả 403 với message
 * generic `subscription.featureLocked` ở: `POST /properties`, `PUT /properties/:id`,
 * `POST /staff/invites`.
 *
 * BE pass entitlement khi thoả MỘT trong:
 *   - kycBypass = true (ADMIN cấp tay), HOẶC
 *   - subscriptionStatus = "active", HOẶC
 *   - subscriptionStatus = "trial" và trialEndsAt > now.
 *
 * File này client-safe (không import server-only) để form client dùng được
 * `isFeatureLockedError`.
 */
import type { UserProfile } from '@/core/entities/user';

/** Trang Web (giữ luồng thanh toán theo §4.4) để OWNER gia hạn / đăng ký gói. */
export const SUBSCRIPTION_SETTINGS_PATH = '/host/settings/subscription';

/**
 * Message generic BE trả khi entitlement không thoả (vi/en). BE cố tình KHÔNG
 * phân biệt nguyên nhân (hết trial / cancelled / past_due / frozen) — không có
 * error code riêng, nên FE nhận diện qua nội dung message.
 */
const FEATURE_LOCKED_PATTERNS = [
  'chưa có quyền dùng tính năng',
  'not authorized to use this feature',
];

/** Lỗi từ Server Action có phải `subscription.featureLocked` không. */
export function isFeatureLockedError(message?: string | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return FEATURE_LOCKED_PATTERNS.some((p) => m.includes(p));
}

const MS_PER_DAY = 86_400_000;

export interface OwnerEntitlement {
  /** BE sẽ cho phép thao tác write (tạo/sửa property, mời SALE) hay không. */
  entitled: boolean;
  /** Đang trong trial hợp lệ (web/Android được phép hiển thị countdown). */
  isTrial: boolean;
  /** Số ngày trial còn lại (làm tròn lên), null nếu không trial. */
  trialDaysLeft: number | null;
  /** Lý do bị chặn (tiếng Việt) — null nếu entitled. */
  blockReason: string | null;
}

type EntitlementProfile = Pick<
  UserProfile,
  'kycBypass' | 'subscriptionStatus' | 'trialEndsAt' | 'subscriptionFrozenReason'
>;

const ENTITLED: OwnerEntitlement = {
  entitled: true,
  isTrial: false,
  trialDaysLeft: null,
  blockReason: null,
};

/**
 * Suy ra trạng thái entitlement của OWNER từ profile (`GET /auth/profile`) —
 * nguồn tin cậy nhất, không phụ thuộc subscription repo (đang default mock).
 *
 * Lưu ý: chỉ áp dụng cho OWNER. SALE inherit entitlement của OWNER ở BE — FE
 * không tự suy ra cho SALE (profile SALE không mang sub của OWNER), để BE 403
 * + CTA ở form xử lý.
 *
 * Conservative: trạng thái `none`/`null` (legacy free-tier / chưa rõ) coi như
 * entitled để tránh banner báo nhầm; nếu BE thực sự chặn, 403 ở form sẽ bắt.
 */
export function ownerEntitlement(profile: EntitlementProfile): OwnerEntitlement {
  if (profile.kycBypass) return ENTITLED;
  if (profile.subscriptionStatus === 'active') return ENTITLED;

  if (profile.subscriptionStatus === 'trial') {
    const endsAt = profile.trialEndsAt
      ? new Date(profile.trialEndsAt).getTime()
      : 0;
    if (endsAt > Date.now()) {
      const daysLeft = Math.max(
        1,
        Math.ceil((endsAt - Date.now()) / MS_PER_DAY),
      );
      return { entitled: true, isTrial: true, trialDaysLeft: daysLeft, blockReason: null };
    }
    return {
      entitled: false,
      isTrial: false,
      trialDaysLeft: 0,
      blockReason:
        'Thời gian dùng thử 60 ngày đã kết thúc. Vui lòng đăng ký gói để tiếp tục đăng phòng và quản lý nhân viên.',
    };
  }

  const blocked = (blockReason: string): OwnerEntitlement => ({
    entitled: false,
    isTrial: false,
    trialDaysLeft: null,
    blockReason,
  });

  switch (profile.subscriptionStatus) {
    case 'frozen':
      return blocked(
        profile.subscriptionFrozenReason
          ? `Tài khoản đang bị tạm khoá: ${profile.subscriptionFrozenReason}`
          : 'Tài khoản đang bị tạm khoá. Vui lòng liên hệ Halong24h để mở khoá.',
      );
    case 'past_due':
      return blocked(
        'Gói cước đã quá hạn. Vui lòng thanh toán để tiếp tục sử dụng.',
      );
    case 'cancelled':
      return blocked('Gói cước đã bị huỷ. Vui lòng đăng ký lại để tiếp tục.');
    case 'expired':
      return blocked('Gói cước đã hết hạn. Vui lòng đăng ký lại để tiếp tục.');
    default:
      // 'none' | null — legacy free-tier / chưa xác định → không chặn ở FE.
      return ENTITLED;
  }
}
