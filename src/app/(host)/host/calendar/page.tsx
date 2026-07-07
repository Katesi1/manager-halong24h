import type { Metadata } from 'next';
import Link from 'next/link';

import { HostCalendarClient } from '@/components/host/host-calendar-client';
import { Button } from '@/components/ui/button';
import { todayISO } from '@/lib/format';

export const metadata: Metadata = { title: 'Lịch phòng' };

interface SearchParams {
  start?: string;
  days?: string;
  property?: string;
}

export default async function CalendarPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await props.searchParams;
  const start = sp.start ?? todayISO();
  const days = sp.days ? Math.min(31, Math.max(7, Number(sp.days))) : 14;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50/50 via-white to-cream-50/30 p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-600">
              Quản lý cơ sở · Lịch phòng
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-[1.05] tracking-tight text-navy-900 sm:text-5xl">
              Lịch phòng
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500 sm:text-base">
              Theo dõi tình trạng từng đêm theo cơ sở. Kéo chọn nhiều ô để khoá
              hoặc mở khoá hàng loạt — bấm vào thanh đặt phòng để xem chi tiết.
            </p>
          </div>
          <Link href="/host/bookings/new">
            <Button size="lg" className="rounded-2xl shadow-sm">
              <span className="text-base">+</span>
              <span>Tạo đặt phòng</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Dữ liệu fetch phía CLIENT từ /api/host/calendar → hiện endpoint trong Network */}
      <HostCalendarClient start={start} days={days} property={sp.property} />
    </div>
  );
}
