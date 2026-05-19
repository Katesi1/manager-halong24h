import 'server-only';

import type {
  Notification,
  NotificationFilters,
} from '@/core/entities/notification';
import type { NotificationRepository } from '@/application/ports/notification-repository';

import { apiClient } from '../http/api-client';

export class ApiNotificationRepository implements NotificationRepository {
  async list(filters?: NotificationFilters): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/notifications', {
      query: {
        unreadOnly: filters?.unreadOnly,
        limit: filters?.limit,
      },
      cache: 'no-store',
    });
  }

  async unreadCount(): Promise<number> {
    const data = await apiClient.get<number | { count: number }>(
      '/notifications/unread-count',
      { cache: 'no-store' },
    );
    if (typeof data === 'number') return data;
    return data?.count ?? 0;
  }

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  }

  async markAllRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  }
}
