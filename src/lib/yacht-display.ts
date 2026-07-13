import type { YachtBookingStatus } from '@/core/entities/yacht-booking';

/** Nhãn + màu badge trạng thái đơn du thuyền (dùng chung list + detail). */
export const YACHT_BOOKING_STATUS_LABEL: Record<YachtBookingStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận · chờ thanh toán',
  paid: 'Đã thanh toán',
  completed: 'Hoàn tất',
  cancelled: 'Đã huỷ',
};

export const YACHT_BOOKING_STATUS_VARIANT: Record<
  YachtBookingStatus,
  string
> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
  paid: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  completed: 'bg-navy-50 text-navy-800 ring-navy-200',
  cancelled: 'bg-ink-100 text-ink-600 ring-ink-200',
};

export const YACHT_BOOKING_STATUSES: YachtBookingStatus[] = [
  'pending',
  'confirmed',
  'paid',
  'completed',
  'cancelled',
];

export function isYachtBookingStatus(v: string): v is YachtBookingStatus {
  return (YACHT_BOOKING_STATUSES as string[]).includes(v);
}
