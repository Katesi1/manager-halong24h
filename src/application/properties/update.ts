import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type { Property } from '@/core/entities/property';
import type { PropertyRepository } from '../ports/property-repository';

import { CreatePropertySchema } from './create';

export const UpdatePropertySchema = CreatePropertySchema.partial().extend({
  isActive: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/, 'Định dạng HH:mm').optional(),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/, 'Định dạng HH:mm').optional(),
});

export async function updatePropertyUseCase(
  repo: PropertyRepository,
  id: string,
  raw: unknown,
): Promise<Property> {
  const parsed = UpdatePropertySchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.update(id, parsed.data);
}

export const UpdatePricesSchema = z.object({
  weekdayPrice: z.number().nonnegative().optional(),
  weekendPrice: z.number().nonnegative().optional(),
  holidayPrice: z.number().nonnegative().optional(),
  adultSurcharge: z.number().nonnegative().optional(),
  childSurcharge: z.number().nonnegative().optional(),
});

export async function updatePropertyPricesUseCase(
  repo: PropertyRepository,
  id: string,
  raw: unknown,
) {
  const parsed = UpdatePricesSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu giá không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.updatePrices(id, parsed.data);
}
