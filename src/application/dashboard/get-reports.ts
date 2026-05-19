import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  DashboardReport,
  ReportFilters,
} from '@/core/entities/dashboard';
import type { DashboardRepository } from '../ports/dashboard-repository';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const ReportFiltersSchema = z
  .object({
    period: z.enum(['today', 'week', 'month', 'year', 'custom']).optional(),
    from: z.string().regex(ISO_DATE).optional(),
    to: z.string().regex(ISO_DATE).optional(),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).max(2100).optional(),
  })
  .refine(
    (v) =>
      v.period !== 'custom' || (v.from !== undefined && v.to !== undefined),
    {
      message: 'period=custom yêu cầu cả `from` và `to`',
      path: ['period'],
    },
  );

export async function getDashboardReportsUseCase(
  repo: DashboardRepository,
  raw: unknown,
): Promise<DashboardReport> {
  const parsed = ReportFiltersSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    throw new ValidationError(
      'Filter báo cáo không hợp lệ',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  return repo.getReports(parsed.data as ReportFilters);
}
