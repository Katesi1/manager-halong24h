'use server';

import { revalidatePath } from 'next/cache';

import {
  countActiveDisputesUseCase,
  getDisputeUseCase,
  rejectDisputeUseCase,
  resolveDisputeUseCase,
  startDisputeInvestigationUseCase,
} from '@/application/disputes/actions';
import { listDisputesUseCase } from '@/application/disputes/list';
import { openDisputeUseCase } from '@/application/disputes/open';
import type { DisputeFilters } from '@/core/entities/dispute';
import { disputeRepository } from '@/infrastructure/container';
import { requireAdmin, requireOwnerOfBooking } from '@/lib/auth-guard';
import { RoleCode } from '@/core/value-objects/role';

import { toResult } from './_helpers';

export async function listDisputesAction(filters?: DisputeFilters) {
  return toResult(async () => {
    await requireAdmin();
    return listDisputesUseCase(disputeRepository(), filters);
  });
}

export async function getDisputeAction(id: string) {
  return toResult(async () => {
    await requireAdmin();
    return getDisputeUseCase(disputeRepository(), id);
  });
}

export async function countActiveDisputesAction() {
  return toResult(async () => {
    await requireAdmin();
    return countActiveDisputesUseCase(disputeRepository());
  });
}

export async function startDisputeInvestigationAction(id: string) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    const dispute = await startDisputeInvestigationUseCase(
      disputeRepository(),
      id,
    );
    return dispute;
  });
  if (result.ok) {
    revalidatePath('/admin/disputes');
    revalidatePath(`/admin/disputes/${id}`);
  }
  return result;
}

export async function resolveDisputeAction(raw: unknown) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    const dispute = await resolveDisputeUseCase(disputeRepository(), raw);
    return dispute;
  });
  if (result.ok) {
    revalidatePath('/admin/disputes');
    revalidatePath(`/admin/disputes/${result.data.id}`);
    revalidatePath('/admin');
  }
  return result;
}

export async function rejectDisputeAction(raw: unknown) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    const dispute = await rejectDisputeUseCase(disputeRepository(), raw);
    return dispute;
  });
  if (result.ok) {
    revalidatePath('/admin/disputes');
    revalidatePath(`/admin/disputes/${result.data.id}`);
  }
  return result;
}

/**
 * Owner / Customer mở dispute từ phía họ (không cần admin role).
 * Server tự gán opener.role/name từ profile đang login.
 */
export async function openDisputeAction(input: {
  bookingId: string;
  type: string;
  subject: string;
  description: string;
  amount?: number;
}) {
  const result = await toResult(async () => {
    // Chỉ mở được dispute trên booking thuộc quyền của mình (ADMIN bypass).
    const { profile } = await requireOwnerOfBooking(input.bookingId);
    const openerRole: 'owner' | 'admin' =
      profile.role === RoleCode.ADMIN ? 'admin' : 'owner';
    return openDisputeUseCase(disputeRepository(), {
      ...input,
      opener: { role: openerRole, name: profile.name },
    });
  });
  if (result.ok) {
    revalidatePath(`/host/bookings/${input.bookingId}`);
    revalidatePath('/admin/disputes');
  }
  return result;
}

