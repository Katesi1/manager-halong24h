import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  Dispute,
  DisputeType,
  OpenerRole,
} from '@/core/entities/dispute';
import type { DisputeRepository } from '../ports/dispute-repository';

const OpenSchema = z.object({
  bookingId: z.string().min(1, 'Thiếu mã đặt phòng'),
  type: z.enum(['refund', 'quality', 'no_show', 'behavior', 'fraud', 'other']),
  subject: z
    .string()
    .min(5, 'Tiêu đề tối thiểu 5 ký tự')
    .max(200),
  description: z
    .string()
    .min(20, 'Mô tả tối thiểu 20 ký tự')
    .max(5000),
  amount: z.number().int().nonnegative().optional(),
  opener: z.object({
    role: z.enum(['customer', 'owner', 'admin', 'anonymous']),
    name: z.string().min(2),
  }),
});

export interface OpenDisputeData {
  bookingId: string;
  type: DisputeType;
  subject: string;
  description: string;
  amount?: number;
  opener: { role: OpenerRole; name: string };
}

export async function openDisputeUseCase(
  repo: DisputeRepository & {
    open?: (input: OpenDisputeData) => Promise<Dispute>;
  },
  raw: unknown,
): Promise<Dispute> {
  const parsed = OpenSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu khiếu nại không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  if (!repo.open) {
    throw new Error('Repository chưa hỗ trợ openDispute');
  }
  return repo.open(parsed.data as OpenDisputeData);
}
