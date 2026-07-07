import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listAdminUsersAction } from '@/app/actions/admin-users';
import { listBookingsAction } from '@/app/actions/bookings';
import { getDashboardStatsAction } from '@/app/actions/dashboard';
import { countActiveDisputesAction } from '@/app/actions/disputes';
import { countPendingKycAdminAction } from '@/app/actions/kyc-admin';
import { listPropertiesAction } from '@/app/actions/properties';
import { sumPaidSubscriptionsAction } from '@/app/actions/subscriptions';
import { RoleCode, isAdmin } from '@/core/value-objects/role';

function currentMonthRange(now: Date): { from: string; to: string } {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
  return { from: from.toISOString(), to: to.toISOString() };
}

/** BFF route (ADMIN) — tổng quan hệ thống (7 nguồn, tính sẵn số liệu). */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const { from, to } = currentMonthRange(new Date());
  const [
    statsResult,
    propertiesResult,
    bookingsResult,
    kycCountResult,
    usersResult,
    activeDisputesResult,
    monthlyPaidResult,
  ] = await Promise.all([
    getDashboardStatsAction(),
    listPropertiesAction({ includeInactive: true }),
    listBookingsAction(),
    countPendingKycAdminAction(),
    listAdminUsersAction(),
    countActiveDisputesAction(),
    sumPaidSubscriptionsAction(from, to),
  ]);

  const stats = statsResult.ok
    ? statsResult.data
    : { thisMonthBookings: 0, totalBookings: 0 };
  const properties = propertiesResult.ok ? propertiesResult.data : [];
  const bookings = bookingsResult.ok ? bookingsResult.data : [];
  const users = usersResult.ok ? usersResult.data : [];

  return NextResponse.json({
    data: {
      monthlySubscriptionRevenue: monthlyPaidResult.ok
        ? monthlyPaidResult.data
        : 0,
      thisMonthBookings: stats.thisMonthBookings,
      totalBookings: stats.totalBookings,
      totalOwners: users.filter((u) => u.role === RoleCode.OWNER).length,
      totalCustomers: users.filter((u) => u.role === RoleCode.CUSTOMER).length,
      totalSales: users.filter((u) => u.role === RoleCode.SALE).length,
      bannedUsers: users.filter((u) => u.status === 'banned').length,
      propertyCount: properties.length,
      activePropertyCount: properties.filter((p) => p.isActive).length,
      pendingPropertiesCount: properties.filter(
        (p) => p.moderationStatus === 'pending',
      ).length,
      kycPendingCount: kycCountResult.ok ? kycCountResult.data : 0,
      activeDisputes: activeDisputesResult.ok ? activeDisputesResult.data : 0,
      topProperties: properties.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name,
        ownerId: p.ownerId,
        code: p.code,
        address: p.address,
      })),
      recentBookings: bookings.slice(0, 5).map((b) => ({
        id: b.id,
        guestName: b.guestName,
        propertyName: b.propertyName,
        createdAt: b.createdAt,
        totalPrice: b.totalPrice,
      })),
    },
  });
}
