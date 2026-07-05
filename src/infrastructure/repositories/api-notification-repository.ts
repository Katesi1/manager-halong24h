import 'server-only';

import type {
  Notification,
  NotificationFilters,
} from '@/core/entities/notification';
import type { NotificationRepository } from '@/application/ports/notification-repository';

import { apiClient } from '../http/api-client';

/** NotificationDto spec §8.2 — đọc tolerant cả tên field cũ FE từng giả định */
interface RawNotification {
  id: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  type?: number | string;
  isRead?: boolean;
  readAt?: string | null;
  createdAt: string;
  targetId?: string | null;
  targetType?: string | null;
  link?: string | null;
  metadata?: Record<string, unknown>;
}

const TYPE_MAP: Record<number, string> = {
  0: 'booking',
  1: 'payment',
  2: 'system',
};

function mapNotification(r: RawNotification): Notification {
  return {
    id: r.id,
    type:
      typeof r.type === 'number'
        ? (TYPE_MAP[r.type] ?? 'system')
        : (r.type ?? 'system'),
    title: r.title,
    body: r.body ?? r.subtitle ?? null,
    link: r.link ?? null,
    targetType: r.targetType ?? null,
    targetId: r.targetId ?? null,
    // BE trả boolean isRead, không có timestamp — dùng createdAt làm mốc
    readAt: r.readAt ?? (r.isRead ? r.createdAt : null),
    createdAt: r.createdAt,
    metadata: r.metadata,
  };
}

export class ApiNotificationRepository implements NotificationRepository {
  async list(filters?: NotificationFilters): Promise<Notification[]> {
    const raw = await apiClient.get<RawNotification[]>('/notifications', {
      query: {
        unreadOnly: filters?.unreadOnly,
        limit: filters?.limit,
      },
      cache: 'no-store',
    });
    return (raw ?? []).map(mapNotification);
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
