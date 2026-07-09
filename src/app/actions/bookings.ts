'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  cancelBookingUseCase,
  checkinBookingUseCase,
  confirmBookingUseCase,
  holdBookingUseCase,
  markBookingPaidUseCase,
} from '@/application/bookings/actions';
import { listBookingsUseCase } from '@/application/bookings/list';
import { ValidationError } from '@/core/errors';
import type { BookingFilters } from '@/core/entities/booking';
import { bookingRepository } from '@/infrastructure/container';
import {
  requireManagerRole,
  requireOwnerOfBooking,
  requireOwnerOfProperty,
} from '@/lib/auth-guard';

import { toResult } from './_helpers';

export async function listBookingsAction(filters?: BookingFilters) {
  return toResult(async () => {
    await requireManagerRole();
    return listBookingsUseCase(bookingRepository(), filters);
  });
}

export async function getBookingAction(id: string) {
  return toResult(async () => {
    // Ownership check + tái dùng booking đã fetch (không fetch 2 lần).
    const { booking } = await requireOwnerOfBooking(id);
    return booking;
  });
}

export async function holdBookingAction(raw: unknown) {
  const result = await toResult(async () => {
    // Chặn hold trên cơ sở của owner khác: xác thực propertyId thuộc caller.
    const pid = z
      .object({ propertyId: z.string().min(1) })
      .safeParse(raw);
    if (!pid.success) throw new ValidationError('Thiếu mã cơ sở');
    await requireOwnerOfProperty(pid.data.propertyId);
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
    await requireOwnerOfBooking(id);
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
    await requireOwnerOfBooking(id);
    return markBookingPaidUseCase(bookingRepository(), id, amount);
  });
  if (result.ok) {
    revalidatePath(`/host/bookings/${id}`);
    revalidatePath('/host/bookings');
  }
  return result;
}

/**
 * Xác nhận khách nhận phòng + thu nốt (spec §5.5). CONFIRMED → COMPLETED.
 * `amount` cộng dồn vào paidAmount; bỏ trống = thu đủ phần còn lại.
 */
export async function checkinBookingAction(id: string, amount?: number) {
  const result = await toResult(async () => {
    await requireOwnerOfBooking(id);
    return checkinBookingUseCase(bookingRepository(), id, amount);
  });
  if (result.ok) {
    revalidatePath(`/host/bookings/${id}`);
    revalidatePath('/host/bookings');
    revalidatePath('/host/calendar');
  }
  return result;
}

export async function cancelBookingAction(id: string, reason?: string) {
  const result = await toResult(async () => {
    await requireOwnerOfBooking(id);
    return cancelBookingUseCase(bookingRepository(), { id, reason });
  });
  if (result.ok) {
    revalidatePath(`/host/bookings/${id}`);
    revalidatePath('/host/bookings');
    revalidatePath('/host/calendar');
  }
  return result;
}
