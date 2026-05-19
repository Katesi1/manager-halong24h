import 'server-only';

import type { AuditLogRepository } from '@/application/ports/audit-log-repository';
import type { AuthRepository } from '@/application/ports/auth-repository';
import type { BookingRepository } from '@/application/ports/booking-repository';
import type { CalendarRepository } from '@/application/ports/calendar-repository';
import type { DashboardRepository } from '@/application/ports/dashboard-repository';
import type { DisputeRepository } from '@/application/ports/dispute-repository';
import type { NotificationRepository } from '@/application/ports/notification-repository';
import type { PaymentRepository } from '@/application/ports/payment-repository';
import type { PropertyRepository } from '@/application/ports/property-repository';
import type { ReviewRepository } from '@/application/ports/review-repository';
import type { SubscriptionRepository } from '@/application/ports/subscription-repository';
import type { AdminUserRepository } from '@/application/ports/admin-user-repository';
import type { KycAdminRepository } from '@/application/ports/kyc-admin-repository';
import type { KycRepository } from '@/application/ports/kyc-repository';
import type { StaffRepository } from '@/application/ports/staff-repository';

import { ApiAuthRepository } from './repositories/api-auth-repository';
import { ApiBookingRepository } from './repositories/api-booking-repository';
import { ApiDashboardRepository } from './repositories/api-dashboard-repository';
import { ApiKycRepository } from './repositories/api-kyc-repository';
import { ApiNotificationRepository } from './repositories/api-notification-repository';
import { ApiPropertyRepository } from './repositories/api-property-repository';
import { ApiStaffRepository } from './repositories/api-staff-repository';
import { MockAdminUserRepository } from './mocks/mock-admin-user-repository';
import { MockAuditLogRepository } from './mocks/mock-audit-log-repository';
import { MockBookingRepository } from './mocks/mock-booking-repository';
import { MockCalendarRepository } from './mocks/mock-calendar-repository';
import { MockDisputeRepository } from './mocks/mock-dispute-repository';
import { MockKycAdminRepository } from './mocks/mock-kyc-admin-repository';
import { MockKycRepository } from './mocks/mock-kyc-repository';
import { MockPaymentRepository } from './mocks/mock-payment-repository';
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

export function paymentRepository(): PaymentRepository {
  // BE chưa có endpoint /payments
  void modeFor('NEXT_PUBLIC_DATA_MODE_PAYMENTS', 'mock');
  return new MockPaymentRepository();
}

export function disputeRepository(): DisputeRepository {
  // BE chưa có endpoint /disputes
  void modeFor('NEXT_PUBLIC_DATA_MODE_DISPUTES', 'mock');
  return new MockDisputeRepository();
}

export function calendarRepository(): CalendarRepository {
  // BE chưa có endpoint /calendar
  void modeFor('NEXT_PUBLIC_DATA_MODE_CALENDAR', 'mock');
  return new MockCalendarRepository();
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

export function kycAdminRepository(): KycAdminRepository {
  // BE /admin/kyc/* — chưa wire qua REST (mock cho UI development).
  // Khi BE ready, tạo ApiKycAdminRepository + switch.
  void modeFor('NEXT_PUBLIC_DATA_MODE_KYC_ADMIN', 'mock');
  return new MockKycAdminRepository();
}

export function adminUserRepository(): AdminUserRepository {
  // BE chưa có endpoint /admin/users — mock cho UI development.
  void modeFor('NEXT_PUBLIC_DATA_MODE_ADMIN_USERS', 'mock');
  return new MockAdminUserRepository();
}

let subscriptionSingleton: SubscriptionRepository | null = null;
export function subscriptionRepository(): SubscriptionRepository {
  // BE chưa có endpoint /admin/subscriptions — mock cho UI development.
  void modeFor('NEXT_PUBLIC_DATA_MODE_SUBSCRIPTIONS', 'mock');
  if (!subscriptionSingleton) {
    subscriptionSingleton = new MockSubscriptionRepository();
  }
  return subscriptionSingleton;
}

let reviewSingleton: ReviewRepository | null = null;
export function reviewRepository(): ReviewRepository {
  // BE chưa có endpoint /reviews — mock cho UI development.
  void modeFor('NEXT_PUBLIC_DATA_MODE_REVIEWS', 'mock');
  if (!reviewSingleton) reviewSingleton = new MockReviewRepository();
  return reviewSingleton;
}

let auditLogSingleton: AuditLogRepository | null = null;
export function auditLogRepository(): AuditLogRepository {
  // BE chưa có endpoint /admin/audit-log — mock cho UI development.
  // Singleton để in-memory store giữ giữa các request (vẫn reset khi server restart).
  void modeFor('NEXT_PUBLIC_DATA_MODE_AUDIT_LOG', 'mock');
  if (!auditLogSingleton) auditLogSingleton = new MockAuditLogRepository();
  return auditLogSingleton;
}
