'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Legacy lead actions — BE chưa có endpoint /leads. Action mock-success.
 */
const leadSchema = z.object({
  property_id: z.string().min(1, 'Cơ sở không hợp lệ'),
  room_id: z.string().optional().or(z.literal('')),
  guest_name: z.string().min(2, 'Tên tối thiểu 2 ký tự').max(120),
  guest_phone: z
    .string()
    .min(8, 'SĐT tối thiểu 8 số')
    .max(20, 'SĐT tối đa 20 số')
    .regex(/^[\d\s+\-().]+$/, 'SĐT chỉ được chứa số và dấu'),
  guest_email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  num_guests: z.coerce.number().int().min(1).max(50).optional(),
  message: z.string().max(2000).optional().or(z.literal('')),
});

export interface LeadActionResult {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  leadId?: string;
}

export async function submitLeadAction(
  _prev: LeadActionResult,
  formData: FormData,
): Promise<LeadActionResult> {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => {
      if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    });
    return { fieldErrors };
  }
  redirect(`/property/${parsed.data.property_id}/book/success?demo=1`);
}

export async function updateLeadStatusAction(
  _leadId: string,
  _status: 'new' | 'contacted' | 'rejected' | 'expired',
): Promise<LeadActionResult> {
  revalidatePath('/host/leads');
  return { ok: true };
}
