'use server';

import { z } from 'zod';

import type {
  GuestDetail,
  GuestFilters,
  GuestLabel,
  PaginatedGuests,
} from '@/core/entities/guest';
import { listGuestsUseCase } from '@/application/guests/list-guests';
import { getGuestUseCase } from '@/application/guests/get-guest';
import { guestRepository } from '@/infrastructure/container';
import { requireManagerRole } from '@/lib/auth-guard';

import { toResult } from './_helpers';

const LABEL_VALUES: GuestLabel[] = ['vip', 'regular', 'new', 'restricted'];

const FiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  label: z.enum(LABEL_VALUES as [GuestLabel, ...GuestLabel[]]).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export async function listGuestsAction(filters?: GuestFilters) {
  return toResult<PaginatedGuests>(async () => {
    await requireManagerRole();
    const parsed = FiltersSchema.parse(filters ?? {});
    return listGuestsUseCase(guestRepository(), parsed);
  });
}

export async function getGuestAction(id: string) {
  return toResult<GuestDetail | null>(async () => {
    await requireManagerRole();
    const guestId = z.string().uuid().parse(id);
    return getGuestUseCase(guestRepository(), guestId);
  });
}
