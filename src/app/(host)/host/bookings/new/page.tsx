import type { Metadata } from 'next';

import { BookingNewClient } from '@/components/host/booking-new-client';

export const metadata: Metadata = { title: 'Tạo đặt phòng' };

interface SearchParams {
  propertyId?: string;
  checkIn?: string;
  checkOut?: string;
}

export default async function NewBookingPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await props.searchParams;

  // Guard + danh sách cơ sở fetch phía CLIENT từ /api/host/booking-new → Network
  return (
    <BookingNewClient
      defaults={{
        propertyId: sp.propertyId,
        checkInAt: sp.checkIn,
        checkOutAt: sp.checkOut,
      }}
    />
  );
}
