import 'server-only';

import type {
  CreateLeadInput,
  Lead,
  LeadFilters,
  UpdateLeadInput,
} from '@/core/entities/lead';
import type { LeadRepository } from '@/application/ports/lead-repository';

import { apiClient } from '../http/api-client';

export class ApiLeadRepository implements LeadRepository {
  async create(input: CreateLeadInput): Promise<Lead> {
    return apiClient.post<Lead>('/leads', input, { skipAuth: true });
  }

  async list(filters?: LeadFilters): Promise<Lead[]> {
    const data = await apiClient.get<Lead[] | { items: Lead[] }>('/leads', {
      query: {
        status: filters?.status,
        propertyId: filters?.propertyId,
        page: filters?.page,
        limit: filters?.limit,
      },
      cache: 'no-store',
    });
    return Array.isArray(data) ? data : (data.items ?? []);
  }

  async getById(id: string): Promise<Lead | null> {
    try {
      return await apiClient.get<Lead>(`/leads/${id}`, { cache: 'no-store' });
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

  async update(input: UpdateLeadInput): Promise<Lead> {
    const { id, ...body } = input;
    return apiClient.patch<Lead>(`/leads/${id}`, body);
  }
}
