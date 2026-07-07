import { AdminBookingsClient } from '@/components/admin/admin-bookings-client';
import { PageHeader } from '@/components/host/page-header';
import type { BookingStatus } from '@/core/entities/booking';

const VALID_STATUS: ReadonlySet<string> = new Set<BookingStatus>([
  'hold',
  'confirmed',
  'paid',
  'cancelled',
  'completed',
  'no_show',
]);

export default async function AdminBookingsPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await props.searchParams;
  const status =
    sp.status && VALID_STATUS.has(sp.status)
      ? (sp.status as BookingStatus)
      : undefined;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Vận hành"
        title="Tất cả booking"
        description="Theo dõi mọi đặt phòng trên toàn hệ thống. Bấm vào một dòng để xem chi tiết."
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/admin/bookings → hiện endpoint trong Network */}
      <AdminBookingsClient status={status} />
    </div>
  );
}
