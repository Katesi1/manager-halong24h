'use server';

import { revalidatePath } from 'next/cache';

import {
  approveKycUseCase,
  countPendingKycUseCase,
  getKycSubmissionUseCase,
  listKycSubmissionsUseCase,
  rejectKycUseCase,
} from '@/application/kyc-admin/actions';
import type { KycAdminFilters } from '@/core/entities/kyc-admin';
import { kycAdminRepository } from '@/infrastructure/container';
import { recordAudit } from '@/lib/audit-recorder';
import { requireAdmin } from '@/lib/auth-guard';

import { toResult } from './_helpers';

export async function listKycAdminAction(filters?: KycAdminFilters) {
  return toResult(async () => {
    await requireAdmin();
    return listKycSubmissionsUseCase(kycAdminRepository(), filters);
  });
}

export async function getKycAdminAction(id: string) {
  return toResult(async () => {
    await requireAdmin();
    return getKycSubmissionUseCase(kycAdminRepository(), id);
  });
}

export async function approveKycAdminAction(submissionId: string) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    const submission = await approveKycUseCase(
      kycAdminRepository(),
      submissionId,
    );
    await recordAudit(
      profile,
      'kyc_approve',
      {
        type: 'kyc',
        id: submission.id,
        label: `Hồ sơ ${submission.ownerName}`,
      },
      null,
    );
    return submission;
  });
  if (result.ok) {
    revalidatePath('/admin/kyc');
    revalidatePath(`/admin/kyc/${submissionId}`);
    revalidatePath('/admin');
  }
  return result;
}

export async function rejectKycAdminAction(submissionId: string, reason: string) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    const submission = await rejectKycUseCase(kycAdminRepository(), {
      submissionId,
      reason,
    });
    await recordAudit(
      profile,
      'kyc_reject',
      {
        type: 'kyc',
        id: submission.id,
        label: `Hồ sơ ${submission.ownerName}`,
      },
      reason,
    );
    return submission;
  });
  if (result.ok) {
    revalidatePath('/admin/kyc');
    revalidatePath(`/admin/kyc/${submissionId}`);
    revalidatePath('/admin');
  }
  return result;
}

export async function countPendingKycAdminAction() {
  return toResult(async () => {
    await requireAdmin();
    return countPendingKycUseCase(kycAdminRepository());
  });
}
