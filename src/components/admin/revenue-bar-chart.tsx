'use client';

import { cn } from '@/lib/utils';

interface MonthData {
  month: string;
  revenue: number;
}

interface RevenueBarChartProps {
  data: MonthData[];
}

const BAR_MAX_HEIGHT = 160;

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end gap-2 sm:gap-3">
      {data.map((d, i) => {
        const pct = d.revenue / max;
        const barHeight = Math.max(pct * BAR_MAX_HEIGHT, 6);
        const isLast = i === data.length - 1;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold text-ink-700 tabular-nums">
              {(d.revenue / 1_000_000).toFixed(1)}tr
            </span>
            <div
              className={cn(
                'w-full rounded-t-md transition-all duration-500',
                isLast ? 'bg-navy-900' : 'bg-navy-200',
              )}
              style={{ height: `${barHeight}px` }}
            />
            <span className={cn(
              'text-[10px] font-medium',
              isLast ? 'text-navy-900 font-semibold' : 'text-ink-500',
            )}>
              {d.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}
