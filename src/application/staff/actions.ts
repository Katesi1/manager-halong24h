import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  CreateStaffInviteInput,
  StaffFilters,
  StaffInvite,
  StaffInviteFilters,
  StaffMember,
} from '@/core/entities/staff';
import type { StaffRepository } from '../ports/staff-repository';

const InviteSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

export async function createStaffInviteUseCase(
  repo: StaffRepository,
  raw: unknown,
): Promise<StaffInvite> {
  const parsed = InviteSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Email không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.createInvite(parsed.data as CreateStaffInviteInput);
}

export async function listStaffInvitesUseCase(
  repo: StaffRepository,
  filters?: StaffInviteFilters,
): Promise<StaffInvite[]> {
  return repo.listInvites(filters);
}

export async function cancelStaffInviteUseCase(
  repo: StaffRepository,
  id: string,
): Promise<void> {
  if (!id) throw new ValidationError('Thiếu id invite');
  await repo.cancelInvite(id);
}

export async function listStaffUseCase(
  repo: StaffRepository,
  filters?: StaffFilters,
): Promise<StaffMember[]> {
  return repo.listStaff(filters);
}

export async function removeStaffUseCase(
  repo: StaffRepository,
  userId: string,
): Promise<void> {
  if (!userId) throw new ValidationError('Thiếu userId');
  await repo.removeStaff(userId);
}
