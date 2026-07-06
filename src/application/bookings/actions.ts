import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  Booking,
  CancelBookingInput,
  CreateBookingHoldInput,
} from '@/core/entities/booking';
import type { BookingRepository } from '../ports/booking-repository';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T?/;

const HoldSchema = z.object({
  propertyId: z.string().min(1, 'Thiếu cơ sở'),
  guestName: z.string().min(2, 'Tên khách tối thiểu 2 ký tự').max(120),
  guestPhone: z
    .string()
    .min(8, 'SĐT tối thiểu 8 số')
    .max(20)
    .regex(/^[\d\s+\-()]+$/, 'SĐT không hợp lệ'),
  checkInAt: z.string().regex(ISO_DATE, 'Ngày nhận phòng không hợp lệ'),
  checkOutAt: z.string().regex(ISO_DATE, 'Ngày trả phòng không hợp lệ'),
  guestCount: z.coerce.number().int().min(1).max(50),
  depositAmount: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});

export async function holdBookingUseCase(
  repo: BookingRepository,
  raw: unknown,
): Promise<Booking> {
  const parsed = HoldSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu booking không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  if (parsed.data.checkOutAt <= parsed.data.checkInAt) {
    throw new ValidationError('Ngày trả phòng phải sau ngày nhận', {
      checkOutAt: ['Ngày trả phòng phải sau ngày nhận'],
    });
  }
  if (parsed.data.checkInAt < new Date().toISOString().slice(0, 10)) {
    throw new ValidationError('Ngày nhận phòng không thể trong quá khứ', {
      checkInAt: ['Ngày nhận phòng không thể trong quá khứ'],
    });
  }
  return repo.hold(parsed.data as CreateBookingHoldInput);
}

export async function confirmBookingUseCase(
  repo: BookingRepository,
  id: string,
): Promise<Booking> {
  if (!id) throw new ValidationError('Thiếu id booking');
  return repo.confirm(id);
}

export async function markBookingPaidUseCase(
  repo: BookingRepository,
  id: string,
  amount?: number,
): Promise<Booking> {
  if (!id) throw new ValidationError('Thiếu id booking');
  // NaN <= 0 là false → phải chặn tường minh; kèm cận trên tránh số vô lý.
  if (
    amount !== undefined &&
    (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000_000)
  ) {
    throw new ValidationError('Số tiền thanh toán không hợp lệ');
  }
  return repo.markPaid(id, amount);
}

const CancelSchema = z.object({
  id: z.string().min(1, 'Thiếu id booking'),
  reason: z.string().max(500).optional(),
});

export async function cancelBookingUseCase(
  repo: BookingRepository,
  raw: unknown,
): Promise<Booking> {
  const parsed = CancelSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu hủy không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.cancel(parsed.data as CancelBookingInput);
}
