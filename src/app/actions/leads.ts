'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import type {
  CreateLeadInput,
  Lead,
  LeadFilters,
  LeadStatus,
  UpdateLeadInput,
} from '@/core/entities/lead';
import { leadRepository } from '@/infrastructure/container';
import { requireManagerRole } from '@/lib/auth-guard';

import { toResult } from './_helpers';

const CreateSchema = z.object({
  propertyId: z.string().uuid().optional(),
  guestName: z.string().min(2).max(120),
  guestPhone: z
    .string()
    .min(8)
    .max(20)
    .regex(/^[\d\s+\-().]+$/),
  guestEmail: z.string().email().optional(),
  checkIn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  checkOut: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  numGuests: z.number().int().min(1).max(50).optional(),
  message: z.string().max(2000).optional(),
  source: z
    .enum(['public_form', 'landing_page', 'partner', 'manual'])
    .optional(),
});

const STATUS_VALUES: LeadStatus[] = [
  'new',
  'contacted',
  'rejected',
  'expired',
  'converted',
];

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUS_VALUES as [LeadStatus, ...LeadStatus[]]).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).optional(),
});

/** Public — không cần auth (rate-limit 10/phút/IP do BE handle). */
export async function createLeadAction(input: CreateLeadInput) {
  return toResult<Lead>(async () => {
    const parsed = CreateSchema.parse(input);
    return leadRepository().create(parsed);
  });
}

export async function listLeadsAction(filters?: LeadFilters) {
  return toResult<Lead[]>(async () => {
    await requireManagerRole();
    return leadRepository().list(filters);
  });
}

export async function getLeadAction(id: string) {
  return toResult<Lead | null>(async () => {
    await requireManagerRole();
    return leadRepository().getById(id);
  });
}

export async function updateLeadAction(input: UpdateLeadInput) {
  return toResult<Lead>(async () => {
    await requireManagerRole();
    const parsed = UpdateSchema.parse(input);
    const lead = await leadRepository().update(parsed);
    revalidatePath('/host/leads');
    revalidatePath('/admin/leads');
    return lead;
  });
}
