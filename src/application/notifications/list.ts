import type {
  Notification,
  NotificationFilters,
} from '@/core/entities/notification';
import type { NotificationRepository } from '../ports/notification-repository';

export async function listNotificationsUseCase(
  repo: NotificationRepository,
  filters?: NotificationFilters,
): Promise<Notification[]> {
  return repo.list(filters);
}

export async function notificationUnreadCountUseCase(
  repo: NotificationRepository,
): Promise<number> {
  return repo.unreadCount();
}

export async function markNotificationReadUseCase(
  repo: NotificationRepository,
  id: string,
): Promise<void> {
  await repo.markRead(id);
}

export async function markAllNotificationsReadUseCase(
  repo: NotificationRepository,
): Promise<void> {
  await repo.markAllRead();
}
