'use server';

import { revalidatePath } from 'next/cache';

import {
  cancelYachtBookingUseCase,
  confirmYachtBookingUseCase,
  createYachtBookingUseCase,
  getYachtBookingUseCase,
  listYachtBookingsUseCase,
  markYachtBookingPaidUseCase,
} from '@/application/yacht-bookings/actions';
import type {
  ConfirmYachtBookingResult,
  YachtBookingRepository,
} from '@/application/ports/yacht-booking-repository';
import type { YachtBookingFilters } from '@/core/entities/yacht-booking';
import { yachtBookingRepository } from '@/infrastructure/container';
import type { Result } from '@/lib/result';
import { requireYachtManager } from '@/lib/auth-guard';

import { toResult } from './_helpers';

function repo(): YachtBookingRepository {
  return yachtBookingRepository();
}

function revalidateBooking(id?: string) {
  revalidatePath('/admin/yacht-bookings');
  if (id) revalidatePath(`/admin/yacht-bookings/${id}`);
}

export async function listYachtBookingsAction(filters?: YachtBookingFilters) {
  return toResult(async () => {
    await requireYachtManager();
    return listYachtBookingsUseCase(repo(), filters);
  });
}

export async function getYachtBookingAction(id: string) {
  return toResult(async () => {
    await requireYachtManager();
    return getYachtBookingUseCase(repo(), id);
  });
}

export async function createYachtBookingAction(
  raw: unknown,
): Promise<Result<{ id: string }>> {
  const result = await toResult(async () => {
    await requireYachtManager();
    return createYachtBookingUseCase(repo(), raw);
  });
  if (result.ok) {
    revalidateBooking();
    return { ok: true, data: { id: result.data.id } };
  }
  return result;
}

/** Xác nhận đơn → CONFIRMED. Trả VietQR + STK để nhân viên gửi khách. */
export async function confirmYachtBookingAction(
  id: string,
): Promise<Result<ConfirmYachtBookingResult>> {
  const result = await toResult(async () => {
    await requireYachtManager();
    return confirmYachtBookingUseCase(repo(), id);
  });
  if (result.ok) revalidateBooking(id);
  return result;
}

/** Ghi nhận đã nhận đủ tiền → PAID. Hệ thống tự gửi email mã code cho khách. */
export async function markYachtBookingPaidAction(id: string, amount?: number) {
  const result = await toResult(async () => {
    await requireYachtManager();
    return markYachtBookingPaidUseCase(repo(), id, amount);
  });
  if (result.ok) revalidateBooking(id);
  return result;
}

export async function cancelYachtBookingAction(id: string, reason?: string) {
  const result = await toResult(async () => {
    await requireYachtManager();
    return cancelYachtBookingUseCase(repo(), id, reason);
  });
  if (result.ok) revalidateBooking(id);
  return result;
}
