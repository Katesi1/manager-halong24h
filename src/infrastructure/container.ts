import 'server-only';

import type { AuditLogRepository } from '@/application/ports/audit-log-repository';
import type { AuthRepository } from '@/application/ports/auth-repository';
import type { BankAccountRepository } from '@/application/ports/bank-account-repository';
import type { BillingPlanRepository } from '@/application/ports/billing-plan-repository';
import type { BookingRepository } from '@/application/ports/booking-repository';
import type { CalendarRepository } from '@/application/ports/calendar-repository';
import type { ChatRepository } from '@/application/ports/chat-repository';
import type { DashboardRepository } from '@/application/ports/dashboard-repository';
import type { DisputeRepository } from '@/application/ports/dispute-repository';
import type { GuestRepository } from '@/application/ports/guest-repository';
import type { NotificationRepository } from '@/application/ports/notification-repository';
import type { PaymentSessionRepository } from '@/application/ports/payment-session-repository';
import type { PlatformBankRepository } from '@/application/ports/platform-bank-repository';
import type { PropertyRepository } from '@/application/ports/property-repository';
import type { ReviewRepository } from '@/application/ports/review-repository';
import type { SubscriptionRepository } from '@/application/ports/subscription-repository';
import type { AdminUserRepository } from '@/application/ports/admin-user-repository';
import type { KycAdminRepository } from '@/application/ports/kyc-admin-repository';
import type { KycRepository } from '@/application/ports/kyc-repository';
import type { LeadRepository } from '@/application/ports/lead-repository';
import type { PermissionRepository } from '@/application/ports/permission-repository';
import type { StaffRepository } from '@/application/ports/staff-repository';
import type { SystemStaffRepository } from '@/application/ports/system-staff-repository';

import { ApiAdminUserRepository } from './repositories/api-admin-user-repository';
import { ApiAuditLogRepository } from './repositories/api-audit-log-repository';
import { ApiAuthRepository } from './repositories/api-auth-repository';
import { ApiBankAccountRepository } from './repositories/api-bank-account-repository';
import { ApiBillingPlanRepository } from './repositories/api-billing-plan-repository';
import { ApiBookingRepository } from './repositories/api-booking-repository';
import { ApiCalendarRepository } from './repositories/api-calendar-repository';
import { ApiChatRepository } from './repositories/api-chat-repository';
import { ApiDisputeRepository } from './repositories/api-dispute-repository';
import { ApiDashboardRepository } from './repositories/api-dashboard-repository';
import { ApiGuestRepository } from './repositories/api-guest-repository';
import { ApiKycAdminRepository } from './repositories/api-kyc-admin-repository';
import { ApiKycRepository } from './repositories/api-kyc-repository';
import { ApiLeadRepository } from './repositories/api-lead-repository';
import { ApiPermissionRepository } from './repositories/api-permission-repository';
import { ApiNotificationRepository } from './repositories/api-notification-repository';
import { ApiPaymentSessionRepository } from './repositories/api-payment-session-repository';
import { ApiPlatformBankRepository } from './repositories/api-platform-bank-repository';
import { ApiPropertyRepository } from './repositories/api-property-repository';
import { ApiReviewRepository } from './repositories/api-review-repository';
import { ApiStaffRepository } from './repositories/api-staff-repository';
import { ApiSubscriptionRepository } from './repositories/api-subscription-repository';
import { ApiSystemStaffRepository } from './repositories/api-system-staff-repository';

/**
 * Container — resolve mỗi port về implementation REST API thật.
 *
 * Dự án thật: mọi module dùng API trên `http://api.halong24h.com`.
 * Lớp Mock đã được loại bỏ hoàn toàn (không còn swap api/mock qua env).
 */
export function authRepository(): AuthRepository {
  return new ApiAuthRepository();
}

export function propertyRepository(): PropertyRepository {
  return new ApiPropertyRepository();
}

