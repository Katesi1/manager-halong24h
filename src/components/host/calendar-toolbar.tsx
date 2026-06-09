'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { addDays, formatDate, todayISO } from '@/lib/format';
import { cn } from '@/lib/utils';

interface CalendarToolbarProps {
  start: string;
  days: number;
  properties: { id: string; name: string }[];
  selectedPropertyId?: string;
}

export function CalendarToolbar({
  start,
  days,
  properties,
  selectedPropertyId,
}: CalendarToolbarProps) {
  const router = useRouter();
  const sp = useSearchParams();

  function navigate(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v == null || v === '') params.delete(k);
      else params.set(k, v);
    });
    router.push(`/host/calendar?${params.toString()}`);
  }

  const end = addDays(start, days - 1);
  const isToday = start === todayISO();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Navigation group */}
      <div className="inline-flex items-center rounded-xl bg-white ring-1 ring-ink-200/60 shadow-sm">
        <button
          type="button"
          onClick={() => navigate({ start: addDays(start, -days) })}
          className="grid h-10 w-10 place-items-center rounded-l-xl border-r border-ink-200 text-ink-500 hover:bg-cream-100 hover:text-ink-900 transition-colors"
          aria-label="Khoảng trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => navigate({ start: todayISO() })}
          className={cn(
            'h-10 border-r border-ink-200 px-3 text-sm font-medium transition-colors',
            isToday
              ? 'bg-navy-900 text-white'
              : 'text-ink-700 hover:bg-cream-100',
          )}
        >
          Hôm nay
        </button>
        <button
          type="button"
          onClick={() => navigate({ start: addDays(start, days) })}
          className="grid h-10 w-10 place-items-center rounded-r-xl text-ink-500 hover:bg-cream-100 hover:text-ink-900 transition-colors"
          aria-label="Khoảng sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Date range display */}
      <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900">
        {formatDate(start)}
        <span className="text-ink-400">—</span>
        {formatDate(end)}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Property filter */}
      {properties.length > 1 && (
        <select
          value={selectedPropertyId ?? ''}
          onChange={(e) =>
            navigate({ property: e.target.value || undefined })
          }
          className="h-10 rounded-xl border-0 bg-white px-3 pr-8 text-sm font-medium text-ink-900 ring-1 ring-ink-200/60 shadow-sm hover:ring-ink-300 focus:ring-2 focus:ring-navy-500 transition-shadow"
        >
          <option value="">Tất cả cơ sở</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* Days toggle */}
      <div className="inline-flex items-center rounded-xl bg-cream-100 p-0.5">
        {[
          { d: 7, label: '7 ngày' },
          { d: 14, label: '14 ngày' },
          { d: 30, label: '30 ngày' },
        ].map(({ d, label }) => (
          <button
            key={d}
            type="button"
            onClick={() => navigate({ days: String(d) })}
            className={cn(
              'rounded-lg px-3 py-2 text-xs font-medium transition-all',
              d === days
                ? 'bg-white text-navy-900 shadow-sm ring-1 ring-ink-200/60'
                : 'text-ink-500 hover:text-ink-900',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
