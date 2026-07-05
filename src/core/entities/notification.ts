export type NotificationType =
  | 'booking_new'
  | 'booking_paid'
  | 'booking_cancelled'
  | 'lead_new'
  | 'message_new'
  | 'review_new'
  | 'payment_received'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType | string;
  title: string;
  body: string | null;
  link: string | null;
  /** Đối tượng notification trỏ tới (spec §8.2) — vd 'booking', 'conversation' */
  targetType: string | null;
  targetId: string | null;
  readAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  unreadOnly?: boolean;
  limit?: number;
}
