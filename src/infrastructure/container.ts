import 'server-only';

import type { AuditLogRepository } from '@/application/ports/audit-log-repository';
import type { AuthRepository } from '@/application/ports/auth-repository';
import type { BookingRepository } from '@/application/ports/booking-repository';
import type { CalendarRepository } from '@/application/ports/calendar-repository';
import type { ChatRepository } from '@/application/ports/chat-repository';
import type { DashboardRepository } from '@/application/ports/dashboard-repository';
import type { DisputeRepository } from '@/application/ports/dispute-repository';
import type { NotificationRepository } from '@/application/ports/notification-repository';
import type { PropertyRepository } from '@/application/ports/property-repository';
import type { ReviewRepository } from '@/application/ports/review-repository';
import type { SubscriptionRepository } from '@/application/ports/subscription-repository';
import type { AdminUserRepository } from '@/application/ports/admin-user-repository';
import type { KycAdminRepository } from '@/application/ports/kyc-admin-repository';
import type { KycRepository } from '@/application/ports/kyc-repository';
import type { LeadRepository } from '@/application/ports/lead-repository';
import type { PermissionRepository } from '@/application/ports/permission-repository';
import type { StaffRepository } from '@/application/ports/staff-repository';

import { ApiAdminUserRepository } from './repositories/api-admin-user-repository';
import { ApiAuditLogRepository } from './repositories/api-audit-log-repository';
import { ApiAuthRepository } from './repositories/api-auth-repository';
import { ApiBookingRepository } from './repositories/api-booking-repository';
import { ApiCalendarRepository } from './repositories/api-calendar-repository';
import { ApiChatRepository } from './repositories/api-chat-repository';
import { ApiDisputeRepository } from './repositories/api-dispute-repository';
import { ApiDashboardRepository } from './repositories/api-dashboard-repository';
import { ApiKycAdminRepository } from './repositories/api-kyc-admin-repository';
import { ApiKycRepository } from './repositories/api-kyc-repository';
import { ApiLeadRepository } from './repositories/api-lead-repository';
import { ApiPermissionRepository } from './repositories/api-permission-repository';
import { ApiNotificationRepository } from './repositories/api-notification-repository';
import { ApiPropertyRepository } from './repositories/api-property-repository';
import { ApiReviewRepository } from './repositories/api-review-repository';
import { ApiStaffRepository } from './repositories/api-staff-repository';
import { ApiSubscriptionRepository } from './repositories/api-subscription-repository';
import { MockAdminUserRepository } from './mocks/mock-admin-user-repository';
import { MockAuditLogRepository } from './mocks/mock-audit-log-repository';
import { MockBookingRepository } from './mocks/mock-booking-repository';
import { MockCalendarRepository } from './mocks/mock-calendar-repository';
import { MockDisputeRepository } from './mocks/mock-dispute-repository';
import { MockKycAdminRepository } from './mocks/mock-kyc-admin-repository';
import { MockKycRepository } from './mocks/mock-kyc-repository';
import { MockLeadRepository } from './mocks/mock-lead-repository';
import { MockPropertyRepository } from './mocks/mock-property-repository';
import { MockReviewRepository } from './mocks/mock-review-repository';
import { MockSubscriptionRepository } from './mocks/mock-subscription-repository';
import { MockStaffRepository } from './mocks/mock-staff-repository';

/**
 * Container — chọn implementation cho mỗi port dựa trên env.
 *
 * Quy ước: module nào có endpoint thật trên BE thì mặc định = `api`.
 * Override bằng env: `NEXT_PUBLIC_DATA_MODE_<MODULE>=mock|api`.
 *
 * Trạng thái BE (verified bằng curl):
 *   ✅ /auth/*          → ApiAuthRepository
 *   ✅ /properties/*    → ApiPropertyRepository
 *   ✅ /dashboard/stats → ApiDashboardRepository
 *   ✅ /reports         → ApiDashboardRepository.getReports
 *   ✅ /bookings (GET)  → ApiBookingRepository
 *   ✅ /notifications/* → ApiNotificationRepository
 *   ❌ /payments, /disputes, /calendar — chưa có
 */
type Mode = 'api' | 'mock';

function modeFor(envKey: string, defaultMode: Mode): Mode {
  const v = process.env[envKey]?.toLowerCase();
  return v === 'api' || v === 'mock' ? v : defaultMode;
}

export function authRepository(): AuthRepository {
  return new ApiAuthRepository();
}

export function propertyRepository(): PropertyRepository {
  return modeFor('NEXT_PUBLIC_DATA_MODE_PROPERTIES', 'api') === 'mock'
    ? new MockPropertyRepository()
    : new ApiPropertyRepository();
}

export function dashboardRepository(): DashboardRepository {
  return new ApiDashboardRepository();
}

export function bookingRepository(): BookingRepository {
  return modeFor('NEXT_PUBLIC_DATA_MODE_BOOKINGS', 'api') === 'mock'
    ? new MockBookingRepository()
    : new ApiBookingRepository();
}

