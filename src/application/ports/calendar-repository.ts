import type {
  BulkLockInput,
  CalendarEvent,
  CalendarFilters,
  CalendarGrid,
  CalendarGridFilters,
  LockDateInput,
  MarkSoldInput,
  UnlockDateInput,
} from '@/core/entities/calendar';

export interface CalendarRepository {
  /** Lịch grid property × ngày theo spec §12 */
  getGrid(filters: CalendarGridFilters): Promise<CalendarGrid>;

  /** Khoá 1 ngày của property */
  lockDate(input: LockDateInput): Promise<void>;

  /** Mở khoá */
  unlockDate(input: UnlockDateInput): Promise<void>;

  /** Khoá/mở hàng loạt trong 1 request (spec §25.6, tối đa 100 items) */
  bulkLock(input: BulkLockInput): Promise<void>;

  /** Đánh dấu đã bán (manual) */
  markSold(input: MarkSoldInput): Promise<void>;

  /**
   * @deprecated event-based listing — không có endpoint BE. Giữ chữ ký cũ
   * để các page chưa migrate không vỡ; ApiCalendarRepository trả mảng rỗng.
   */
  list(filters?: CalendarFilters): Promise<CalendarEvent[]>;
}
