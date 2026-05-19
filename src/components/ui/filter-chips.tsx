import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface ChipItem {
  key: string;
  label: string;
  href: string;
  count?: number;
}

interface Props {
  items: ChipItem[];
  active: string;
}

export function FilterChips({ items, active }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <Link
            key={it.key}
            href={it.href}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 h-9 text-xs font-semibold transition-colors',
              isActive
                ? 'bg-ink-900 text-white border-ink-900'
                : 'bg-white text-ink-700 border-ink-200 hover:border-ink-400 hover:bg-cream-100',
            )}
          >
            <span>{it.label}</span>
            {typeof it.count === 'number' && it.count > 0 && (
              <span
                className={cn(
                  'inline-grid h-5 min-w-5 px-1 place-items-center rounded-full text-[10px] font-bold',
                  isActive ? 'bg-white text-ink-900' : 'bg-gold-500 text-white',
                )}
              >
                {it.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
