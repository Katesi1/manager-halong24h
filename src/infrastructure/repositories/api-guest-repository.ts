import 'server-only';

import type {
  GuestDetail,
  GuestFilters,
  PaginatedGuests,
} from '@/core/entities/guest';
import type { GuestRepository } from '@/application/ports/guest-repository';

import { apiClient } from '../http/api-client';

export class ApiGuestRepository implements GuestRepository {
  async list(filters?: GuestFilters): Promise<PaginatedGuests> {
    const data = await apiClient.get<PaginatedGuests>('/guests', {
      query: {
        q: filters?.q,
        label: filters?.label,
        page: filters?.page,
        limit: filters?.limit,
      },
      cache: 'no-store',
    });
    return {
      items: data.items ?? [],
      total: data.total ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 20,
      totalPages: data.totalPages ?? 1,
    };
  }

  async getById(id: string): Promise<GuestDetail | null> {
    try {
      return await apiClient.get<GuestDetail>(`/guests/${id}`, {
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
}
