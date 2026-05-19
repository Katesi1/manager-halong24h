/**
 * Calendar — property-level grid theo API spec §12.
 *
 *   GET /calendar/grid?from=...&to=...&propertyIds=...
 *   POST /calendar/lock          → khoá ngày
 *   DELETE /calendar/lock        → mở khoá
 *   PATCH /calendar/sold         → đánh dấu đã bán
 */

export const CalendarStatus = {
  AVAILABLE: 0,
  LOCKED: 1,
  HOLD: 2,
  BOOKED: 3,
} as const;

export type CalendarStatus =
  (typeof CalendarStatus)[keyof typeof CalendarStatus];

export interface CalendarDay {
  /** YYYY-MM-DD */
  date: string;
  status: CalendarStatus;
  /** Tên khách (có ở /grid auth, không có ở /public-grid) */
  note: string | null;
  /** Optional bookingId nếu BE gắn vào (mở rộng tương lai) */
  bookingId?: string | null;
}

export interface CalendarGridProperty {
  id: string;
  name: string;
  /** ISO date range trùng với filters.from..to */
  days: CalendarDay[];
}

export interface CalendarGrid {
  from: string;
  to: string;
  properties: CalendarGridProperty[];
}

export interface CalendarGridFilters {
  from: string;
  to: string;
  propertyIds?: string[];
}

export interface LockDateInput {
  propertyId: string;
  /** YYYY-MM-DD */
  date: string;
}

export interface UnlockDateInput {
  propertyId: string;
  date: string;
}

export interface MarkSoldInput {
  propertyId: string;
  date: string;
}

export const CALENDAR_STATUS_LABEL: Record<CalendarStatus, string> = {
  [CalendarStatus.AVAILABLE]: 'Trống',
  [CalendarStatus.LOCKED]: 'Đã khóa',
  [CalendarStatus.HOLD]: 'Đang giữ',
  [CalendarStatus.BOOKED]: 'Đã đặt',
};

/**
 * Legacy event entity — vẫn export để các trang chưa migrate không vỡ.
 * @deprecated dùng CalendarGrid + CalendarDay.
 */
export type CalendarEventType = 'booking' | 'block' | 'maintenance' | 'hold';

export interface CalendarEvent {
  id: string;
  propertyId: string;
  propertyName: string;
  type: CalendarEventType;
  title: string;
  startAt: string;
  endAt: string;
  guestName: string | null;
  notes: string | null;
}

export interface CalendarFilters {
  propertyId?: string;
  from?: string;
  to?: string;
}
