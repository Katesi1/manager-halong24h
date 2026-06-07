'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as Popover from '@radix-ui/react-popover';
import { Lock, Unlock, Plus, Eye, X, CheckCircle2, Loader2 } from 'lucide-react';

import {
  bulkLockDatesAction,
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

type SelectionMap = Map<string, { propertyId: string; date: string; status: CalendarStatus }>;

function selKey(propertyId: string, date: string): string {
  return `${propertyId}|${date}`;
}

function isSelectable(status: CalendarStatus): boolean {
  return status === CalendarStatus.AVAILABLE || status === CalendarStatus.LOCKED;
}

interface Segment {
  /** start index in property.days[] */
  start: number;
  length: number;
  status: CalendarStatus;
  /** Guest name for BOOKED/HOLD; null otherwise */
  note: string | null;
  days: CalendarDay[];
}

/**
 * Gom các ngày liền kề cùng status BOOKED/HOLD và cùng note thành 1 segment.
 * AVAILABLE / LOCKED giữ nguyên 1 segment = 1 ngày để giữ click target độc lập.
 */
function buildSegments(days: CalendarDay[]): Segment[] {
  const out: Segment[] = [];
  let i = 0;
  while (i < days.length) {
    const d = days[i];
    const isBar = d.status === CalendarStatus.BOOKED || d.status === CalendarStatus.HOLD;
    if (!isBar) {
      out.push({ start: i, length: 1, status: d.status, note: d.note, days: [d] });
      i++;
      continue;
    }
    let j = i + 1;
    while (
      j < days.length &&
      days[j].status === d.status &&
      (days[j].note ?? '') === (d.note ?? '')
    ) {
      j++;
    }
    out.push({
      start: i,
      length: j - i,
      status: d.status,
      note: d.note,
      days: days.slice(i, j),
    });
    i = j;
  }
  return out;
}

export function CalendarGrid({ properties }: CalendarGridProps) {
  const [selection, setSelection] = useState<SelectionMap>(new Map());
  const dragRef = useRef<{
    propertyId: string;
    anchorIdx: number;
    hasMoved: boolean;
  } | null>(null);
  const [, forceTick] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const end = () => {
      dragRef.current = null;
      forceTick((n) => n + 1);
    };
    window.addEventListener('mouseup', end);
    return () => window.removeEventListener('mouseup', end);
  }, []);

  if (properties.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-16 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-cream-100 to-cream-200">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-9 w-9 text-ink-400">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h3 className="mt-6 font-display text-2xl font-semibold text-navy-900">
          Chưa có cơ sở nào
        </h3>
        <p className="mt-2 text-sm text-ink-500">
          Thêm cơ sở để bắt đầu quản lý lịch phòng.
        </p>
      </div>
    );
  }

  const dates = properties[0]?.days.map((d) => d.date) ?? [];
  const today = todayISO();

  function beginDrag(propertyId: string, day: CalendarDay, idx: number) {
    if (!isSelectable(day.status)) return;
    dragRef.current = { propertyId, anchorIdx: idx, hasMoved: false };
  }

  function extendDrag(propertyId: string, day: CalendarDay, idx: number) {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.propertyId !== propertyId) return;
    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) return;
    drag.hasMoved = true;
    const [lo, hi] = idx < drag.anchorIdx
      ? [idx, drag.anchorIdx]
      : [drag.anchorIdx, idx];

    setSelection((prev) => {
      const next = new Map(prev);
      for (let k = lo; k <= hi; k++) {
        const d = prop.days[k];
        if (!d || !isSelectable(d.status)) continue;
        next.set(selKey(propertyId, d.date), {
          propertyId,
          date: d.date,
          status: d.status,
        });
      }
      return next;
    });
  }

  /** Trả về true nếu lần mouseUp này kết thúc một drag thực sự (đã di chuyển). */
  function endDrag(): boolean {
    const drag = dragRef.current;
    dragRef.current = null;
    return Boolean(drag?.hasMoved);
  }

  function clearSelection() {
    setSelection(new Map());
  }

  return (
    <>
      <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-ink-200/60 shadow-card select-none">
        <div
          className="grid min-w-max"
          style={{
            gridTemplateColumns: `220px repeat(${dates.length}, minmax(38px, 1fr))`,
          }}
        >
          {/* Sticky top-left */}
          <div className="sticky left-0 top-0 z-30 flex items-end border-b border-r border-ink-200 bg-gradient-to-br from-cream-50 to-white px-5 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              Cơ sở
            </span>
          </div>
          {dates.map((d) => (
            <DateHeader key={d} date={d} isToday={d === today} />
          ))}

          {properties.map((prop) => (
            <PropertyRow
              key={prop.id}
              property={prop}
              today={today}
              selection={selection}
              onDragStart={(d, idx) => beginDrag(prop.id, d, idx)}
              onDragEnter={(d, idx) => extendDrag(prop.id, d, idx)}
              endDrag={endDrag}
            />
          ))}
        </div>
      </div>

      {selection.size > 0 && (
        <BulkActionBar
          selection={selection}
          onClear={clearSelection}
          onDone={() => {
            clearSelection();
            router.refresh();
          }}
        />
      )}
    </>
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
        'sticky top-0 z-20 border-b border-r border-ink-200 px-0.5 py-1.5 text-center transition-colors',
        isToday
          ? 'bg-gradient-to-b from-navy-50 to-navy-100/50'
          : 'bg-gradient-to-b from-cream-50 to-white',
      )}
    >
      <p
        className={cn(
          'text-[10px] font-semibold uppercase tracking-wider leading-none',
          isWeekend ? 'text-rose-500' : 'text-ink-400',
        )}
      >
        {dowLabel(date)}
      </p>
      <p
        className={cn(
          'mt-1 text-xs font-bold leading-none',
          isToday
            ? 'mx-auto grid h-5 w-5 place-items-center rounded-full bg-navy-900 text-white text-[10px] shadow-sm ring-2 ring-navy-900/10'
            : 'text-ink-900',
        )}
      >
        {dayNum}
      </p>
      {isFirstOfMonth && (
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold-600">
          T{month}
        </p>
      )}
    </div>
  );
}

