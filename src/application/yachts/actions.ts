import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  CreateYachtInput,
  UpdateYachtInput,
  UpdateYachtPricesInput,
  Yacht,
  YachtFilters,
} from '@/core/entities/yacht';
import type { YachtRepository } from '../ports/yacht-repository';

const MAX_VND = 10_000_000_000;

const ItineraryStepSchema = z.object({
  order: z.coerce.number().int().min(1),
  title: z.string().trim().min(1, 'Tiêu đề chặng không được trống').max(200),
  time: z.string().trim().max(50).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
});

const priceField = z.coerce.number().int().nonnegative().max(MAX_VND);
const optionalPrice = priceField.optional();

const CreateSchema = z.object({
  name: z.string().trim().min(2, 'Tên du thuyền tối thiểu 2 ký tự').max(200),
  code: z
    .string()
    .trim()
    .min(2, 'Mã du thuyền tối thiểu 2 ký tự')
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ gồm chữ, số, gạch ngang/dưới'),
  description: z.string().trim().max(5000).optional(),
  cabins: z.coerce.number().int().min(0).max(1000).optional(),
  maxGuests: z.coerce.number().int().min(0).max(1000).optional(),
  lengthMeters: z.coerce.number().min(0).max(1000).optional(),
  shipType: z.string().trim().max(100).optional(),
  departurePoint: z.string().trim().max(200).optional(),
  durationText: z.string().trim().max(200).optional(),
  itinerary: z.array(ItineraryStepSchema).max(100).optional(),
  amenities: z.array(z.string().trim().max(100)).max(100).optional(),
  services: z.array(z.string().trim().max(100)).max(100).optional(),
  rules: z.string().trim().max(5000).optional(),
  cancellationPolicy: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  checkInTime: z.string().trim().max(10).optional(),
  checkOutTime: z.string().trim().max(10).optional(),
  // Giá bán theo đầu người (spec §27.2): người lớn + trẻ em riêng.
  weekdayPrice: optionalPrice,
  weekendPrice: optionalPrice,
  holidayPrice: optionalPrice,
  weekdayChildPrice: optionalPrice,
  weekendChildPrice: optionalPrice,
  holidayChildPrice: optionalPrice,
});

const UpdateSchema = CreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const PricesSchema = z.object({
  weekdayPrice: priceField,
  weekendPrice: priceField,
  holidayPrice: priceField,
  weekdayChildPrice: optionalPrice,
  weekendChildPrice: optionalPrice,
  holidayChildPrice: optionalPrice,
});

function normalizeItinerary<T extends { itinerary?: unknown }>(data: T): T {
  if (!Array.isArray(data.itinerary)) return data;
  return {
    ...data,
    itinerary: (data.itinerary as { order: number }[])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((s, i) => ({ ...s, order: i + 1 })),
  };
}

export async function listYachtsUseCase(
  repo: YachtRepository,
  filters?: YachtFilters,
): Promise<Yacht[]> {
  return repo.list(filters);
}

export async function getYachtUseCase(
  repo: YachtRepository,
  id: string,
): Promise<Yacht | null> {
  if (!id) throw new ValidationError('Thiếu mã du thuyền');
  return repo.getById(id);
}

export async function createYachtUseCase(
  repo: YachtRepository,
  raw: unknown,
): Promise<Yacht> {
  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu du thuyền không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.create(normalizeItinerary(parsed.data) as CreateYachtInput);
}

export async function updateYachtUseCase(
  repo: YachtRepository,
  id: string,
  raw: unknown,
): Promise<Yacht> {
  if (!id) throw new ValidationError('Thiếu mã du thuyền');
  const parsed = UpdateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu du thuyền không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.update(id, normalizeItinerary(parsed.data) as UpdateYachtInput);
}

export async function deleteYachtUseCase(
  repo: YachtRepository,
  id: string,
): Promise<void> {
  if (!id) throw new ValidationError('Thiếu mã du thuyền');
  return repo.delete(id);
}

export async function updateYachtPricesUseCase(
  repo: YachtRepository,
  id: string,
  raw: unknown,
): Promise<Yacht> {
  if (!id) throw new ValidationError('Thiếu mã du thuyền');
  const parsed = PricesSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Bảng giá không hợp lệ (cả 5 mức giá bắt buộc)',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.updatePrices(id, parsed.data as UpdateYachtPricesInput);
}
