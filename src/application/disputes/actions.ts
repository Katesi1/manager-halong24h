import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  Dispute,
  RejectDisputeInput,
  ResolveDisputeInput,
} from '@/core/entities/dispute';
import type { DisputeRepository } from '../ports/dispute-repository';

export async function getDisputeUseCase(
  repo: DisputeRepository,
  id: string,
): Promise<Dispute | null> {
  if (!id) return null;
  return repo.getById(id);
}

export async function startDisputeInvestigationUseCase(
  repo: DisputeRepository,
  id: string,
): Promise<Dispute> {
  if (!id) throw new ValidationError('Thiếu id khiếu nại');
  return repo.startInvestigation(id);
}

export async function countActiveDisputesUseCase(
  repo: DisputeRepository,
): Promise<number> {
  return repo.countActive();
}

const PenaltySchema = z.object({
  type: z.enum([
    'none',
    'warn',
    'rating_down',
    'ban_temp',
    'ban_permanent',
    'kyc_revoke',
    'refund_required',
  ]),
  target: z.enum(['customer', 'owner']).nullable(),
  durationDays: z.number().int().positive().optional(),
  refundAmount: z.number().int().nonnegative().optional(),
});

const ResolveSchema = z.object({
  disputeId: z.string().min(1),
  verdict: z.enum(['favor_customer', 'favor_owner', 'split', 'no_fault']),
  penalty: PenaltySchema,
  resolution: z.string().min(10, 'Phán quyết tối thiểu 10 ký tự').max(2000),
});

export async function resolveDisputeUseCase(
  repo: DisputeRepository,
  raw: unknown,
): Promise<Dispute> {
  const parsed = ResolveSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu phán quyết không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.resolve(parsed.data as ResolveDisputeInput);
}

const RejectSchema = z.object({
  disputeId: z.string().min(1),
  reason: z.string().min(10, 'Lý do tối thiểu 10 ký tự').max(1000),
});

export async function rejectDisputeUseCase(
  repo: DisputeRepository,
  raw: unknown,
): Promise<Dispute> {
  const parsed = RejectSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu từ chối không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.reject(parsed.data as RejectDisputeInput);
}