export function bankAccountRepository(): BankAccountRepository {
  // Spec §3.3 (v1.21) — `/users/me/bank` (OWNER) + `/admin/bank-accounts` +
  // `/admin/users/:id/bank/(approve|reject)` (ADMIN). Luồng duyệt STK nhận tiền.
  return new ApiBankAccountRepository();
}

export function dashboardRepository(): DashboardRepository {
  return new ApiDashboardRepository();
}

export function billingPlanRepository(): BillingPlanRepository {
  // Spec §10.1 — `GET /billing/plans` public, không cần auth.
  return new ApiBillingPlanRepository();
}

export function bookingRepository(): BookingRepository {
  return new ApiBookingRepository();
}

export function notificationRepository(): NotificationRepository {
  return new ApiNotificationRepository();
}

export function paymentSessionRepository(): PaymentSessionRepository {
  // Spec v1.6 §10.3 — /admin/payments live (manual reconcile flow).
  return new ApiPaymentSessionRepository();
}

export function platformBankRepository(): PlatformBankRepository {
  // Spec §10.7 (v1.21) — STK nền tảng nhận tiền mua gói. ADMIN sửa trực tiếp,
  // không có luồng duyệt (khác STK cọc OWNER §3.3).
  return new ApiPlatformBankRepository();
}

export function disputeRepository(): DisputeRepository {
  // Spec §13 — /disputes + /admin/disputes/* live. Extended fields (evidence/
  // chatExcerpt/verdict/penalty) BE defer v2 → repo trả [] hoặc null.
  return new ApiDisputeRepository();
}

export function calendarRepository(): CalendarRepository {
  // Spec §6 — /calendar/* live.
  return new ApiCalendarRepository();
}

export function staffRepository(): StaffRepository {
  return new ApiStaffRepository();
}

export function systemStaffRepository(): SystemStaffRepository {
  // Spec §26.3 — /admin/system-staff/* live (System SALE admin-grade).
  return new ApiSystemStaffRepository();
}

export function kycRepository(): KycRepository {
  return new ApiKycRepository();
}

export function permissionRepository(): PermissionRepository {
  // Spec §12 — /permissions/:userId live.
  return new ApiPermissionRepository();
}

export function chatRepository(): ChatRepository {
  // Spec §17 — /conversations/* live (REST).
  return new ApiChatRepository();
}

export function leadRepository(): LeadRepository {
  // Spec §15 — /leads live (POST public + GET auth).
  return new ApiLeadRepository();
}

export function guestRepository(): GuestRepository {
  // GET /guests + /guests/:id live (Auth ADMIN/OWNER/SALE).
  return new ApiGuestRepository();
}

export function kycAdminRepository(): KycAdminRepository {
  // Spec §9.2 — `/admin/kyc/*` live. 4-state (none/pending/approved/rejected),
  // FE entity 8-state map xuống subset. Chi tiết `GET /admin/kyc/:id` trả đủ
  // 3 ảnh upload + checklist 7 yếu tố xác minh (`verificationFields[]`) +
  // danh sách thanh toán → trang `/admin/kyc/:id` dùng `getDetail()`.
  return new ApiKycAdminRepository();
}

export function adminUserRepository(): AdminUserRepository {
  // `/users?withStats=true` cung cấp propertyCount + bookingCount +
  // stats.disputeCount + lastActiveAt (null nếu user chỉ dùng web).
  return new ApiAdminUserRepository();
}

export function subscriptionRepository(): SubscriptionRepository {
  // Spec §10 — `/admin/subscriptions/*` + `/subscriptions/me` live.
  // Response là user-level (§A4), mapper trong ApiSubscriptionRepository khớp
  // shape thật + treat Subscription.id === userId.
  return new ApiSubscriptionRepository();
}

export function reviewRepository(): ReviewRepository {
  // Spec §7 — /admin/reviews + /properties/:id/reviews live.
  return new ApiReviewRepository();
}

export function auditLogRepository(): AuditLogRepository {
  // Spec §14 — BE tự ghi, FE chỉ đọc.
  return new ApiAuditLogRepository();
}
