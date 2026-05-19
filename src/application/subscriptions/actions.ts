import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  Subscription,
  SubscriptionFilters,
} from '@/core/entities/subscription';
import type { SubscriptionRepository } from '../ports/subscription-repository';

export async function listSubscriptionsUseCase(
  repo: SubscriptionRepository,
  filters?: SubscriptionFilters,
): Promise<Subscription[]> {
  return repo.list(filters);
}

export async function getSubscriptionUseCase(
  repo: SubscriptionRepository,
  id: string,
): Promise<Subscription | null> {
  if (!id) return null;
  return repo.getById(id);
}

export async function getCurrentSubscriptionUseCase(
  repo: SubscriptionRepository,
  ownerId: string,
): Promise<Subscription | null> {
  if (!ownerId) return null;
  return repo.getCurrentForOwner(ownerId);
}

export async function countOverdueSubscriptionsUseCase(
  repo: SubscriptionRepository,
): Promise<number> {
  return repo.countOverdue();
}

export async function sumPaidBetweenUseCase(
  repo: SubscriptionRepository,
  from: string,
  to: string,
): Promise<number> {
  return repo.sumPaidBetween(from, to);
}

const MarkPaidSchema = z.object({
  subscriptionId: z.string().min(1),
  paidAmount: z.number().int().nonnegative(),
});

export async function markSubscriptionPaidUseCase(
  repo: SubscriptionRepository,
  raw: unknown,
): Promise<Subscription> {
  const parsed = MarkPaidSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu thanh toán không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.markPaid(parsed.data);
}

const FreezeSchema = z.object({
  subscriptionId: z.string().min(1),
  reason: z.string().min(5, 'Lý do tối thiểu 5 ký tự').max(500),
});

export async function freezeSubscriptionUseCase(
  repo: SubscriptionRepository,
  raw: unknown,
): Promise<Subscription> {
  const parsed = FreezeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu freeze không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.freeze(parsed.data);
}

export async function unfreezeSubscriptionUseCase(
  repo: SubscriptionRepository,
  subscriptionId: string,
): Promise<Subscription> {
  if (!subscriptionId) throw new ValidationError('Thiếu mã subscription');
  return repo.unfreeze(subscriptionId);
}
