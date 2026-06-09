import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  totalItems?: number;
  pageSize?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  totalItems,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);
  const start = totalItems != null && pageSize != null
    ? (currentPage - 1) * pageSize + 1
    : null;
  const end = totalItems != null && pageSize != null
    ? Math.min(currentPage * pageSize, totalItems)
    : null;

  return (
    <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      {totalItems != null && start != null && end != null && (
        <p className="text-xs text-ink-400">
          Hiển thị <strong className="text-ink-600">{start}–{end}</strong> trong{' '}
          <strong className="text-ink-600">{totalItems}</strong> kết quả
        </p>
      )}
      <nav aria-label="Phân trang" className="flex items-center gap-1">
        <PageLink
          href={currentPage > 1 ? buildHref(currentPage - 1) : undefined}
          disabled={currentPage <= 1}
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </PageLink>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`e-${i}`}
              className="grid h-9 w-9 place-items-center text-xs text-ink-400"
            >
              …
            </span>
          ) : (
            <PageLink
              key={p}
              href={buildHref(p)}
              active={p === currentPage}
            >
              {p}
            </PageLink>
          ),
        )}

        <PageLink
          href={currentPage < totalPages ? buildHref(currentPage + 1) : undefined}
          disabled={currentPage >= totalPages}
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </PageLink>
      </nav>
    </div>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ...rest
}: {
  href?: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  'aria-label'?: string;
}) {
  const base =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg text-sm font-medium transition-all';

  if (disabled || !href) {
    return (
      <span className={cn(base, 'text-ink-300 cursor-not-allowed')} {...rest}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        base,
        active
          ? 'bg-navy-900 text-white shadow-sm'
          : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900',
      )}
      {...rest}
    >
      {children}
    </Link>
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
