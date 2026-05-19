'use client';

import { useState } from 'react';

import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const RANGES = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần này' },
  { key: 'month', label: 'Tháng này' },
  { key: 'custom', label: 'Tùy chỉnh' },
] as const;

type RangeKey = (typeof RANGES)[number]['key'];

export function PaymentsDateChips() {
  const [active, setActive] = useState<RangeKey | null>(null);

  function pick(key: RangeKey) {
    setActive(key);
    toast(
      `Demo: bộ lọc thời gian "${
        RANGES.find((r) => r.key === key)?.label
      }" chưa thực sự lọc. Sẽ kết nối khi BE sẵn sàng.`,
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <span className="self-center text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        Thời gian:
      </span>
      {RANGES.map((r) => {
        const isActive = active === r.key;
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => pick(r.key)}
            className={cn(
              'h-8 rounded-full border px-3 text-xs font-semibold transition-colors',
              isActive
                ? 'border-ink-900 bg-ink-900 text-white'
                : 'border-ink-200 bg-white text-ink-700 hover:border-ink-400 hover:bg-cream-100',
            )}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
