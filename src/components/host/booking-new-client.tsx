'use client';

import Link from 'next/link';

import { BookingHoldForm } from '@/components/host/booking-hold-form';
import { GuardBanner } from '@/components/host/guard-banner';
import { PageHeader } from '@/components/host/page-header';
import { Button } from '@/components/ui/button';
import type { HostGate } from '@/lib/host-gate';
import { useApiResource } from '@/lib/use-api-resource';

interface PropertyOption {
  id: string;
  name: string;
  standardGuests: number | null;
  maxGuests: number | null;
}

interface BookingNewData {
  gate: HostGate | null;
  loadFailed: boolean;
  properties: PropertyOption[];
}

interface Defaults {
  propertyId?: string;
  checkInAt?: string;
  checkOutAt?: string;
}

/**
 * Trang tạo đặt phòng fetch từ `/api/host/booking-new` PHÍA CLIENT → endpoint
 * hiện trong F12 Network. Route enforce guard + trả danh sách cơ sở.
 */
export function BookingNewClient({ defaults }: { defaults: Defaults }) {
  const { loading, error, data } = useApiResource<BookingNewData>(
    '/api/host/booking-new',
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center text-sm text-ink-500">
        Đang tải…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200 max-w-2xl mx-auto">
          {error ?? 'Không tải được trang'}
        </div>
      </div>
    );
  }

  if (data.gate) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <GuardBanner {...data.gate} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        backHref="/host/bookings"
        backLabel="Quay lại danh sách đặt phòng"
        title="Tạo đặt phòng mới"
        description="Khách đến trực tiếp, đặt qua điện thoại, hoặc nhập từ kênh khác. Đặt phòng ở trạng thái giữ chỗ 30 phút — sau đó xác nhận để chốt."
        breadcrumbs={[
          { label: 'Đặt phòng', href: '/host/bookings' },
          { label: 'Tạo mới' },
        ]}
      />

      {data.loadFailed ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-12 text-center">
          <p className="text-2xl">⚠️</p>
          <p className="mt-3 font-medium text-rose-900">
            Không tải được danh sách cơ sở.
          </p>
          <p className="mt-1 text-sm text-rose-700">
            Vui lòng tải lại trang. Nếu vẫn chưa được, hãy thử lại sau ít phút.
          </p>
          <Link href="/host/bookings/new" className="mt-5 inline-block">
            <Button variant="outline">Tải lại</Button>
          </Link>
        </div>
      ) : data.properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <p className="text-2xl">🏡</p>
          <p className="mt-3 font-medium text-ink-700">
            Bạn chưa có cơ sở nào để nhận đặt phòng.
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Hãy tạo cơ sở (homestay, khách sạn, căn hộ…) trước, sau đó quay lại
            tạo đặt phòng cho khách.
          </p>
          <Link href="/host/properties/new" className="mt-5 inline-block">
            <Button>+ Thêm cơ sở</Button>
          </Link>
        </div>
      ) : (
        <BookingHoldForm properties={data.properties} defaults={defaults} />
      )}
    </div>
  );
}
