import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listPropertiesAction } from '@/app/actions/properties';
import type { AdminPropertyRow } from '@/components/admin/admin-property-card';
import type { Property } from '@/core/entities/property';
import { isAdmin } from '@/core/value-objects/role';

/** Map Property → AdminPropertyRow rút gọn (giảm payload gửi client). */
function toRow(p: Property): AdminPropertyRow {
  return {
    id: p.id,
    name: p.name,
    code: p.code,
    type: p.type,
    address: p.address,
    ownerId: p.ownerId,
    ownerName: p.owner?.name ?? null,
    moderationStatus: p.moderationStatus,
    isActive: p.isActive,
    isHot: p.isHot,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    maxGuests: p.maxGuests,
    standardGuests: p.standardGuests,
    weekdayPrice: p.weekdayPrice,
    coverUrl:
      p.images.find((i) => i.isCover)?.imageUrl ?? p.images[0]?.imageUrl ?? null,
    bookingCount: p.bookingCount,
  };
}

/** BFF route (ADMIN) — toàn bộ cơ sở (row rút gọn); filter/sort phía client. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const result = await listPropertiesAction({ includeInactive: true });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data.map(toRow) });
}
