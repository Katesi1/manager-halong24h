'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, RotateCcw, Search } from 'lucide-react';

export interface StatusOption {
  key: string;
  label: string;
  count: number;
}

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Mọi loại hình' },
  { value: '0', label: 'Villa' },
  { value: '1', label: 'Homestay' },
  { value: '2', label: 'Hotel' },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'name', label: 'Tên A→Z' },
  { value: 'bookings', label: 'Lượt đặt nhiều nhất' },
  { value: 'price-asc', label: 'Giá thấp → cao' },
  { value: 'price-desc', label: 'Giá cao → thấp' },
];

interface PropertyFiltersProps {
  statuses: StatusOption[];
  status: string;
  q: string;
  type: string;
  sort: string;
}

const SEARCH_DEBOUNCE_MS = 350;

export function PropertyFilters({
  statuses,
  status,
  q,
  type,
  sort,
}: PropertyFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đồng bộ khi URL đổi từ bên ngoài (vd: click reset, back button).
  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      pushParams((params) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
    },
    [pushParams],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setParam('q', value.trim());
      }, SEARCH_DEBOUNCE_MS);
    },
    [setParam],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasFilters = Boolean(status || q || type || (sort && sort !== 'name'));

  function handleReset() {
    setSearchValue('');
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  const selectClass =
    'h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800 transition-colors hover:border-navy-300 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20';

  return (
    <div className="mb-6 rounded-2xl bg-white p-3 ring-1 ring-ink-200/60 shadow-card sm:p-4">
      {/* Hàng 1 — segmented status filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        {statuses.map((s) => {
          const active = status === s.key;
          return (
            <button
              key={s.key || 'all'}
              type="button"
              onClick={() => setParam('status', s.key)}
              className={
                'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ' +
                (active
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900')
              }
            >
              {s.label}
              <span
                className={
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ' +
                  (active
                    ? 'bg-white/20 text-white'
                    : s.key === 'suspended' && s.count > 0
                      ? 'bg-rose-500 text-white'
                      : 'bg-cream-200 text-ink-600')
                }
              >
                {s.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hàng 2 — search + select filters */}
      <div className="mt-3 flex flex-col gap-2.5 border-t border-ink-100 pt-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          {isPending ? (
            <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-navy-500" />
          ) : (
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          )}
          <input
            type="search"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm theo tên, mã, địa chỉ hoặc chủ sở hữu…"
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="type-filter">
            Loại hình
          </label>
          <select
            id="type-filter"
            value={type}
            onChange={(e) => setParam('type', e.target.value)}
            className={selectClass}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="sort-filter">
            Sắp xếp
          </label>
          <select
            id="sort-filter"
            value={sort || 'name'}
            onChange={(e) => setParam('sort', e.target.value === 'name' ? '' : e.target.value)}
            className={selectClass}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink-500 transition-colors hover:bg-cream-200 hover:text-ink-900"
              title="Xoá bộ lọc"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Xoá lọc</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
