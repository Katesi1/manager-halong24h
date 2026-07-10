import 'server-only';

import type {
  CreatePropertyInput,
  Property,
  PropertyFilters,
  PropertyImage,
  UpdatePricesInput,
  UpdatePropertyInput,
} from '@/core/entities/property';
import type {
  PropertyRepository,
  PublicPropertyFilters,
} from '@/application/ports/property-repository';

import { apiClient } from '../http/api-client';

/**
 * BE trả số lượt đặt qua `_count.bookings` (Prisma include, spec §v1.28) —
 * đôi khi kèm field phẳng `bookingCount`. Chuẩn hoá về `bookingCount` phẳng
 * để mọi trang phòng (list/detail/sort) đọc thống nhất, không ra `undefined`.
 */
type RawProperty = Property & { _count?: { bookings?: number } | null };

function mapProperty(p: RawProperty): Property {
  const { _count, ...rest } = p;
  return {
    ...rest,
    bookingCount: p.bookingCount ?? _count?.bookings ?? 0,
  };
}

export class ApiPropertyRepository implements PropertyRepository {
  async list(filters?: PropertyFilters): Promise<Property[]> {
    const data = await apiClient.get<RawProperty[]>('/properties', {
      query: {
        includeInactive: filters?.includeInactive,
        view: filters?.view,
        moderationStatus: filters?.moderationStatus,
      },
      cache: 'no-store',
    });
    return data.map(mapProperty);
  }

  async getById(id: string): Promise<Property | null> {
    try {
      const data = await apiClient.get<RawProperty>(`/properties/${id}`, {
        cache: 'no-store',
      });
      return mapProperty(data);
    } catch (err) {
      // 404 → null thay vì throw, để UI xử lý "không tìm thấy"
      if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async create(input: CreatePropertyInput): Promise<Property> {
    return apiClient.post<Property>('/properties', input);
  }

  async update(id: string, input: UpdatePropertyInput): Promise<Property> {
    return apiClient.patch<Property>(`/properties/${id}`, input);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/properties/${id}`);
  }

  async updatePrices(id: string, input: UpdatePricesInput) {
    return apiClient.put<
      Pick<
        Property,
        | 'id'
        | 'name'
        | 'code'
        | 'weekdayPrice'
        | 'weekendPrice'
        | 'holidayPrice'
        | 'adultSurcharge'
        | 'childSurcharge'
      >
    >(`/properties/${id}/prices`, input);
  }

  async uploadImages(id: string, files: File[]): Promise<PropertyImage[]> {
    const fd = new FormData();
    for (const f of files) fd.append('images', f);
    return apiClient.post<PropertyImage[]>(`/properties/${id}/images`, fd);
  }

  async deleteImage(propertyId: string, imageId: string): Promise<void> {
    await apiClient.delete(`/properties/${propertyId}/images/${imageId}`);
  }

  async setCoverImage(propertyId: string, imageId: string): Promise<void> {
    await apiClient.patch(
      `/properties/${propertyId}/images/${imageId}/cover`,
    );
  }

  async listPublic(filters?: PublicPropertyFilters): Promise<Property[]> {
    return apiClient.get<Property[]>('/properties/public', {
      skipAuth: true,
      query: {
        checkinDate: filters?.checkinDate,
        checkoutDate: filters?.checkoutDate,
        guests: filters?.guests,
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        type: filters?.type,
        view: filters?.view,
      },
      cache: 'no-store',
    });
  }

  async getShare(id: string): Promise<Property | null> {
    try {
      return await apiClient.get<Property>(`/properties/share/${id}`, {
        skipAuth: true,
        cache: 'no-store',
      });
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

  async approve(id: string): Promise<Property> {
    return apiClient.post<Property>(`/properties/${id}/approve`);
  }

  async reject(id: string, reason: string): Promise<Property> {
    return apiClient.post<Property>(`/properties/${id}/reject`, { reason });
  }

  async suspend(id: string, reason?: string): Promise<Property> {
    return apiClient.post<Property>(
      `/properties/${id}/suspend`,
      reason ? { reason } : undefined,
    );
  }

  async setHot(id: string, isHot: boolean): Promise<Property> {
    return apiClient.patch<Property>(`/properties/${id}/hot`, { isHot });
  }
}
