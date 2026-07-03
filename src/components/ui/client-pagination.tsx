'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

/**
 * Phân trang điều khiển bằng client state (onClick) thay vì <Link href>.
 * Dùng cho list lọc/sort/phân trang in-memory để KHÔNG navigate URL →
 * không re-run Server Component → không fetch lại data.
 */
export function ClientPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: ClientPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);
  const start =
    totalItems != null && pageSize != null
      ? (currentPage - 1) * pageSize + 1
      : null;
  const end =
    totalItems != null && pageSize != null
      ? Math.min(currentPage * pageSize, totalItems)
      : null;

  return (
    <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      {totalItems != null && start != null && end != null && (
        <p className="text-xs text-ink-400">
          Hiển thị{' '}
          <strong className="text-ink-600">
            {start}–{end}
          </strong>{' '}
          trong <strong className="text-ink-600">{totalItems}</strong> kết quả
        </p>
      )}
      <nav aria-label="Phân trang" className="flex items-center gap-1">
        <PageButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`e-${i}`}
              className="grid h-9 w-9 place-items-center text-xs text-ink-400"
            >
              …
            </span>
          ) : (
            <PageButton
              key={p}
              onClick={() => onPageChange(p)}
              active={p === currentPage}
            >
              {p}
            </PageButton>
          ),
        )}

        <PageButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </PageButton>
      </nav>
    </div>
  );
}

function PageButton({
  onClick,
  active,
  disabled,
  children,
  ...rest
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  'aria-label'?: string;
}) {
  const base =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg text-sm font-medium transition-all';

  if (disabled) {
    return (
      <span className={cn(base, 'text-ink-300 cursor-not-allowed')} {...rest}>
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        base,
        active
          ? 'bg-navy-900 text-white shadow-sm'
          : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function getVisiblePages(
  current: number,
  total: number,
): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}
