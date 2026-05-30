import type { Metadata } from 'next';
import Link from 'next/link';

import { getCalendarGridAction } from '@/app/actions/calendar';
import { listPropertiesAction } from '@/app/actions/properties';
import { CalendarGrid } from '@/components/host/calendar-grid';
import { CalendarToolbar } from '@/components/host/calendar-toolbar';
import { Button } from '@/components/ui/button';
import {
  CALENDAR_STATUS_LABEL,
  CalendarStatus,
} from '@/core/entities/calendar';
import { addDays, todayISO } from '@/lib/format';

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

  const filterOptions = ownedProperties.length
    ? ownedProperties.map((p) => ({ id: p.id, name: p.name }))
    : grid.properties.map((p) => ({ id: p.id, name: p.name }));

  const apiError = !gridResult.ok ? gridResult.error : null;

  const totalRooms = grid.properties.length;
  const todayStr = todayISO();
  let bookedToday = 0;
  let lockedToday = 0;
  let availableToday = 0;
  for (const p of grid.properties) {
    for (const d of p.days) {
      if (d.date === todayStr) {
        if (d.status === CalendarStatus.BOOKED) bookedToday++;
        else if (d.status === CalendarStatus.LOCKED) lockedToday++;
        else if (d.status === CalendarStatus.AVAILABLE) availableToday++;
      }
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">
            Lịch phòng
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Quản lý trạng thái từng ngày. Bấm vào ô để thao tác.
          </p>
        </div>
        <Link href="/host/bookings/new">
          <Button size="sm">+ Tạo đặt phòng</Button>
        </Link>
      </div>

      {apiError && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          <span className="font-semibold">Không tải được lịch: </span>
          {apiError}
        </div>
      )}

      {/* Quick stats + Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-4 rounded-xl bg-white px-4 py-2.5 ring-1 ring-ink-200/60 shadow-sm">
          <MiniStat label="Cơ sở" value={totalRooms} />
          <Sep />
          <MiniStat label="Đã đặt" value={bookedToday} color="text-navy-700" />
          <Sep />
          <MiniStat label="Trống" value={availableToday} color="text-emerald-700" />
          <Sep />
          <MiniStat label="Khoá" value={lockedToday} color="text-rose-600" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-ink-600">
          {LEGEND.map(({ status, cls, label }) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${cls}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4">
        <CalendarToolbar
          start={start}
          days={days}
          properties={filterOptions}
          selectedPropertyId={sp.property}
        />
      </div>

      {/* Grid */}
      <CalendarGrid
        from={grid.from}
        to={grid.to}
        properties={grid.properties}
      />
    </div>
  );
}

const LEGEND = [
  { status: CalendarStatus.AVAILABLE, cls: 'bg-emerald-100 ring-1 ring-emerald-300', label: CALENDAR_STATUS_LABEL[CalendarStatus.AVAILABLE] },
  { status: CalendarStatus.BOOKED, cls: 'bg-navy-700', label: CALENDAR_STATUS_LABEL[CalendarStatus.BOOKED] },
  { status: CalendarStatus.HOLD, cls: 'bg-amber-300', label: CALENDAR_STATUS_LABEL[CalendarStatus.HOLD] },
  { status: CalendarStatus.LOCKED, cls: 'bg-rose-200 ring-1 ring-rose-400', label: CALENDAR_STATUS_LABEL[CalendarStatus.LOCKED] },
];

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center">
      <p className={`font-display text-lg font-bold leading-none ${color ?? 'text-navy-900'}`}>{value}</p>
      <p className="text-[10px] text-ink-500 mt-0.5">{label}</p>
    </div>
  );
}

function Sep() {
  return <div className="h-6 w-px bg-ink-200" />;
}
