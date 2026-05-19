import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type { Property } from '@/core/entities/property';
import {
  CancellationPolicy,
  PropertyType,
  PropertyView,
} from '@/core/value-objects/property-type';
import type { PropertyRepository } from '../ports/property-repository';

export const CreatePropertySchema = z.object({
  name: z.string().min(1, 'Tên không được trống').max(200, 'Tên tối đa 200 ký tự'),
  type: z
    .number()
    .int()
    .refine(
      (v): v is PropertyType =>
        v === PropertyType.VILLA ||
        v === PropertyType.HOMESTAY ||
        v === PropertyType.HOTEL,
      'Loại property không hợp lệ',
    ),
  code: z
    .string()
    .min(1, 'Mã không được trống')
    .max(64, 'Mã tối đa 64 ký tự')
    .regex(/^[A-Z0-9_-]+$/, 'Mã chỉ chứa chữ hoa, số, dấu gạch dưới hoặc gạch ngang'),
  view: z.enum(PropertyView).optional(),
  address: z.string().optional(),
  mapLink: z.string().url().optional().or(z.literal('')),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  standardGuests: z.number().int().positive().optional(),
  maxGuests: z.number().int().positive().optional(),
  amenities: z.array(z.string()).optional(),
  description: z.string().max(5000, 'Mô tả tối đa 5000 ký tự').optional(),
  rules: z.string().optional(),
  services: z.array(z.string()).optional(),
  cancellationPolicy: z
    .number()
    .int()
    .refine(
      (v): v is CancellationPolicy =>
        v === CancellationPolicy.FLEXIBLE ||
        v === CancellationPolicy.MODERATE ||
        v === CancellationPolicy.STRICT,
      'Chính sách hủy không hợp lệ',
    )
    .optional(),
  weekdayPrice: z.number().nonnegative().optional(),
  weekendPrice: z.number().nonnegative().optional(),
  holidayPrice: z.number().nonnegative().optional(),
  adultSurcharge: z.number().nonnegative().optional(),
  childSurcharge: z.number().nonnegative().optional(),
  checkInTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Định dạng HH:mm')
    .optional(),
  checkOutTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Định dạng HH:mm')
    .optional(),
  childrenPolicy: z.enum(['allowed', 'with_conditions', 'not_allowed']).optional(),
  petPolicy: z.enum(['allowed', 'with_fee', 'not_allowed']).optional(),
  smokingPolicy: z.enum(['allowed', 'outdoor_only', 'not_allowed']).optional(),
  partyPolicy: z.enum(['allowed', 'small_only', 'not_allowed']).optional(),
  quietHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Định dạng HH:mm')
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Định dạng HH:mm')
    .optional(),
  ownerId: z.string().uuid().optional(),
});

export type CreatePropertyData = z.infer<typeof CreatePropertySchema>;

export async function createPropertyUseCase(
  repo: PropertyRepository,
  raw: unknown,
): Promise<Property> {
  const parsed = CreatePropertySchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.create(parsed.data);
}
