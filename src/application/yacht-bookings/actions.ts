import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  CreateYachtBookingInput,
  YachtBooking,
  YachtBookingFilters,
} from '@/core/entities/yacht-booking';
import type {
  ConfirmYachtBookingResult,
  YachtBookingRepository,
} from '../ports/yacht-booking-repository';

const MAX_VND = 10_000_000_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T?/;

const CreateSchema = z
  .object({
    yachtId: z.string().min(1, 'Thiếu du thuyền'),
    customerId: z.string().uuid('Mã khách không hợp lệ').optional(),
    customerName: z.string().trim().min(2, 'Tên khách tối thiểu 2 ký tự').max(120),
    customerPhone: z
      .string()
      .trim()
      .min(8, 'SĐT tối thiểu 8 số')
      .max(20)
      .regex(/^[\d\s+\-()]+$/, 'SĐT không hợp lệ'),
    customerEmail: z.string().trim().email('Email không hợp lệ').max(200).optional(),
    checkInAt: z.string().regex(ISO_DATE, 'Ngày khởi hành không hợp lệ'),
    checkOutAt: z.string().regex(ISO_DATE, 'Ngày kết thúc không hợp lệ').optional(),
    adults: z.coerce.number().int().min(1, 'Ít nhất 1 người lớn').max(500),
    children: z.coerce.number().int().min(0).max(500).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine(
    (v) => !v.checkOutAt || v.checkOutAt >= v.checkInAt,
    { message: 'Ngày kết thúc phải sau ngày khởi hành', path: ['checkOutAt'] },
  );

export async function listYachtBookingsUseCase(
  repo: YachtBookingRepository,
  filters?: YachtBookingFilters,
): Promise<YachtBooking[]> {
  return repo.list(filters);
}

export async function getYachtBookingUseCase(
  repo: YachtBookingRepository,
  id: string,
): Promise<YachtBooking | null> {
  if (!id) throw new ValidationError('Thiếu mã đơn');
  return repo.getById(id);
}

export async function createYachtBookingUseCase(
  repo: YachtBookingRepository,
  raw: unknown,
): Promise<YachtBooking> {
  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu đặt du thuyền không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.create(parsed.data as CreateYachtBookingInput);
}

export async function confirmYachtBookingUseCase(
  repo: YachtBookingRepository,
  id: string,
): Promise<ConfirmYachtBookingResult> {
  if (!id) throw new ValidationError('Thiếu mã đơn');
  return repo.confirm(id);
}

export async function markYachtBookingPaidUseCase(
  repo: YachtBookingRepository,
  id: string,
  amount?: number,
): Promise<YachtBooking> {
  if (!id) throw new ValidationError('Thiếu mã đơn');
  if (
    amount !== undefined &&
    (!Number.isFinite(amount) || amount <= 0 || amount > MAX_VND)
  ) {
    throw new ValidationError('Số tiền thanh toán không hợp lệ');
  }
  return repo.markPaid(id, amount);
}

export async function cancelYachtBookingUseCase(
  repo: YachtBookingRepository,
  id: string,
  reason?: string,
): Promise<YachtBooking> {
  if (!id) throw new ValidationError('Thiếu mã đơn');
  const trimmed = reason?.trim();
  if (trimmed && trimmed.length > 500) {
    throw new ValidationError('Lý do huỷ tối đa 500 ký tự');
  }
  return repo.cancel(id, trimmed && trimmed.length > 0 ? trimmed : undefined);
}
