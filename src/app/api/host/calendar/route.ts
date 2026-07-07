import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getCalendarGridAction } from '@/app/actions/calendar';
import { listPropertiesAction } from '@/app/actions/properties';
import { isManagerRole } from '@/core/value-objects/role';
import { addDays, todayISO } from '@/lib/format';

/** BFF route (host) — lịch phòng: grid + danh sách cơ sở (theo start/days/property). */
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const sp = new URL(request.url).searchParams;
  const start = sp.get('start') ?? todayISO();
  const daysParam = sp.get('days');
  const days = daysParam ? Math.min(31, Math.max(7, Number(daysParam))) : 14;
  const to = addDays(start, days - 1);
  const property = sp.get('property') ?? undefined;

  const [gridResult, propertiesResult] = await Promise.all([
    getCalendarGridAction({
      from: start,
      to,
      propertyIds: property ? [property] : undefined,
    }),
    listPropertiesAction({ includeInactive: true }),
  ]);

  return NextResponse.json({
    data: {
      grid: gridResult.ok ? gridResult.data : { from: start, to, properties: [] },
      gridError: gridResult.ok ? null : gridResult.error,
      ownedProperties: propertiesResult.ok
        ? propertiesResult.data.map((p) => ({ id: p.id, name: p.name }))
        : [],
    },
  });
}
