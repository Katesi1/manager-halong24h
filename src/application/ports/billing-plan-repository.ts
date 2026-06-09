import type {
  BillingPlan,
  CreateBillingPlanInput,
  DeleteBillingPlanResult,
  UpdateBillingPlanInput,
} from '@/core/entities/billing-plan';

export interface BillingPlanRepository {
  /** Public — chỉ trả gói active. */
  list(): Promise<BillingPlan[]>;
  /** Admin — trả cả gói inactive (soft-deleted). */
  listAll(): Promise<BillingPlan[]>;
  create(input: CreateBillingPlanInput): Promise<BillingPlan>;
  update(id: string, input: UpdateBillingPlanInput): Promise<BillingPlan>;
  /** BE quyết định hard/soft tuỳ còn ref user/subscription không. */
  delete(id: string): Promise<DeleteBillingPlanResult>;
}
