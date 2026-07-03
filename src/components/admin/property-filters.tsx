'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';

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

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Controlled filter bar — không tự navigate URL. Parent (client) giữ state và
 * lọc in-memory ⇒ đổi tab/tìm/sort không gây fetch lại data từ BE.
 */
interface PropertyFiltersProps {
  statuses: StatusOption[];
  status: string;
  q: string;
  type: string;
  sort: string;
  onStatusChange: (key: string) => void;
  onSearchChange: (value: string) => void;
  onTypeChange: (type: string) => void;
  onSortChange: (sort: string) => void;
  onReset: () => void;
}

export function PropertyFilters({
  statuses,
  status,
  q,
  type,
  sort,
  onStatusChange,
  onSearchChange,
  onTypeChange,
  onSortChange,
  onReset,
}: PropertyFiltersProps) {
  const [searchValue, setSearchValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đồng bộ khi parent reset q từ bên ngoài.
  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(value.trim());
    }, SEARCH_DEBOUNCE_MS);
  }

  const hasFilters = Boolean(status || q || type || (sort && sort !== 'name'));

  function handleReset() {
    setSearchValue('');
    onReset();
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
              onClick={() => onStatusChange(s.key)}
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
                    : s.key === 'pending' && s.count > 0
                      ? 'bg-amber-500 text-white'
                      : (s.key === 'rejected' || s.key === 'suspended') &&
                          s.count > 0
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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
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
            onChange={(e) => onTypeChange(e.target.value)}
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
            onChange={(e) => onSortChange(e.target.value)}
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
