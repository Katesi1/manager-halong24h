import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  CalendarGrid,
  CalendarGridFilters,
} from '@/core/entities/calendar';
import type { CalendarRepository } from '../ports/calendar-repository';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const GridFiltersSchema = z.object({
  from: z.string().regex(ISO_DATE, 'Ngày bắt đầu định dạng YYYY-MM-DD'),
  to: z.string().regex(ISO_DATE, 'Ngày kết thúc định dạng YYYY-MM-DD'),
  propertyIds: z.array(z.string()).optional(),
});

export async function getCalendarGridUseCase(
  repo: CalendarRepository,
  raw: unknown,
): Promise<CalendarGrid> {
  const parsed = GridFiltersSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Bộ lọc lịch không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  if (parsed.data.to < parsed.data.from) {
    throw new ValidationError('Ngày kết thúc phải sau ngày bắt đầu');
  }
  return repo.getGrid(parsed.data as CalendarGridFilters);
}
