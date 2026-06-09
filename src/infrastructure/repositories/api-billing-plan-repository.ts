import 'server-only';

import type {
  BillingPlan,
  CreateBillingPlanInput,
  DeleteBillingPlanResult,
  UpdateBillingPlanInput,
} from '@/core/entities/billing-plan';
import type { BillingPlanRepository } from '@/application/ports/billing-plan-repository';

import { apiClient } from '../http/api-client';

export class ApiBillingPlanRepository implements BillingPlanRepository {
  async list(): Promise<BillingPlan[]> {
    return apiClient.get<BillingPlan[]>('/billing/plans', {
      skipAuth: true,
      // Catalog ít thay đổi, cache 5 phút giảm tải BE.
      revalidate: 300,
    });
  }

  async listAll(): Promise<BillingPlan[]> {
    // Admin endpoint — không cache, cần ADMIN role.
    return apiClient.get<BillingPlan[]>('/admin/billing-plans', {
      cache: 'no-store',
    });
  }

  async create(input: CreateBillingPlanInput): Promise<BillingPlan> {
    return apiClient.post<BillingPlan>('/admin/billing-plans', input);
  }

  async update(
    id: string,
    input: UpdateBillingPlanInput,
  ): Promise<BillingPlan> {
    return apiClient.put<BillingPlan>(
      `/admin/billing-plans/${encodeURIComponent(id)}`,
      input,
    );
  }

  async delete(id: string): Promise<DeleteBillingPlanResult> {
    // BE response: { mode: 'hard' | 'soft' }. Nếu BE chỉ trả 204, fallback hard.
    const res = await apiClient.delete<DeleteBillingPlanResult | null>(
      `/admin/billing-plans/${encodeURIComponent(id)}`,
    );
    return res ?? { mode: 'hard' };
  }
}
