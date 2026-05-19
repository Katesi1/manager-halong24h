import type {
  Notification,
  NotificationFilters,
} from '@/core/entities/notification';

export interface NotificationRepository {
  list(filters?: NotificationFilters): Promise<Notification[]>;
  unreadCount(): Promise<number>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}
