import { BookingDetailClient } from '@/components/host/booking-detail-client';

export default async function BookingDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Dữ liệu fetch phía CLIENT từ /api/bookings/:id → hiện endpoint trong Network */}
      <BookingDetailClient id={id} created={sp.created === '1'} />
    </div>
  );
}