interface PropertyRowProps {
  property: CalendarGridProperty;
  today: string;
  selection: SelectionMap;
  onDragStart: (day: CalendarDay, idx: number) => void;
  onDragEnter: (day: CalendarDay, idx: number) => void;
  endDrag: () => boolean;
}

function PropertyRow({
  property,
  today,
  selection,
  onDragStart,
  onDragEnter,
  endDrag,
}: PropertyRowProps) {
  const segments = useMemo(() => buildSegments(property.days), [property.days]);
  const occupancy = useMemo(() => {
    const total = property.days.length;
    const booked = property.days.filter((d) => d.status === CalendarStatus.BOOKED).length;
    return total === 0 ? 0 : Math.round((booked / total) * 100);
  }, [property.days]);

  return (
    <>
      <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-r border-ink-200 bg-white px-3 py-1.5">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-navy-50 to-navy-100 text-navy-700 ring-1 ring-navy-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-ink-900 truncate leading-tight">
            {property.name}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <div className="flex-1 h-1 rounded-full bg-ink-100 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  occupancy >= 80 ? 'bg-rose-500' : occupancy >= 50 ? 'bg-gold-500' : 'bg-emerald-500',
                )}
                style={{ width: `${occupancy}%` }}
              />
            </div>
            <span className="text-[9px] font-bold tabular-nums text-ink-500 w-8 text-right">
              {occupancy}%
            </span>
          </div>
        </div>
      </div>

      {segments.map((seg) => (
        <SegmentCell
          key={`${property.id}-${seg.start}`}
          property={property}
          segment={seg}
          today={today}
          selection={selection}
          onDragStart={onDragStart}
          onDragEnter={onDragEnter}
          endDrag={endDrag}
        />
      ))}
    </>
  );
}

function SegmentCell({
  property,
  segment,
  today,
  selection,
  onDragStart,
  onDragEnter,
  endDrag,
}: {
  property: CalendarGridProperty;
  segment: Segment;
  today: string;
  selection: SelectionMap;
  onDragStart: (day: CalendarDay, idx: number) => void;
  onDragEnter: (day: CalendarDay, idx: number) => void;
  endDrag: () => boolean;
}) {
  if (segment.status === CalendarStatus.BOOKED || segment.status === CalendarStatus.HOLD) {
    return (
      <BookingBar
        property={property}
        segment={segment}
        today={today}
      />
    );
  }
  const day = segment.days[0];
  const idx = segment.start;
  const isSelected = selection.has(selKey(property.id, day.date));
  return (
    <SingleCell
      propertyId={property.id}
      propertyName={property.name}
      day={day}
      isToday={day.date === today}
      isSelected={isSelected}
      onDragStart={() => onDragStart(day, idx)}
      onDragEnter={() => onDragEnter(day, idx)}
      endDrag={endDrag}
    />
  );
}

