'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as Popover from '@radix-ui/react-popover';

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
        <p className="text-2xl">📅</p>
        <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-navy-900">
          Không có cơ sở nào
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          Thêm cơ sở để bắt đầu quản lý lịch.
        </p>
      </div>
    );
  }

  // Tất cả property đều có days[] cùng độ dài; lấy từ phần tử đầu.
  const dates = properties[0]?.days.map((d) => d.date) ?? [];
  const today = todayISO();

  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
      <div
        className="grid min-w-max"
        style={{
          gridTemplateColumns: `240px repeat(${dates.length}, minmax(48px, 1fr))`,
        }}
      >
        <HeaderCorner />
        {dates.map((d) => (
          <DateHeader key={d} date={d} isToday={d === today} />
        ))}

        {properties.map((prop) => (
          <PropertyRow key={prop.id} property={prop} today={today} />
        ))}
      </div>
    </div>
  );
}

function HeaderCorner() {
  return (
    <div className="sticky left-0 z-20 border-b border-r border-ink-200 bg-white px-3 py-3 overline muted no-dash text-[10px]">
      Cơ sở
    </div>
  );
}

function DateHeader({ date, isToday }: { date: string; isToday: boolean }) {
  const dt = new Date(date);
  const dow = dt.getUTCDay();
  const isWeekend = dow === 0 || dow === 5 || dow === 6;
  return (
    <div
      className={cn(
        'border-b border-r border-ink-200 px-1 py-2 text-center',
        isToday && 'bg-navy-50',
      )}
    >
      <p
        className={cn(
          'text-[10px] font-semibold uppercase',
          isWeekend ? 'text-rose-600' : 'text-ink-500',
        )}
      >
        {dowLabel(date)}
      </p>
      <p
        className={cn(
          'text-sm font-bold',
          isToday ? 'text-navy-900' : 'text-ink-900',
        )}
      >
        {dt.getUTCDate()}
      </p>
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
      <div className="sticky left-0 z-10 border-b border-r border-ink-200 bg-white px-3 py-2.5 text-sm">
        <p className="font-semibold text-ink-900 line-clamp-1">
          🏠 {property.name}
        </p>
        <p className="text-[11px] text-ink-500 font-mono">{property.id}</p>
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

const CELL_CLASS: Record<CalendarStatus, string> = {
  [CalendarStatus.AVAILABLE]: 'bg-white hover:bg-emerald-50',
  [CalendarStatus.LOCKED]: 'bg-rose-100 hover:bg-rose-200 ring-1 ring-rose-300 ring-inset',
  [CalendarStatus.HOLD]: 'bg-amber-200 hover:bg-amber-300',
  [CalendarStatus.BOOKED]: 'bg-navy-700 hover:bg-navy-800 text-white',
};

const CELL_INDICATOR: Record<CalendarStatus, string> = {
  [CalendarStatus.AVAILABLE]: '',
  [CalendarStatus.LOCKED]: '×',
  [CalendarStatus.HOLD]: '⏳',
  [CalendarStatus.BOOKED]: '●',
};

// TODO(perf-r4): Lift Popover.Root to grid level instead of per-cell.
// Current: each cell mounts a Radix Popover.Root → ~140 instances for a
// 10-property × 14-day grid. Lifting requires:
//   1) State `selectedCell: CellState | null` on CalendarGrid
//   2) Single <Popover.Root open={!!selectedCell} onOpenChange={close}>
//   3) Position via Popover.Anchor over the clicked cell ref
// Deferred — touching this risks breaking the lock/unlock confirm flow
// and the booking-create navigation. Revisit after we add an E2E test
// covering CellMenu interactions (lock/unlock/create-booking/goto-list).
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
          title={[
            formatDate(day.date),
            CALENDAR_STATUS_LABEL[day.status],
            day.note,
          ]
            .filter(Boolean)
            .join(' · ')}
          className={cn(
            'relative flex h-14 items-center justify-center border-b border-r border-ink-200 text-xs font-semibold transition-colors',
            CELL_CLASS[day.status],
            isToday && 'ring-1 ring-navy-700 ring-inset',
          )}
        >
          <span>{CELL_INDICATOR[day.status]}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 w-64 rounded-xl border border-ink-200 bg-white p-4 shadow-lg"
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

  function onCreateBooking() {
    router.push(
      `/host/bookings/new?propertyId=${state.propertyId}&checkIn=${state.date}`,
    );
  }

  function onGotoBookings() {
    router.push(
      `/host/bookings?propertyId=${state.propertyId}&from=${state.date}`,
    );
  }

  return (
    <div className="space-y-3">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
          {formatDate(state.date)}
        </p>
        <p className="mt-0.5 text-sm font-bold text-ink-900 line-clamp-1">
          {state.propertyName}
        </p>
        <p className="mt-1 text-xs">
          Trạng thái: <StatusBadge status={state.status} />
          {state.note && (
            <span className="ml-1 text-ink-500">· {state.note}</span>
          )}
        </p>
      </header>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-1.5">
        {state.status === CalendarStatus.AVAILABLE && (
          <>
            <MenuButton onClick={onCreateBooking} disabled={pending}>
              ➕ Tạo đặt phòng
            </MenuButton>
            <MenuButton onClick={onLock} disabled={pending} variant="danger">
              🔒 Khóa ngày này
            </MenuButton>
          </>
        )}
        {state.status === CalendarStatus.LOCKED && (
          <MenuButton onClick={onUnlock} disabled={pending}>
            🔓 Mở khóa
          </MenuButton>
        )}
        {state.status === CalendarStatus.HOLD && (
          <MenuButton onClick={onGotoBookings} disabled={pending}>
            👁️ Xem đặt phòng đang giữ
          </MenuButton>
        )}
        {state.status === CalendarStatus.BOOKED && (
          <MenuButton onClick={onGotoBookings} disabled={pending}>
            👁️ Xem đặt phòng
          </MenuButton>
        )}
      </div>
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  disabled,
  variant = 'default',
}: {
  children: React.ReactNode;
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
        'rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors disabled:opacity-50',
        variant === 'danger'
          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          : 'bg-ink-50 text-ink-900 hover:bg-cream-200',
      )}
    >
      {children}
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
        'inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        cls[status],
      )}
    >
      {CALENDAR_STATUS_LABEL[status]}
    </span>
  );
}
