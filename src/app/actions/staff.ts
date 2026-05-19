'use server';

import { revalidatePath } from 'next/cache';

import {
  cancelStaffInviteUseCase,
  createStaffInviteUseCase,
  listStaffInvitesUseCase,
  listStaffUseCase,
  removeStaffUseCase,
} from '@/application/staff/actions';
import type { StaffFilters, StaffInviteFilters } from '@/core/entities/staff';
import { staffRepository } from '@/infrastructure/container';
import { requireOwner } from '@/lib/auth-guard';

import { toResult } from './_helpers';

async function ensureOwner() {
  await requireOwner();
}

export async function listStaffInvitesAction(filters?: StaffInviteFilters) {
  return toResult(async () => {
    await ensureOwner();
    return listStaffInvitesUseCase(staffRepository(), filters);
  });
}

export async function createStaffInviteAction(raw: unknown) {
  const result = await toResult(async () => {
    await ensureOwner();
    return createStaffInviteUseCase(staffRepository(), raw);
  });
  if (result.ok) revalidatePath('/host/staff');
  return result;
}

export async function cancelStaffInviteAction(id: string) {
  const result = await toResult(async () => {
    await ensureOwner();
    await cancelStaffInviteUseCase(staffRepository(), id);
    return true;
  });
  if (result.ok) revalidatePath('/host/staff');
  return result;
}

export async function listStaffAction(filters?: StaffFilters) {
  return toResult(async () => {
    await ensureOwner();
    return listStaffUseCase(staffRepository(), filters);
  });
}

export async function removeStaffAction(userId: string) {
  const result = await toResult(async () => {
    await ensureOwner();
    await removeStaffUseCase(staffRepository(), userId);
    return true;
  });
  if (result.ok) revalidatePath('/host/staff');
  return result;
}
