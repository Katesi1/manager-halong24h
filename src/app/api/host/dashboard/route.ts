import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listBookingsAction } from '@/app/actions/bookings';
import {
  getDashboardReportsAction,
  getDashboardStatsAction,
} from '@/app/actions/dashboard';
import { listPropertiesAction } from '@/app/actions/properties';
import { isManagerRole } from '@/core/value-objects/role';

const FALLBACK_STATS = {
  totalRooms: 0,
  activeRooms: 0,
  emptyRooms: 0,
  occupiedRooms: 0,
  globalTotalRooms: 0,
  globalEmptyRooms: 0,
  checkoutToday: 0,
  totalBookings: 0,
  thisMonthBookings: 0,
  monthlyRevenue: null as number | null,
  todayRevenue: null as number | null,
};

/** BFF route (host) — dashboard: stats + bookings + report + số phòng. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const [statsResult, bookingsResult, propertiesResult, reportsResult] =
    await Promise.all([
      getDashboardStatsAction(),
      listBookingsAction(),
      listPropertiesAction({ includeInactive: true }),
      getDashboardReportsAction({ period: 'month' }),
    ]);

  return NextResponse.json({
    data: {
      profile: {
        role: profile.role,
        name: profile.name,
        email: profile.email,
        kycStatus: profile.kycStatus,
        kycBypass: profile.kycBypass,
      },
      stats: statsResult.ok ? statsResult.data : FALLBACK_STATS,
      statsError: statsResult.ok ? null : statsResult.error,
      bookings: bookingsResult.ok ? bookingsResult.data : [],
      propertyCount: propertiesResult.ok ? propertiesResult.data.length : 0,
      report: reportsResult.ok ? reportsResult.data : null,
    },
  });
}
