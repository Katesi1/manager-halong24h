'use server';

/**
 * Legacy alias — delegate sang `actions/notifications.ts` (plural, Clean Arch).
 * Giữ lại để các component cũ import không vỡ.
 */
export {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from './notifications';
