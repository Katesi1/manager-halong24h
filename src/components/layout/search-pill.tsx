'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SearchIcon } from '@/components/ui/icons';

/** Airbnb-style compact search pill (header). Click → /search.
 *  Tự ẩn trên route /search vì trang đó đã có thanh tìm kiếm riêng → tránh trùng lặp. */
export function SearchPill() {
  const pathname = usePathname();
  if (pathname?.startsWith('/search')) return null;

  return (
    <Link
      href="/search"
      className="hidden md:flex items-center divide-x divide-ink-200 rounded-full bg-white px-2 py-1.5 text-sm font-medium text-ink-900 ring-1 ring-ink-200 shadow-pill hover:shadow-card-hover transition-shadow"
    >
      <span className="px-4">Mọi nơi</span>
      <span className="px-4">Mọi tuần</span>
      <span className="px-4 text-ink-500">Thêm khách</span>
      <span className="ml-2 grid h-9 w-9 place-items-center rounded-full bg-navy-900 text-white">
        <SearchIcon className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </Link>
  );
}
