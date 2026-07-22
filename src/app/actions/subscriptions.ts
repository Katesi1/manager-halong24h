'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  addSubscriptionCallLogUseCase,
  countOverdueSubscriptionsUseCase,
  freezeSubscriptionUseCase,
  getCurrentSubscriptionUseCase,
  getSubscriptionUseCase,
  listMyInvoicesUseCase,
  listSubscriptionCallLogsUseCase,
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

/**
 * Lịch sử hoá đơn gói cước của chính owner đang đăng nhập.
 * SALE đọc của owner mình thuộc về (BE tự resolve qua ownerId).
 * SALE chưa gán owner → BE 400 `users.saleNotAssigned` → Result.ok = false,
 * trang hiển thị empty/notice (không crash).
 */
export async function listMyInvoicesAction() {
  return toResult(async () => {
    await requireManagerRole();
    return listMyInvoicesUseCase(subscriptionRepository());
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

/**
 * Admin nâng/đổi gói cho OWNER (ghi nhận tiền mặt / CK ngoài app).
 * `userId` = OWNER userId. BE tự đổi gói → status ACTIVE + gia hạn + push noti.
 */
export async function upgradeOwnerSubscriptionAction(
  userId: string,
  input: {
    amount: number;
    planId?: string;
    cycle?: 'monthly' | 'yearly';
    rooms?: number;
    days?: number;
    reference?: string;
    note?: string;
  },
) {
  const result = await toResult(async () => {
    await requireAdmin();
    const id = z.string().uuid('userId không hợp lệ').parse(userId);
    return markSubscriptionPaidUseCase(subscriptionRepository(), {
      subscriptionId: id,
      paidAmount: input.amount,
      planId: input.planId,
      cycle: input.cycle,
      rooms: input.rooms,
      days: input.days,
      reference: input.reference,
      note: input.note,
    });
  });
  if (result.ok) {
    revalidatePath('/admin/payments');
    revalidatePath(`/admin/users/${userId}`);
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

/** Admin ghi nhận ghi chú cuộc gọi đòi nợ. `userId` = OWNER userId. */
export async function addSubscriptionCallLogAction(
  userId: string,
  note: string,
) {
  const result = await toResult(async () => {
    await requireAdmin();
    const id = z.string().uuid('userId không hợp lệ').parse(userId);
    return addSubscriptionCallLogUseCase(subscriptionRepository(), {
      userId: id,
      note,
    });
  });
  if (result.ok) {
    revalidatePath('/admin/payments');
    revalidatePath(`/admin/users/${userId}`);
  }
  return result;
}

/** Admin xem danh sách ghi chú cuộc gọi (newest-first). */
export async function listSubscriptionCallLogsAction(userId: string) {
  return toResult(async () => {
    await requireAdmin();
    const id = z.string().uuid('userId không hợp lệ').parse(userId);
    return listSubscriptionCallLogsUseCase(subscriptionRepository(), id);
  });
}
