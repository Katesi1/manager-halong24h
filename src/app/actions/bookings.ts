'use server';

import { revalidatePath } from 'next/cache';

import {
  cancelBookingUseCase,
  confirmBookingUseCase,
  holdBookingUseCase,
  markBookingPaidUseCase,
} from '@/application/bookings/actions';
import { getBookingByIdUseCase } from '@/application/bookings/get-by-id';
import { listBookingsUseCase } from '@/application/bookings/list';
import type { BookingFilters } from '@/core/entities/booking';
import { bookingRepository } from '@/infrastructure/container';
import { requireManagerRole } from '@/lib/auth-guard';

import { toResult } from './_helpers';

export async function listBookingsAction(filters?: BookingFilters) {
  return toResult(async () => {
    await requireManagerRole();
    return listBookingsUseCase(bookingRepository(), filters);
  });
}

export async function getBookingAction(id: string) {
  return toResult(async () => {
    await requireManagerRole();
    return getBookingByIdUseCase(bookingRepository(), id);
  });
}

export async function holdBookingAction(raw: unknown) {
  const result = await toResult(async () => {
    await requireManagerRole();
    return holdBookingUseCase(bookingRepository(), raw);
  });
  if (result.ok) {
    revalidatePath('/host/bookings');
    revalidatePath('/host/calendar');
  }
  return result;
}

export async function confirmBookingAction(id: string) {
  const result = await toResult(async () => {
    await requireManagerRole();
    return confirmBookingUseCase(bookingRepository(), id);
  });
  if (result.ok) {
    revalidatePath(`/host/bookings/${id}`);
    revalidatePath('/host/bookings');
    revalidatePath('/host/calendar');
  }
  return result;
}

/**
 * Xác nhận đã nhận tiền → status: paid + auto gửi Email 2 phiếu check-in.
 * Hỗ trợ partial payment qua `amount` (truyền số tiền thực nhận; mặc định = totalPrice).
 *
 * TODO khi BE ready: BE auto-send Email 2 sau khi markPaid.
 */
export async function markBookingPaidAction(id: string, amount?: number) {
  const result = await toResult(async () => {
    await requireManagerRole();
    return markBookingPaidUseCase(bookingRepository(), id, amount);
  });
  if (result.ok) {
    revalidatePath(`/host/bookings/${id}`);
    revalidatePath('/host/bookings');
  }
  return result;
}

export async function cancelBookingAction(id: string, reason?: string) {
  const result = await toResult(async () => {
    await requireManagerRole();
    return cancelBookingUseCase(bookingRepository(), { id, reason });
  });
  if (result.ok) {
    revalidatePath(`/host/bookings/${id}`);
    revalidatePath('/host/bookings');
    revalidatePath('/host/calendar');
  }
  return result;
}
