import type { Metadata } from 'next';
import Link from 'next/link';

import { getCalendarGridAction } from '@/app/actions/calendar';

export const metadata: Metadata = { title: 'Lịch & giá' };
import { listPropertiesAction } from '@/app/actions/properties';
import { CalendarGrid } from '@/components/host/calendar-grid';
import { CalendarToolbar } from '@/components/host/calendar-toolbar';
import { PageHeader } from '@/components/host/page-header';
import { Button } from '@/components/ui/button';
import {
  CALENDAR_STATUS_LABEL,
  CalendarStatus,
} from '@/core/entities/calendar';
import { addDays, todayISO } from '@/lib/format';

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
  const to = addDays(start, days - 1);

  const [gridResult, propertiesResult] = await Promise.all([
    getCalendarGridAction({
      from: start,
      to,
      propertyIds: sp.property ? [sp.property] : undefined,
    }),
    listPropertiesAction({ includeInactive: true }),
  ]);

  const grid = gridResult.ok
    ? gridResult.data
    : { from: start, to, properties: [] };
  const ownedProperties = propertiesResult.ok ? propertiesResult.data : [];

  // Hiển thị danh sách property cho filter: ưu tiên data thật từ properties API,
  // fallback về danh sách trong grid (mock).
  const filterOptions = ownedProperties.length
    ? ownedProperties.map((p) => ({ id: p.id, name: p.name }))
    : grid.properties.map((p) => ({ id: p.id, name: p.name }));

  const apiError = !gridResult.ok ? gridResult.error : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Lịch phòng"
        description="Quản lý trạng thái từng ngày của mỗi cơ sở. Bấm vào ô để khóa, mở khóa hoặc tạo đặt phòng."
        actions={
          <Link href="/host/bookings/new">
            <Button size="sm">+ Tạo đặt phòng</Button>
          </Link>
        }
      />

      {apiError && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          <span className="font-semibold">Không tải được lịch: </span>
          {apiError}
        </div>
      )}

      <div className="mb-4">
        <CalendarToolbar
          start={start}
          days={days}
          properties={filterOptions}
          selectedPropertyId={sp.property}
        />
      </div>

      <Legend />

      <CalendarGrid from={grid.from} to={grid.to} properties={grid.properties} />
    </div>
  );
}

function Legend() {
  const items: { status: CalendarStatus; swatchClass: string }[] = [
    { status: CalendarStatus.AVAILABLE, swatchClass: 'bg-white ring-1 ring-ink-200' },
    { status: CalendarStatus.LOCKED, swatchClass: 'bg-rose-100 ring-1 ring-rose-300' },
    { status: CalendarStatus.HOLD, swatchClass: 'bg-amber-200' },
    { status: CalendarStatus.BOOKED, swatchClass: 'bg-navy-700' },
  ];
  return (
    <div className="mb-4 flex flex-wrap gap-3 text-xs text-ink-700">
      {items.map(({ status, swatchClass }) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded ${swatchClass}`} />
          {CALENDAR_STATUS_LABEL[status]}
        </span>
      ))}
    </div>
  );
}
