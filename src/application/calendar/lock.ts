import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  LockDateInput,
  MarkSoldInput,
  UnlockDateInput,
} from '@/core/entities/calendar';
import type { CalendarRepository } from '../ports/calendar-repository';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const LockSchema = z.object({
  propertyId: z.string().min(1, 'Thiếu propertyId'),
  date: z.string().regex(ISO_DATE, 'Ngày định dạng YYYY-MM-DD'),
});

function parse(raw: unknown): LockDateInput {
  const parsed = LockSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu khóa lịch không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return parsed.data;
}

export async function lockDateUseCase(
  repo: CalendarRepository,
  raw: unknown,
): Promise<void> {
  await repo.lockDate(parse(raw));
}

export async function unlockDateUseCase(
  repo: CalendarRepository,
  raw: unknown,
): Promise<void> {
  await repo.unlockDate(parse(raw) as UnlockDateInput);
}

export async function markSoldUseCase(
  repo: CalendarRepository,
  raw: unknown,
): Promise<void> {
  await repo.markSold(parse(raw) as MarkSoldInput);
}
