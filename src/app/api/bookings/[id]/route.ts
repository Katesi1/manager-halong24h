import { NextResponse } from 'next/server';

import { getBookingAction } from '@/app/actions/bookings';
import { getCurrentProfile } from '@/app/actions/auth';
import { getPropertyAction } from '@/app/actions/properties';
import { isManagerRole } from '@/core/value-objects/role';
import { estimateBookingTotal } from '@/lib/booking-display';

/**
 * BFF route — chi tiết booking. Tính sẵn `estimatedTotal` server-side (cần cả
 * property khi đơn HOLD/CONFIRMED chưa chốt giá) để client chỉ render.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { id } = await params;
  const result = await getBookingAction(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  if (!result.data) {
    return NextResponse.json({ error: 'Không tìm thấy đặt phòng' }, { status: 404 });
  }
  const booking = result.data;

  let estimatedTotal: number | null = null;
  if (
    booking.totalPrice == null &&
    (booking.status === 'hold' || booking.status === 'confirmed')
  ) {
    const propResult = await getPropertyAction(booking.propertyId);
    if (propResult.ok && propResult.data) {
      estimatedTotal = estimateBookingTotal(
        propResult.data,
        booking.checkInAt,
        booking.checkOutAt,
      );
    }
  }

  return NextResponse.json({ data: { booking, estimatedTotal } });
}
