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

/** N tháng gần nhất (cũ→mới), gồm tháng hiện tại. Dùng cho trend doanh thu. */
function lastMonthRanges(
  now: Date,
  count: number,
): { label: string; from: string; to: string }[] {
  const out: { label: string; from: string; to: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const to = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0, 23, 59, 59, 999),
    );
    out.push({
      label: `T${from.getUTCMonth() + 1}`,
      from: from.toISOString(),
      to: to.toISOString(),
    });
  }
  return out;
}

/** BFF route (ADMIN) — tổng quan hệ thống (7 nguồn, tính sẵn số liệu). */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const monthRanges = lastMonthRanges(new Date(), 6);
  // Chạy song song 2 làn: dữ liệu tổng quan + 6 tháng doanh thu subscription.
  const corePromise = Promise.all([
    getDashboardStatsAction(),
    listPropertiesAction({ includeInactive: true }),
    listBookingsAction(),
    countPendingKycAdminAction(),
    listAdminUsersAction(),
    countActiveDisputesAction(),
  ]);
  const revenuePromise = Promise.all(
    monthRanges.map((r) => sumPaidSubscriptionsAction(r.from, r.to)),
  );
  const [
    statsResult,
    propertiesResult,
    bookingsResult,
    kycCountResult,
    usersResult,
    activeDisputesResult,
  ] = await corePromise;
  const revenueMonthly = await revenuePromise;

  // Trend 6 tháng (số thật). Tháng cuối = tháng hiện tại → dùng luôn cho card.
  const subscriptionRevenue6m = monthRanges.map((r, i) => {
    const res = revenueMonthly[i];
    return { month: r.label, revenue: res && res.ok ? res.data : 0 };
  });
  const monthlySubscriptionRevenue =
    subscriptionRevenue6m[subscriptionRevenue6m.length - 1]?.revenue ?? 0;

  const stats = statsResult.ok
    ? statsResult.data
    : { thisMonthBookings: 0, totalBookings: 0 };
  const properties = propertiesResult.ok ? propertiesResult.data : [];
  const bookings = bookingsResult.ok ? bookingsResult.data : [];
  const users = usersResult.ok ? usersResult.data : [];

  return NextResponse.json({
    data: {
      monthlySubscriptionRevenue,
      subscriptionRevenue6m,
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
