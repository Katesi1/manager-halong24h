'use client';

import { CalendarGrid } from '@/components/host/calendar-grid';
import { CalendarToolbar } from '@/components/host/calendar-toolbar';
import {
  CALENDAR_STATUS_LABEL,
  CalendarStatus,
  type CalendarGrid as CalendarGridData,
} from '@/core/entities/calendar';
import { addDays, formatDate, todayISO } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

interface CalendarData {
  grid: CalendarGridData;
  gridError: string | null;
  ownedProperties: { id: string; name: string }[];
}

const LEGEND = [
  { status: CalendarStatus.AVAILABLE, cls: 'bg-emerald-100 ring-1 ring-emerald-300', label: CALENDAR_STATUS_LABEL[CalendarStatus.AVAILABLE] },
  { status: CalendarStatus.BOOKED, cls: 'bg-gradient-to-r from-navy-700 to-navy-800', label: CALENDAR_STATUS_LABEL[CalendarStatus.BOOKED] },
  { status: CalendarStatus.HOLD, cls: 'bg-amber-300', label: CALENDAR_STATUS_LABEL[CalendarStatus.HOLD] },
  { status: CalendarStatus.LOCKED, cls: 'bg-[repeating-linear-gradient(135deg,_theme(colors.rose.200)_0,_theme(colors.rose.200)_3px,_theme(colors.rose.50)_3px,_theme(colors.rose.50)_6px)]', label: CALENDAR_STATUS_LABEL[CalendarStatus.LOCKED] },
];

/**
 * Lịch phòng fetch từ `/api/host/calendar` PHÍA CLIENT → endpoint hiện trong
 * F12 Network. Bento stats + toolbar (URL) + grid tương tác.
 */
export function HostCalendarClient({
  start,
  days,
  property,
}: {
  start: string;
  days: number;
  property?: string;
}) {
  const params = new URLSearchParams();
  params.set('start', start);
  params.set('days', String(days));
  if (property) params.set('property', property);
  const { loading, error, data } = useApiResource<CalendarData>(
    `/api/host/calendar?${params.toString()}`,
  );

  if (loading) {
    return <div className="py-16 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error || !data) {
    return (
      <div
        role="alert"
        className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
      >
        <span className="font-semibold">Không tải được lịch: </span>
        {error ?? 'Lỗi'}
      </div>
    );
  }

  const grid = data.grid;
  const to = addDays(start, days - 1);
  const filterOptions = data.ownedProperties.length
    ? data.ownedProperties
    : grid.properties.map((p) => ({ id: p.id, name: p.name }));

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
    <>
      {data.gridError && (
        <div
          role="alert"
          className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          <span className="font-semibold">Không tải được lịch: </span>
          {data.gridError}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <BentoBig
          label="Tỷ lệ lấp đầy"
          subLabel={`${days} ngày · ${totalRooms} cơ sở`}
          value={`${occupancyPct}%`}
          bar={occupancyPct}
        />
        <BentoStat label="Hôm nay đã đặt" value={bookedToday} total={totalRooms} tone="navy" />
        <BentoStat label="Hôm nay còn trống" value={availableToday} total={totalRooms} tone="emerald" />
        <BentoStat label="Hôm nay đang khoá" value={lockedToday} total={totalRooms} tone="rose" />
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

      <div className="mb-4">
        <CalendarToolbar
          start={start}
          days={days}
          properties={filterOptions}
          selectedPropertyId={property}
        />
      </div>

      <p className="mb-3 text-xs text-ink-500">
        Khoảng đang xem:{' '}
        <span className="font-semibold text-navy-900">{formatDate(start)}</span>{' '}
        <span className="text-ink-300">→</span>{' '}
        <span className="font-semibold text-navy-900">{formatDate(to)}</span>
      </p>

      <CalendarGrid from={grid.from} to={grid.to} properties={grid.properties} />
    </>
  );
}

function BentoBig({
  label,
  subLabel,
  value,
  bar,
}: {
  label: string;
  subLabel: string;
  value: string;
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
