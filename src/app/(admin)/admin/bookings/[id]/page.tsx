import type { Metadata } from 'next';

import { AdminBookingDetailClient } from '@/components/admin/admin-booking-detail-client';

export const metadata: Metadata = { title: 'Chi tiết booking' };

export default async function AdminBookingDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* Dữ liệu fetch phía CLIENT từ /api/admin/bookings/:id → hiện endpoint trong Network */}
      <AdminBookingDetailClient id={id} />
    </div>
  );
}
