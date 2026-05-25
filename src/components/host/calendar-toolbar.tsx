'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { addDays, todayISO, formatDate } from '@/lib/format';

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

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink-200/60 shadow-card">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate({ start: addDays(start, -days) })}
          className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 hover:bg-cream-100"
          aria-label="Tuần trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => navigate({ start: todayISO() })}
          className="h-9 rounded-lg border border-ink-200 px-3 text-sm font-medium hover:bg-cream-100"
        >
          Hôm nay
        </button>
        <button
          type="button"
          onClick={() => navigate({ start: addDays(start, days) })}
          className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 hover:bg-cream-100"
          aria-label="Tuần sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="ml-2 text-xs sm:text-sm font-semibold text-ink-900 hidden sm:block">
          {formatDate(start)} → {formatDate(end)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {properties.length > 1 && (
          <select
            value={selectedPropertyId ?? ''}
            onChange={(e) => navigate({ property: e.target.value || undefined })}
            className="h-9 rounded-lg border border-ink-200 bg-white px-3 text-sm font-medium hover:border-ink-400"
          >
            <option value="">Tất cả cơ sở</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex h-9 overflow-hidden rounded-lg border border-ink-200">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => navigate({ days: String(d) })}
              className={cn(
                'h-9 border-r border-ink-200 px-3 text-sm font-medium last:border-r-0',
                d === days ? 'bg-navy-900 text-white' : 'bg-white text-ink-700 hover:bg-cream-100',
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
