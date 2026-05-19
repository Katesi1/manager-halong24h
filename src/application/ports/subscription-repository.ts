import type {
  FreezeInput,
  MarkPaidInput,
  Subscription,
  SubscriptionFilters,
} from '@/core/entities/subscription';

export interface SubscriptionRepository {
  list(filters?: SubscriptionFilters): Promise<Subscription[]>;
  getById(id: string): Promise<Subscription | null>;
  /** Subscription hiện hành của 1 owner (mới nhất chưa expired). */
  getCurrentForOwner(ownerId: string): Promise<Subscription | null>;
  countOverdue(): Promise<number>;
  /** Tổng đã thu trong khoảng (ms epoch). */
  sumPaidBetween(from: string, to: string): Promise<number>;
  markPaid(input: MarkPaidInput): Promise<Subscription>;
  freeze(input: FreezeInput): Promise<Subscription>;
  unfreeze(subscriptionId: string): Promise<Subscription>;
}
