import 'server-only';

import {
  planLabel,
  type BillingPlan,
  type CreateBillingPlanInput,
  type DeleteBillingPlanResult,
  type UpdateBillingPlanInput,
} from '@/core/entities/billing-plan';
import type { BillingPlanRepository } from '@/application/ports/billing-plan-repository';

import { apiClient } from '../http/api-client';

/**
 * Shape thô BE có thể trả về. Endpoint admin (`/admin/billing-plans`) trả tên
 * trường legacy (`minCharge`/`maxRooms`) trong khi endpoint public
 * (`/billing/plans`) đã chuẩn hoá sang `monthlyPrice`/`rooms`. Đọc tolerant cả
 * hai để bảng admin không bị "—".
 */
interface RawBillingPlan {
  id: string;
  rooms?: number | null;
  maxRooms?: number | null;
  monthlyPrice?: number | null;
  minCharge?: number | null;
  yearlyPrice?: number | null;
  pricePerRoom?: number | null;
  features?: string[] | null;
  active?: boolean;
}

function readRooms(raw: RawBillingPlan): number {
  if (typeof raw.rooms === 'number') return raw.rooms;
  if (raw.maxRooms === null) return -1; // null = không giới hạn
  if (typeof raw.maxRooms === 'number') return raw.maxRooms;
  return 0;
}

function mapPlan(raw: RawBillingPlan): BillingPlan {
  return {
    id: raw.id,
    rooms: readRooms(raw),
    monthlyPrice: raw.monthlyPrice ?? raw.minCharge ?? 0,
    yearlyPrice: raw.yearlyPrice ?? 0,
    features: raw.features ?? [],
    active: raw.active,
  };
}

/** DTO ghi theo spec §10.1 — BE chờ `minCharge`/`maxRooms`/`pricePerRoom`. */
interface BillingPlanWriteDto {
  id?: string;
  name?: string;
  maxRooms?: number | null;
  minCharge?: number;
  pricePerRoom?: number;
  yearlyPrice?: number;
  features?: string[];
  active?: boolean;
}

function pricePerRoomOf(monthlyPrice: number, rooms: number): number {
  if (rooms <= 0 || monthlyPrice <= 0) return 0;
  return Math.round(monthlyPrice / rooms);
}

function toWriteDto(
  input: UpdateBillingPlanInput,
  id?: string,
): BillingPlanWriteDto {
  const dto: BillingPlanWriteDto = {};
  if (id !== undefined) {
    dto.id = id;
    dto.name = planLabel(id);
  }
  if (input.rooms !== undefined) {
    dto.maxRooms = input.rooms === -1 ? null : input.rooms;
  }
  if (input.monthlyPrice !== undefined) {
    dto.minCharge = input.monthlyPrice;
    if (input.rooms !== undefined) {
      dto.pricePerRoom = pricePerRoomOf(input.monthlyPrice, input.rooms);
    }
  }
  if (input.yearlyPrice !== undefined) dto.yearlyPrice = input.yearlyPrice;
  if (input.features !== undefined) dto.features = input.features;
  if (input.active !== undefined) dto.active = input.active;
  return dto;
}

export class ApiBillingPlanRepository implements BillingPlanRepository {
  async list(): Promise<BillingPlan[]> {
    const raw = await apiClient.get<RawBillingPlan[]>('/billing/plans', {
      skipAuth: true,
      // Catalog ít thay đổi, cache 5 phút giảm tải BE.
      revalidate: 300,
    });
    return raw.map(mapPlan);
  }

  async listAll(): Promise<BillingPlan[]> {
    // Admin endpoint — không cache, cần ADMIN role.
    const raw = await apiClient.get<RawBillingPlan[]>('/admin/billing-plans', {
      cache: 'no-store',
    });
    return raw.map(mapPlan);
  }

  async create(input: CreateBillingPlanInput): Promise<BillingPlan> {
    const { id, ...rest } = input;
    const raw = await apiClient.post<RawBillingPlan>(
      '/admin/billing-plans',
      toWriteDto(rest, id),
    );
    return mapPlan(raw);
  }

  async update(
    id: string,
    input: UpdateBillingPlanInput,
  ): Promise<BillingPlan> {
    const raw = await apiClient.put<RawBillingPlan>(
      `/admin/billing-plans/${encodeURIComponent(id)}`,
      toWriteDto(input),
    );
    return mapPlan(raw);
  }

  async delete(id: string): Promise<DeleteBillingPlanResult> {
    // BE response (spec §10.1): hard → { softDeleted: false }, soft →
    // { ...plan, softDeleted: true }. Có thể chỉ trả 204 → fallback hard.
    const res = await apiClient.delete<{ softDeleted?: boolean } | null>(
      `/admin/billing-plans/${encodeURIComponent(id)}`,
    );
    return { mode: res?.softDeleted ? 'soft' : 'hard' };
  }
}
