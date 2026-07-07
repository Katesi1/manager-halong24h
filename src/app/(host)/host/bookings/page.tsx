import type { Metadata } from 'next';
import Link from 'next/link';

import { BookingsTableClient } from '@/components/host/bookings-table-client';
import { PageHeader } from '@/components/host/page-header';
import { Button } from '@/components/ui/button';
import type { BookingStatus } from '@/core/entities/booking';

export const metadata: Metadata = { title: 'Đặt phòng' };

const TABS: { key: '' | BookingStatus; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'hold', label: 'Đang giữ' },
  { key: 'confirmed', label: 'Chờ cọc' },
  { key: 'paid', label: 'Đã nhận tiền' },
  { key: 'completed', label: 'Hoàn tất' },
  { key: 'no_show', label: 'Khách không đến' },
  { key: 'cancelled', label: 'Đã huỷ' },
];

function isBookingStatus(s: string | undefined): s is BookingStatus {
  return (
    s === 'hold' ||
    s === 'confirmed' ||
    s === 'paid' ||
    s === 'cancelled' ||
    s === 'completed' ||
    s === 'no_show'
  );
}

export default async function BookingsListPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await props.searchParams;
  const status = isBookingStatus(sp.status) ? sp.status : undefined;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Đặt phòng"
        description="Quản lý đặt phòng — khách trực tiếp, đặt online, hoặc từ yêu cầu khách."
        actions={
          <Link href="/host/bookings/new">
            <Button>+ Tạo đặt phòng</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 border-b border-ink-200 overflow-x-auto">
        {TABS.map((t) => {
          const active = (sp.status ?? '') === t.key;
          return (
            <Link
              key={t.key}
              href={t.key ? `/host/bookings?status=${t.key}` : '/host/bookings'}
              className={
                'shrink-0 border-b-2 px-3 py-2 text-sm font-medium ' +
                (active
                  ? 'border-ink-900 text-ink-900'
                  : 'border-transparent text-ink-500 hover:text-ink-900')
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Dữ liệu fetch phía CLIENT từ /api/bookings → hiện endpoint trong Network */}
      <BookingsTableClient status={status} />
    </div>
  );
}