function BookingBar({
  property,
  segment,
  today,
}: {
  property: CalendarGridProperty;
  segment: Segment;
  today: string;
}) {
  const router = useRouter();
  const isHold = segment.status === CalendarStatus.HOLD;
  const startDate = segment.days[0].date;
  const endDate = segment.days[segment.days.length - 1].date;
  const containsToday = segment.days.some((d) => d.date === today);

  return (
    <button
      type="button"
      onClick={() =>
        router.push(
          `/host/bookings?propertyId=${property.id}&from=${startDate}`,
        )
      }
      style={{ gridColumn: `span ${segment.length} / span ${segment.length}` }}
      className={cn(
        'group relative flex h-9 items-center gap-1.5 border-b border-r border-ink-100 px-2 transition-all overflow-hidden',
        isHold
          ? 'bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 hover:from-amber-200 hover:to-amber-200'
          : 'bg-gradient-to-r from-navy-700 via-navy-800 to-navy-700 hover:from-navy-800 hover:to-navy-800',
        containsToday && 'ring-2 ring-inset ring-navy-400/50',
      )}
      aria-label={`${segment.note ?? CALENDAR_STATUS_LABEL[segment.status]} — ${segment.length} đêm`}
    >
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md',
          isHold ? 'bg-amber-200/70 text-amber-900' : 'bg-white/15 text-white',
        )}
      >
        {isHold ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-2.5 w-2.5">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        ) : (
          <CheckCircle2 className="h-3 w-3" />
        )}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span
          className={cn(
            'block truncate text-[11px] font-bold leading-tight',
            isHold ? 'text-amber-900' : 'text-white',
          )}
        >
          {segment.note ?? CALENDAR_STATUS_LABEL[segment.status]}
        </span>
        <span
          className={cn(
            'block text-[9px] leading-tight tabular-nums',
            isHold ? 'text-amber-700' : 'text-white/70',
          )}
        >
          {segment.length} đêm · {formatDate(startDate).slice(0, 5)} → {formatDate(endDate).slice(0, 5)}
        </span>
      </span>
    </button>
  );
}

const CELL_BG: Record<CalendarStatus, string> = {
  [CalendarStatus.AVAILABLE]:
    'bg-gradient-to-br from-emerald-50/40 to-white hover:from-emerald-100/70',
  [CalendarStatus.LOCKED]:
    'bg-[repeating-linear-gradient(135deg,_theme(colors.rose.100)_0,_theme(colors.rose.100)_6px,_theme(colors.rose.50)_6px,_theme(colors.rose.50)_12px)] hover:brightness-95',
  [CalendarStatus.HOLD]: '',
  [CalendarStatus.BOOKED]: '',
};