export function notificationRepository(): NotificationRepository {
  return new ApiNotificationRepository();
}

export function disputeRepository(): DisputeRepository {
  // Spec §13 — /disputes + /admin/disputes/* live. Extended fields (evidence/
  // chatExcerpt/verdict/penalty) BE defer v2 → repo trả [] hoặc null.
  return modeFor('NEXT_PUBLIC_DATA_MODE_DISPUTES', 'api') === 'mock'
    ? new MockDisputeRepository()
    : new ApiDisputeRepository();
}

export function calendarRepository(): CalendarRepository {
  // Spec §6 — /calendar/* live. Default = api.
  return modeFor('NEXT_PUBLIC_DATA_MODE_CALENDAR', 'api') === 'mock'
    ? new MockCalendarRepository()
    : new ApiCalendarRepository();
}

export function staffRepository(): StaffRepository {
  return modeFor('NEXT_PUBLIC_DATA_MODE_STAFF', 'api') === 'mock'
    ? new MockStaffRepository()
    : new ApiStaffRepository();
}

export function kycRepository(): KycRepository {
  return modeFor('NEXT_PUBLIC_DATA_MODE_KYC', 'api') === 'mock'
    ? new MockKycRepository()
    : new ApiKycRepository();
}

export function permissionRepository(): PermissionRepository {
  // Spec §12 — /permissions/:userId live. Default = api, hiện không có Mock impl.
  // Env `NEXT_PUBLIC_DATA_MODE_PERMISSIONS=mock` chưa support — luôn dùng api.
  return new ApiPermissionRepository();
}

export function chatRepository(): ChatRepository {
  // Spec §17 — /conversations/* live (REST). Default = api, chưa có Mock impl.
  return new ApiChatRepository();
}

let leadSingleton: LeadRepository | null = null;
export function leadRepository(): LeadRepository {
  // Spec §15 — /leads live (POST public + GET auth).
  if (modeFor('NEXT_PUBLIC_DATA_MODE_LEADS', 'api') === 'mock') {
    if (!leadSingleton) leadSingleton = new MockLeadRepository();
    return leadSingleton;
  }
  return new ApiLeadRepository();
}

export function kycAdminRepository(): KycAdminRepository {
  // Spec §9.2 — `/admin/kyc/*` live. 4-state (none/pending/approved/rejected).
  // FE entity 8-state map xuống subset. Verification fields[] BE chưa expose
  // → trả mảng rỗng, UI section sẽ blank đợi v2.
  return modeFor('NEXT_PUBLIC_DATA_MODE_KYC_ADMIN', 'api') === 'mock'
    ? new MockKycAdminRepository()
    : new ApiKycAdminRepository();
}

export function adminUserRepository(): AdminUserRepository {
  // Spec §3 + v1.3 §22 A2 — `/users?withStats=true` cung cấp propertyCount +
  // bookingCount. `disputeCount` + `lastActiveAt` BE chưa expose → default.
  return modeFor('NEXT_PUBLIC_DATA_MODE_ADMIN_USERS', 'api') === 'mock'
    ? new MockAdminUserRepository()
    : new ApiAdminUserRepository();
}

let subscriptionSingleton: SubscriptionRepository | null = null;
export function subscriptionRepository(): SubscriptionRepository {
  // Spec §10 — `/admin/subscriptions/*` + `/subscriptions/me` live.
  // Default = mock vì BE identify theo userId, port hiện dùng subscriptionId
  // (giả định 1-1). Khi verify end-to-end OK, đổi default sang 'api'.
  if (modeFor('NEXT_PUBLIC_DATA_MODE_SUBSCRIPTIONS', 'mock') === 'api') {
    return new ApiSubscriptionRepository();
  }
  if (!subscriptionSingleton) {
    subscriptionSingleton = new MockSubscriptionRepository();
  }
  return subscriptionSingleton;
}

let reviewSingleton: ReviewRepository | null = null;
export function reviewRepository(): ReviewRepository {
  // Spec §7 — /admin/reviews + /properties/:id/reviews live. Default = api.
  if (modeFor('NEXT_PUBLIC_DATA_MODE_REVIEWS', 'api') === 'mock') {
    if (!reviewSingleton) reviewSingleton = new MockReviewRepository();
    return reviewSingleton;
  }
  return new ApiReviewRepository();
}

let auditLogSingleton: AuditLogRepository | null = null;
export function auditLogRepository(): AuditLogRepository {
  // Spec §14 — BE tự ghi, FE chỉ đọc. Default = api.
  if (modeFor('NEXT_PUBLIC_DATA_MODE_AUDIT_LOG', 'api') === 'mock') {
    if (!auditLogSingleton) auditLogSingleton = new MockAuditLogRepository();
    return auditLogSingleton;
  }
  return new ApiAuditLogRepository();
}
