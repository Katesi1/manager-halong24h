'use server';

import { revalidatePath } from 'next/cache';

import {
  countOverdueSubscriptionsUseCase,
  freezeSubscriptionUseCase,
  getCurrentSubscriptionUseCase,
  getSubscriptionUseCase,
  listSubscriptionsUseCase,
  markSubscriptionPaidUseCase,
  sumPaidBetweenUseCase,
  unfreezeSubscriptionUseCase,
} from '@/application/subscriptions/actions';
import type { SubscriptionFilters } from '@/core/entities/subscription';
import { subscriptionRepository } from '@/infrastructure/container';
import { requireAdmin, requireManagerRole } from '@/lib/auth-guard';

import { toResult } from './_helpers';

export async function listSubscriptionsAction(filters?: SubscriptionFilters) {
  return toResult(async () => {
    await requireAdmin();
    return listSubscriptionsUseCase(subscriptionRepository(), filters);
  });
}

export async function getSubscriptionAction(id: string) {
  return toResult(async () => {
    await requireAdmin();
    return getSubscriptionUseCase(subscriptionRepository(), id);
  });
}

/**
 * Owner xem subscription của chính mình. SALE đọc của owner mình thuộc về.
 */
export async function getMySubscriptionAction() {
  return toResult(async () => {
    const profile = await requireManagerRole();
    const ownerId = profile.ownerId ?? profile.id;
    return getCurrentSubscriptionUseCase(subscriptionRepository(), ownerId);
  });
}

export async function countOverdueSubscriptionsAction() {
  return toResult(async () => {
    await requireAdmin();
    return countOverdueSubscriptionsUseCase(subscriptionRepository());
  });
}

export async function sumPaidSubscriptionsAction(from: string, to: string) {
  return toResult(async () => {
    await requireAdmin();
    return sumPaidBetweenUseCase(subscriptionRepository(), from, to);
  });
}

export async function markSubscriptionPaidAction(
  subscriptionId: string,
  paidAmount: number,
) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    const sub = await markSubscriptionPaidUseCase(subscriptionRepository(), {
      subscriptionId,
      paidAmount,
    });
    return sub;
  });
  if (result.ok) {
    revalidatePath('/admin/payments');
    revalidatePath(`/admin/users/${result.data.ownerId}`);
  }
  return result;
}

export async function freezeSubscriptionAction(
  subscriptionId: string,
  reason: string,
) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    const sub = await freezeSubscriptionUseCase(subscriptionRepository(), {
      subscriptionId,
      reason,
    });
    return sub;
  });
  if (result.ok) {
    revalidatePath('/admin/payments');
    revalidatePath(`/admin/users/${result.data.ownerId}`);
  }
  return result;
}

export async function unfreezeSubscriptionAction(subscriptionId: string) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    const sub = await unfreezeSubscriptionUseCase(
      subscriptionRepository(),
      subscriptionId,
    );
    return sub;
  });
  if (result.ok) {
    revalidatePath('/admin/payments');
    revalidatePath(`/admin/users/${result.data.ownerId}`);
  }
  return result;
}
