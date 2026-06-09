import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  KycAdminFilters,
  KycAdminListResult,
  KycAdminSubmission,
} from '@/core/entities/kyc-admin';
import type { KycAdminRepository } from '../ports/kyc-admin-repository';

export async function listKycSubmissionsUseCase(
  repo: KycAdminRepository,
  filters?: KycAdminFilters,
): Promise<KycAdminListResult> {
  return repo.list(filters);
}

export async function getKycSubmissionUseCase(
  repo: KycAdminRepository,
  id: string,
): Promise<KycAdminSubmission | null> {
  if (!id) return null;
  return repo.getById(id);
}

export async function approveKycUseCase(
  repo: KycAdminRepository,
  submissionId: string,
): Promise<KycAdminSubmission> {
  if (!submissionId) throw new ValidationError('Thiếu mã hồ sơ');
  return repo.approve({ submissionId });
}

const RejectSchema = z.object({
  submissionId: z.string().min(1),
  reason: z.string().min(5, 'Lý do tối thiểu 5 ký tự').max(500),
});

export async function rejectKycUseCase(
  repo: KycAdminRepository,
  raw: unknown,
): Promise<KycAdminSubmission> {
  const parsed = RejectSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu từ chối không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.reject(parsed.data);
}

export async function countPendingKycUseCase(
  repo: KycAdminRepository,
): Promise<number> {
  return repo.countPending();
}
