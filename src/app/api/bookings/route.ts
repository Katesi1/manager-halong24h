import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listBookingsUseCase } from '@/application/bookings/list';
import type { BookingStatus } from '@/core/entities/booking';
import { isManagerRole } from '@/core/value-objects/role';
import { bookingRepository } from '@/infrastructure/container';

/**
 * BFF route — cho phép client fetch danh sách booking mà endpoint hiện trong
 * F12 Network (giống pattern client-fetch). Token BE KHÔNG lộ ra client: route
 * chạy server-side, use case tự đính `Authorization` từ cookie httpOnly rồi gọi
 * `api.halong24h.com`. Trình duyệt chỉ thấy `/api/bookings?status=…` cùng origin.
 */

const VALID_STATUS: BookingStatus[] = [
  'hold',
  'confirmed',
  'paid',
  'cancelled',
  'completed',
  'no_show',
];

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const statusParam = new URL(request.url).searchParams.get('status') ?? '';
  const status = VALID_STATUS.includes(statusParam as BookingStatus)
    ? (statusParam as BookingStatus)
    : undefined;

  try {
    const data = await listBookingsUseCase(
      bookingRepository(),
      status ? { status } : undefined,
    );
    return NextResponse.json({ data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Không tải được danh sách đặt phòng';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
