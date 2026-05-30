'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as Popover from '@radix-ui/react-popover';
import { Lock, Unlock, Plus, Eye, X } from 'lucide-react';

import {
  lockDateAction,
  unlockDateAction,
} from '@/app/actions/calendar';
import {
  CALENDAR_STATUS_LABEL,
  CalendarStatus,
  type CalendarDay,
  type CalendarGridProperty,
} from '@/core/entities/calendar';
import { dowLabel, formatDate, todayISO } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface CalendarGridProps {
  from: string;
  to: string;
  properties: CalendarGridProperty[];
}

interface CellState {
  propertyId: string;
  propertyName: string;
  date: string;
  status: CalendarStatus;
  note: string | null;
}

export function CalendarGrid({ properties }: CalendarGridProps) {
  if (properties.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cream-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7 text-ink-400">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold text-navy-900">
          Chưa có cơ sở nào
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          Thêm cơ sở để bắt đầu quản lý lịch phòng.
        </p>
      </div>
    );
  }

  const dates = properties[0]?.days.map((d) => d.date) ?? [];
  const today = todayISO();

  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
      <div
        className="grid min-w-max"
        style={{
          gridTemplateColumns: `220px repeat(${dates.length}, minmax(52px, 1fr))`,
        }}
      >
        {/* Header row */}
        <div className="sticky left-0 z-20 flex items-end border-b border-r border-ink-200 bg-cream-50 px-4 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
            Cơ sở
          </span>
        </div>
        {dates.map((d) => (
          <DateHeader key={d} date={d} isToday={d === today} />
        ))}

        {/* Property rows */}
        {properties.map((prop) => (
          <PropertyRow key={prop.id} property={prop} today={today} />
        ))}
      </div>
    </div>
  );
}

function DateHeader({ date, isToday }: { date: string; isToday: boolean }) {
  const dt = new Date(date);
  const dow = dt.getUTCDay();
  const isWeekend = dow === 0 || dow === 5 || dow === 6;
  const dayNum = dt.getUTCDate();
  const month = dt.getUTCMonth() + 1;
  const isFirstOfMonth = dayNum === 1;

  return (
    <div
      className={cn(
        'border-b border-r border-ink-200 px-1 py-2 text-center transition-colors',
        isToday ? 'bg-navy-50' : 'bg-cream-50',
      )}
    >
      <p
        className={cn(
          'text-[10px] font-semibold uppercase leading-none',
          isWeekend ? 'text-rose-500' : 'text-ink-400',
        )}
      >
        {dowLabel(date)}
      </p>
      <p
        className={cn(
          'mt-1 text-sm font-bold leading-none',
          isToday
            ? 'mx-auto grid h-6 w-6 place-items-center rounded-full bg-navy-900 text-white text-xs'
            : 'text-ink-900',
        )}
      >
        {dayNum}
      </p>
      {isFirstOfMonth && (
        <p className="mt-0.5 text-[9px] font-medium text-ink-400">
          T{month}
        </p>
      )}
    </div>
  );
}

function PropertyRow({
  property,
  today,
}: {
  property: CalendarGridProperty;
  today: string;
}) {
  return (
    <>
      <div className="sticky left-0 z-10 flex items-center gap-2.5 border-b border-r border-ink-200 bg-white px-4 py-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900 truncate leading-tight">
            {property.name}
          </p>
          <p className="text-[10px] text-ink-400 font-mono truncate">
            {property.id.slice(0, 12)}
          </p>
        </div>
      </div>
      {property.days.map((day) => (
        <CalendarCell
          key={day.date}
          propertyId={property.id}
          propertyName={property.name}
          day={day}
          isToday={day.date === today}
        />
      ))}
    </>
  );
}

const CELL_BG: Record<CalendarStatus, string> = {
  [CalendarStatus.AVAILABLE]: 'bg-emerald-50/50 hover:bg-emerald-100/70',
  [CalendarStatus.LOCKED]: 'bg-rose-50 hover:bg-rose-100',
  [CalendarStatus.HOLD]: 'bg-amber-100/70 hover:bg-amber-200/70',
  [CalendarStatus.BOOKED]: 'bg-navy-700 hover:bg-navy-800',
};

