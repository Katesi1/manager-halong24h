import type { Booking, BookingStatus, RoomBlock } from './legacy-types';

export type CellStatus = 'free' | 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'block';

export interface CellInfo {
  status: CellStatus;
  bookingId?: string;
  guestName?: string;
  guestPhone?: string;
  bookingCode?: string;
  isFirstNight?: boolean;
  isLastNight?: boolean;
  blockReason?: string;
}

/** YYYY-MM-DD list từ start, length days */
export function dateRange(start: string, days: number): string[] {
  const list: string[] = [];
  const cur = new Date(start);
  for (let i = 0; i < days; i++) {
    list.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return list;
}

/** Map booking status sang cell status */
function bookingToCellStatus(s: BookingStatus): CellStatus {
  if (s === 'pending') return 'pending';
  if (s === 'confirmed') return 'confirmed';
  if (s === 'checked_in') return 'checked_in';
  if (s === 'checked_out') return 'checked_out';
  return 'free'; // cancelled
}

/** Cho 1 phòng + 1 ngày, trả về cell info dựa trên bookings + blocks.
 *  Booking nights = [check_in, check_out) — đêm cuối là check_out - 1. */
export function cellFor(
  date: string,
  bookings: Pick<Booking, 'id' | 'code' | 'check_in' | 'check_out' | 'guest_name' | 'guest_phone' | 'status'>[],
  blocks: Pick<RoomBlock, 'id' | 'start_date' | 'end_date' | 'reason'>[],
): CellInfo {
  // Block check (block: end_date inclusive)
  const block = blocks.find((b) => date >= b.start_date && date <= b.end_date);
  if (block) {
    return { status: 'block', blockReason: block.reason ?? 'Đã chặn' };
  }

  // Booking: nights = [check_in, check_out)
  const booking = bookings.find(
    (b) => date >= b.check_in && date < b.check_out && b.status !== 'cancelled',
  );
  if (booking) {
    return {
      status: bookingToCellStatus(booking.status),
      bookingId: booking.id,
      bookingCode: booking.code,
      guestName: booking.guest_name,
      guestPhone: booking.guest_phone,
      isFirstNight: date === booking.check_in,
      isLastNight: (() => {
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        return next.toISOString().slice(0, 10) === booking.check_out;
      })(),
    };
  }

  return { status: 'free' };
}

export const CELL_LABEL: Record<CellStatus, string> = {
  free: 'Trống',
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đang ở',
  checked_out: 'Đã rời',
  block: 'Chặn',
};

export const CELL_COLOR: Record<CellStatus, string> = {
  free: 'bg-white hover:bg-emerald-50',
  pending: 'bg-amber-200 hover:bg-amber-300',
  confirmed: 'bg-navy-700 hover:bg-navy-800 text-white',
  checked_in: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  checked_out: 'bg-ink-300 hover:bg-ink-400',
  block: 'bg-rose-100 hover:bg-rose-200 ring-rose-300',
};
