import 'server-only';

import type {
  CreateYachtInput,
  UpdateYachtInput,
  UpdateYachtPricesInput,
  Yacht,
  YachtFilters,
  YachtImage,
  YachtItineraryStep,
} from '@/core/entities/yacht';
import type { YachtRepository } from '@/application/ports/yacht-repository';

import { apiClient } from '../http/api-client';

/**
 * BE có thể trả `_count.bookings` (Prisma include) hoặc field phẳng
 * `bookingCount`. Mảng có thể null → chuẩn hoá về [] để UI khỏi phòng thủ.
 */
type RawYacht = Yacht & { _count?: { bookings?: number } | null };

function mapItinerary(raw: unknown): YachtItineraryStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s, i): YachtItineraryStep => {
      const step = s as Partial<YachtItineraryStep>;
      return {
        order: typeof step.order === 'number' ? step.order : i + 1,
        title: step.title ?? '',
        time: step.time ?? null,
        description: step.description ?? null,
      };
    })
    .sort((a, b) => a.order - b.order);
}

function mapYacht(p: RawYacht): Yacht {
  const { _count, ...rest } = p;
  return {
    ...rest,
    itinerary: mapItinerary(p.itinerary),
    amenities: p.amenities ?? [],
    services: p.services ?? [],
    images: p.images ?? [],
    bookingCount: p.bookingCount ?? _count?.bookings ?? 0,
  };
}

export class ApiYachtRepository implements YachtRepository {
  async list(filters?: YachtFilters): Promise<Yacht[]> {
    const data = await apiClient.get<
      RawYacht[] | { items: RawYacht[] }
    >('/yachts', {
      query: {
        includeInactive: filters?.includeInactive,
        page: filters?.page,
        limit: filters?.limit,
      },
      cache: 'no-store',
    });
    const arr = Array.isArray(data) ? data : (data.items ?? []);
    return arr.map(mapYacht);
  }

  async getById(id: string): Promise<Yacht | null> {
    try {
      const data = await apiClient.get<RawYacht>(`/yachts/${id}`, {
        cache: 'no-store',
      });
      return mapYacht(data);
    } catch (err) {
      if (
        err instanceof Error &&
        'status' in err &&
        (err as { status: number }).status === 404
      ) {
        return null;
      }
      throw err;
    }
  }

  async create(input: CreateYachtInput): Promise<Yacht> {
    const data = await apiClient.post<RawYacht>('/yachts', input);
    return mapYacht(data);
  }

  async update(id: string, input: UpdateYachtInput): Promise<Yacht> {
    const data = await apiClient.put<RawYacht>(`/yachts/${id}`, input);
    return mapYacht(data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/yachts/${id}`);
  }

  async updatePrices(
    id: string,
    input: UpdateYachtPricesInput,
  ): Promise<Yacht> {
    const data = await apiClient.put<RawYacht>(`/yachts/${id}/prices`, input);
    return mapYacht(data);
  }

  async uploadImages(id: string, files: File[]): Promise<YachtImage[]> {
    const fd = new FormData();
    for (const f of files) fd.append('images', f);
    return apiClient.post<YachtImage[]>(`/yachts/${id}/images`, fd);
  }

  async deleteImage(yachtId: string, imageId: string): Promise<void> {
    await apiClient.delete(`/yachts/${yachtId}/images/${imageId}`);
  }

  async setCoverImage(yachtId: string, imageId: string): Promise<void> {
    await apiClient.patch(`/yachts/${yachtId}/images/${imageId}/cover`);
  }
}
