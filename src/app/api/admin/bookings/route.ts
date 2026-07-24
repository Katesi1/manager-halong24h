import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listBookingsAction } from '@/app/actions/bookings';
import { listPropertiesAction } from '@/app/actions/properties';
import { isAdmin } from '@/core/value-objects/role';

/** BFF route (ADMIN) — client fetch toàn bộ booking; stats/filter phía client. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const [bookingsResult, propertiesResult] = await Promise.all([
    listBookingsAction(),
    listPropertiesAction({ includeInactive: true }),
  ]);

  if (!bookingsResult.ok) {
    return NextResponse.json({ error: bookingsResult.error }, { status: 502 });
  }

  const bookings = bookingsResult.data;
  const properties = propertiesResult.ok ? propertiesResult.data : [];

  // Create a map of propertyId -> ownerId
  const propertyOwnerMap = new Map<string, string>();
  for (const p of properties) {
    propertyOwnerMap.set(p.id, p.ownerId);
  }

  // Enrich bookings with ownerId
  const enrichedBookings = bookings.map((b) => ({
    ...b,
    ownerId: propertyOwnerMap.get(b.propertyId) ?? null,
  }));

  return NextResponse.json({ data: enrichedBookings });
}
