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
import { addDays, formatDate, todayISO } from '@/lib/format';

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
  let totalCells = 0;
  let bookedCells = 0;
  let lockedCells = 0;

  for (const p of grid.properties) {
    for (const d of p.days) {
      totalCells++;
      if (d.status === CalendarStatus.BOOKED) bookedCells++;
      else if (d.status === CalendarStatus.LOCKED) lockedCells++;
      if (d.date === todayStr) {
        if (d.status === CalendarStatus.BOOKED) bookedToday++;
        else if (d.status === CalendarStatus.LOCKED) lockedToday++;
        else if (d.status === CalendarStatus.AVAILABLE) availableToday++;
      }
    }
  }

  const occupancyPct = totalCells === 0 ? 0 : Math.round((bookedCells / totalCells) * 100);
  const lockPct = totalCells === 0 ? 0 : Math.round((lockedCells / totalCells) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50/50 via-white to-cream-50/30 p-4 sm:p-6 lg:p-8">
      {/* Editorial header */}
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
              Theo dõi tình trạng từng đêm theo cơ sở. Kéo chọn nhiều ô để khoá hoặc mở khoá hàng loạt — bấm vào thanh đặt phòng để xem chi tiết.
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

      {apiError && (
        <div
          role="alert"
          className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          <span className="font-semibold">Không tải được lịch: </span>
          {apiError}
        </div>
      )}

      {/* Bento stats panel */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <BentoBig
          label="Tỷ lệ lấp đầy"
          subLabel={`${days} ngày · ${totalRooms} cơ sở`}
          value={`${occupancyPct}%`}
          accent="navy"
          bar={occupancyPct}
        />
        <BentoStat
          label="Hôm nay đã đặt"
          value={bookedToday}
          total={totalRooms}
          tone="navy"
        />
        <BentoStat
          label="Hôm nay còn trống"
          value={availableToday}
          total={totalRooms}
          tone="emerald"
        />
        <BentoStat
          label="Hôm nay đang khoá"
          value={lockedToday}
          total={totalRooms}
          tone="rose"
        />
        <BentoSmall
          label="Tổng đêm đã đặt"
          value={bookedCells.toLocaleString('vi-VN')}
          sub={`/ ${totalCells.toLocaleString('vi-VN')} đêm`}
        />
        <BentoSmall
          label="Ngày khoá"
          value={lockedCells.toLocaleString('vi-VN')}
          sub={`${lockPct}% kỳ`}
          tone="rose"
        />
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-ink-600">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
          Chú thích
        </span>
        {LEGEND.map(({ status, cls, label }) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-3.5 rounded-sm ${cls}`} />
            {label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-ink-500">
          <span className="inline-block h-2.5 w-3.5 rounded-sm bg-navy-50 ring-2 ring-inset ring-navy-600" />
          Ô đang chọn
        </span>
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

      {/* Date range pill — editorial subtitle for the grid */}
      <p className="mb-3 text-xs text-ink-500">
        Khoảng đang xem:{' '}
        <span className="font-semibold text-navy-900">{formatDate(start)}</span>{' '}
        <span className="text-ink-300">→</span>{' '}
        <span className="font-semibold text-navy-900">{formatDate(to)}</span>
      </p>

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
  { status: CalendarStatus.BOOKED, cls: 'bg-gradient-to-r from-navy-700 to-navy-800', label: CALENDAR_STATUS_LABEL[CalendarStatus.BOOKED] },
  { status: CalendarStatus.HOLD, cls: 'bg-amber-300', label: CALENDAR_STATUS_LABEL[CalendarStatus.HOLD] },
  { status: CalendarStatus.LOCKED, cls: 'bg-[repeating-linear-gradient(135deg,_theme(colors.rose.200)_0,_theme(colors.rose.200)_3px,_theme(colors.rose.50)_3px,_theme(colors.rose.50)_6px)]', label: CALENDAR_STATUS_LABEL[CalendarStatus.LOCKED] },
];

function BentoBig({
  label,
  subLabel,
  value,
  accent,
  bar,
}: {
  label: string;
  subLabel: string;
  value: string;
  accent: 'navy';
  bar: number;
}) {
  return (
    <div className="col-span-2 row-span-1 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-4 text-white ring-1 ring-navy-700 shadow-sm">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
          {label}
        </p>
        <p className="mt-2 font-display text-4xl font-bold leading-none tabular-nums">
          {value}
        </p>
        <p className="mt-1 text-[11px] text-white/50">{subLabel}</p>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500 transition-all"
          style={{ width: `${Math.min(100, bar)}%` }}
        />
      </div>
    </div>
  );
}

function BentoStat({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: 'navy' | 'emerald' | 'rose';
}) {
  const toneCls: Record<typeof tone, string> = {
    navy: 'text-navy-900',
    emerald: 'text-emerald-700',
    rose: 'text-rose-600',
  };
  const ringCls: Record<typeof tone, string> = {
    navy: 'ring-navy-100',
    emerald: 'ring-emerald-100',
    rose: 'ring-rose-100',
  };
  return (
    <div className={`rounded-2xl bg-white p-4 ring-1 ${ringCls[tone]} shadow-sm`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl font-bold leading-none tabular-nums ${toneCls[tone]}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-ink-500">/ {total} cơ sở</p>
    </div>
  );
}

function BentoSmall({
  label,
  value,
  sub,
  tone = 'navy',
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'navy' | 'rose';
}) {
  const cls = tone === 'rose' ? 'text-rose-600' : 'text-navy-900';
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-ink-200/60 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
        {label}
      </p>
      <p className={`mt-2 font-display text-2xl font-bold leading-none tabular-nums ${cls}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-ink-500">{sub}</p>
    </div>
  );
}