const CELL_ICON: Record<CalendarStatus, React.ReactNode> = {
  [CalendarStatus.AVAILABLE]: null,
  [CalendarStatus.LOCKED]: <Lock className="h-3 w-3 text-rose-400" />,
  [CalendarStatus.HOLD]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-amber-600">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  [CalendarStatus.BOOKED]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3 text-white/90">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

function CalendarCell({
  propertyId,
  propertyName,
  day,
  isToday,
}: {
  propertyId: string;
  propertyName: string;
  day: CalendarDay;
  isToday: boolean;
}) {
  const cellState: CellState = {
    propertyId,
    propertyName,
    date: day.date,
    status: day.status,
    note: day.note,
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`${formatDate(day.date)} · ${CALENDAR_STATUS_LABEL[day.status]}`}
          className={cn(
            'relative flex h-12 items-center justify-center border-b border-r border-ink-100 transition-all cursor-pointer',
            CELL_BG[day.status],
            isToday && 'ring-2 ring-inset ring-navy-400/40',
          )}
        >
          {CELL_ICON[day.status]}
          {day.note && (
            <span className="absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-gold-500" />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 w-72 rounded-xl bg-white p-0 shadow-floating ring-1 ring-ink-200/60 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <CellMenu state={cellState} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function CellMenu({ state }: { state: CellState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onLock() {
    setError(null);
    startTransition(async () => {
      const r = await lockDateAction({
        propertyId: state.propertyId,
        date: state.date,
      });
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  function onUnlock() {
    setError(null);
    startTransition(async () => {
      const r = await unlockDateAction({
        propertyId: state.propertyId,
        date: state.date,
      });
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="border-b border-ink-100 bg-cream-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-ink-500">
            {formatDate(state.date)}
          </p>
          <StatusBadge status={state.status} />
        </div>
        <p className="mt-1 text-sm font-bold text-navy-900 truncate">
          {state.propertyName}
        </p>
        {state.note && (
          <p className="mt-1 text-xs text-ink-500 italic">{state.note}</p>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="p-2">
        {state.status === CalendarStatus.AVAILABLE && (
          <>
            <MenuBtn
              icon={<Plus className="h-4 w-4" />}
              label="Tạo đặt phòng"
              sub="Tạo booking mới cho ngày này"
              onClick={() =>
                router.push(
                  `/host/bookings/new?propertyId=${state.propertyId}&checkIn=${state.date}`,
                )
              }
              disabled={pending}
            />
            <MenuBtn
              icon={<Lock className="h-4 w-4" />}
              label="Khoá ngày"
              sub="Chặn đặt phòng cho ngày này"
              onClick={onLock}
              disabled={pending}
              variant="danger"
            />
          </>
        )}
        {state.status === CalendarStatus.LOCKED && (
          <MenuBtn
            icon={<Unlock className="h-4 w-4" />}
            label="Mở khoá"
            sub="Cho phép đặt phòng lại"
            onClick={onUnlock}
            disabled={pending}
          />
        )}
        {(state.status === CalendarStatus.HOLD ||
          state.status === CalendarStatus.BOOKED) && (
          <MenuBtn
            icon={<Eye className="h-4 w-4" />}
            label={
              state.status === CalendarStatus.HOLD
                ? 'Xem đặt phòng đang giữ'
                : 'Xem đặt phòng'
            }
            sub="Mở chi tiết booking liên quan"
            onClick={() =>
              router.push(
                `/host/bookings?propertyId=${state.propertyId}&from=${state.date}`,
              )
            }
            disabled={pending}
          />
        )}
      </div>

      <Popover.Close asChild>
        <button
          type="button"
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </Popover.Close>
    </div>
  );
}

function MenuBtn({
  icon,
  label,
  sub,
  onClick,
  disabled,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:opacity-50',
        variant === 'danger'
          ? 'hover:bg-rose-50 text-rose-700'
          : 'hover:bg-cream-100 text-ink-900',
      )}
    >
      <div
        className={cn(
          'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
          variant === 'danger' ? 'bg-rose-50' : 'bg-cream-100',
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        <p className="text-[11px] text-ink-500 leading-tight">{sub}</p>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: CalendarStatus }) {
  const cls: Record<CalendarStatus, string> = {
    [CalendarStatus.AVAILABLE]: 'bg-emerald-100 text-emerald-700',
    [CalendarStatus.LOCKED]: 'bg-rose-100 text-rose-700',
    [CalendarStatus.HOLD]: 'bg-amber-100 text-amber-800',
    [CalendarStatus.BOOKED]: 'bg-navy-100 text-navy-900',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        cls[status],
      )}
    >
      {CALENDAR_STATUS_LABEL[status]}
    </span>
  );
}