function SingleCell({
  propertyId,
  propertyName,
  day,
  isToday,
  isSelected,
  onDragStart,
  onDragEnter,
  endDrag,
}: {
  propertyId: string;
  propertyName: string;
  day: CalendarDay;
  isToday: boolean;
  isSelected: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  endDrag: () => boolean;
}) {
  const [popOpen, setPopOpen] = useState(false);
  const suppressClickRef = useRef(false);

  return (
    <Popover.Root open={popOpen} onOpenChange={setPopOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`${formatDate(day.date)} · ${CALENDAR_STATUS_LABEL[day.status]}`}
          aria-pressed={isSelected}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            suppressClickRef.current = false;
            onDragStart();
          }}
          onMouseEnter={() => {
            onDragEnter();
          }}
          onMouseUp={() => {
            // Nếu kết thúc một drag thực sự, chặn click sắp xảy ra (không mở popover)
            if (endDrag()) suppressClickRef.current = true;
          }}
          onClick={(e) => {
            if (suppressClickRef.current) {
              e.preventDefault();
              suppressClickRef.current = false;
            }
          }}
          className={cn(
            'relative flex h-9 items-center justify-center border-b border-r border-ink-100 transition-all cursor-pointer',
            CELL_BG[day.status],
            isToday && 'ring-2 ring-inset ring-navy-400/40',
            isSelected && 'ring-2 ring-inset ring-navy-600 bg-navy-50/60',
          )}
        >
          {day.status === CalendarStatus.LOCKED && (
            <Lock className="h-2.5 w-2.5 text-rose-500/70" />
          )}
          {day.note && (
            <span className="absolute bottom-0.5 right-0.5 h-1 w-1 rounded-full bg-gold-500" />
          )}
          {isSelected && (
            <span className="absolute top-0.5 right-0.5 grid h-3 w-3 place-items-center rounded-full bg-navy-900 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="h-1.5 w-1.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className="z-50 w-72 rounded-2xl bg-white p-0 shadow-floating ring-1 ring-ink-200/60 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <CellMenu
            propertyId={propertyId}
            propertyName={propertyName}
            day={day}
            onClose={() => setPopOpen(false)}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function CellMenu({
  propertyId,
  propertyName,
  day,
  onClose,
}: {
  propertyId: string;
  propertyName: string;
  day: CalendarDay;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onLock() {
    setError(null);
    startTransition(async () => {
      const r = await lockDateAction({ propertyId, date: day.date });
      if (!r.ok) setError(r.error);
      else {
        onClose();
        router.refresh();
      }
    });
  }

  function onUnlock() {
    setError(null);
    startTransition(async () => {
      const r = await unlockDateAction({ propertyId, date: day.date });
      if (!r.ok) setError(r.error);
      else {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="border-b border-ink-100 bg-gradient-to-br from-cream-50 to-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            {formatDate(day.date)}
          </p>
          <StatusBadge status={day.status} />
        </div>
        <p className="mt-1.5 text-sm font-bold text-navy-900 truncate">
          {propertyName}
        </p>
      </div>

      {error && (
        <div className="mx-3 mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="p-2">
        {day.status === CalendarStatus.AVAILABLE && (
          <>
            <MenuBtn
              icon={<Plus className="h-4 w-4" />}
              label="Tạo đặt phòng"
              sub="Tạo booking mới cho ngày này"
              onClick={() =>
                router.push(
                  `/host/bookings/new?propertyId=${propertyId}&checkIn=${day.date}`,
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
        {day.status === CalendarStatus.LOCKED && (
          <MenuBtn
            icon={<Unlock className="h-4 w-4" />}
            label="Mở khoá"
            sub="Cho phép đặt phòng lại"
            onClick={onUnlock}
            disabled={pending}
          />
        )}
        {(day.status === CalendarStatus.HOLD ||
          day.status === CalendarStatus.BOOKED) && (
          <MenuBtn
            icon={<Eye className="h-4 w-4" />}
            label={
              day.status === CalendarStatus.HOLD
                ? 'Xem đặt phòng đang giữ'
                : 'Xem đặt phòng'
            }
            sub="Mở chi tiết booking liên quan"
            onClick={() =>
              router.push(
                `/host/bookings?propertyId=${propertyId}&from=${day.date}`,
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
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-50',
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
        <p className="text-[11px] text-ink-500 leading-tight mt-0.5">{sub}</p>
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

function BulkActionBar({
  selection,
  onClear,
  onDone,
}: {
  selection: SelectionMap;
  onClear: () => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const items = Array.from(selection.values());
  const availableCount = items.filter((i) => i.status === CalendarStatus.AVAILABLE).length;
  const lockedCount = items.filter((i) => i.status === CalendarStatus.LOCKED).length;

  function run(mode: 'lock' | 'unlock') {
    setError(null);
    const filtered = items.filter((i) =>
      mode === 'lock'
        ? i.status === CalendarStatus.AVAILABLE
        : i.status === CalendarStatus.LOCKED,
    );
    if (filtered.length === 0) return;
    startTransition(async () => {
      const r = await bulkLockDatesAction({
        items: filtered.map((i) => ({ propertyId: i.propertyId, date: i.date })),
        mode,
      });
      if (!r.ok) setError(r.error);
      else onDone();
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-navy-900 px-4 py-3 text-white shadow-floating ring-1 ring-navy-700">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-base font-bold tabular-nums">
          {selection.size}
        </span>
        <div className="text-left">
          <p className="text-sm font-semibold leading-tight">
            {selection.size} ngày đã chọn
          </p>
          <p className="text-[10px] text-white/60 leading-tight mt-0.5">
            {availableCount} trống · {lockedCount} đang khoá
          </p>
        </div>
        <div className="mx-1 h-8 w-px bg-white/15" />
        {availableCount > 0 && (
          <button
            type="button"
            onClick={() => run('lock')}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50 transition-colors"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
            Khoá {availableCount}
          </button>
        )}
        {lockedCount > 0 && (
          <button
            type="button"
            onClick={() => run('unlock')}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlock className="h-3.5 w-3.5" />}
            Mở khoá {lockedCount}
          </button>
        )}
        <button
          type="button"
          onClick={onClear}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Bỏ chọn
        </button>
        {error && (
          <span className="ml-2 max-w-[200px] truncate rounded-lg bg-rose-500/20 px-2 py-1 text-[11px] text-rose-100">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
