'use server';

import { revalidatePath } from 'next/cache';

import {
  listNotificationsUseCase,
  markAllNotificationsReadUseCase,
  markNotificationReadUseCase,
  notificationUnreadCountUseCase,
} from '@/application/notifications/list';
import type { NotificationFilters } from '@/core/entities/notification';
import { notificationRepository } from '@/infrastructure/container';
import { requireManagerRole } from '@/lib/auth-guard';

import { toResult } from './_helpers';

export async function listNotificationsAction(filters?: NotificationFilters) {
  return toResult(async () => {
    await requireManagerRole();
    return listNotificationsUseCase(notificationRepository(), filters);
  });
}

export async function getUnreadNotificationCountAction() {
  return toResult(async () => {
    await requireManagerRole();
    return notificationUnreadCountUseCase(notificationRepository());
  });
}

export async function markNotificationReadAction(id: string) {
  const result = await toResult(async () => {
    await requireManagerRole();
    return markNotificationReadUseCase(notificationRepository(), id);
  });
  if (result.ok) revalidatePath('/host');
  return result;
}

export async function markAllNotificationsReadAction() {
  const result = await toResult(async () => {
    await requireManagerRole();
    return markAllNotificationsReadUseCase(notificationRepository());
  });
  if (result.ok) revalidatePath('/host');
  return result;
}
