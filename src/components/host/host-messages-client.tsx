'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lightbulb } from 'lucide-react';

import { ClientPagination } from '@/components/ui/client-pagination';
import { FilterChips } from '@/components/ui/filter-chips';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useApiResource } from '@/lib/use-api-resource';

const PAGE_SIZE = 15;

interface Conversation {
  id: string;
  property_name: string;
  property_short: string;
  customer_name: string;
  last_message_preview: string;
  last_message_from_me: boolean;
  last_message_at: string;
  unread_owner: number;
  online?: boolean;
}

/**
 * Danh sách hội thoại fetch từ `/api/host/messages` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Filter (all/unread) theo URL + phân trang in-memory.
 */
export function HostMessagesClient({ filter }: { filter?: string }) {
  const { loading, error, data } = useApiResource<Conversation[]>(
    '/api/host/messages',
  );
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [filter]);

  const all = data ?? [];
  const unreadCount = all.filter((c) => c.unread_owner > 0).length;
  const filtered =
    filter === 'unread' ? all.filter((c) => c.unread_owner > 0) : all;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          <Lightbulb className="mr-2 inline h-4 w-4" />
          Không tải được hội thoại từ BE: {error}
        </div>
      )}

      <div className="mb-4">
        <FilterChips
          active={filter ?? 'all'}
          items={[
            { key: 'all', label: 'Tất cả', href: '/host/messages', count: all.length },
            { key: 'unread', label: 'Chưa đọc', href: '/host/messages?filter=unread', count: unreadCount },
            { key: 'booking', label: 'Có booking', href: '/host/messages?filter=booking' },
            { key: 'returning', label: 'Khách quen', href: '/host/messages?filter=returning' },
          ]}
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <p className="text-2xl">💬</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-navy-900">
            Chưa có tin nhắn
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Khách nhắn tin sẽ hiện ở đây.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200">
            <ul className="divide-y divide-ink-200">
              {pageItems.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/host/messages/${c.id}`}
                    className={cn(
                      'flex items-start gap-3 p-4 transition-colors',
                      c.unread_owner > 0
                        ? 'bg-navy-50/40 hover:bg-navy-50'
                        : 'hover:bg-cream-100',
                    )}
                  >
                    <GradientAvatar
                      name={c.customer_name}
                      size="lg"
                      online={c.online}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              'truncate',
                              c.unread_owner > 0
                                ? 'font-bold text-ink-900'
                                : 'font-semibold text-ink-700',
                            )}
                          >
                            {c.customer_name}
                          </span>
                          {c.property_short && (
                            <span className="shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-ink-700">
                              {c.property_short}
                            </span>
                          )}
                        </div>
                        <span
                          className={cn(
                            'shrink-0 text-xs',
                            c.unread_owner > 0
                              ? 'font-bold text-navy-700'
                              : 'text-ink-500',
                          )}
                        >
                          {relativeTime(c.last_message_at)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm truncate',
                            c.unread_owner > 0
                              ? 'font-semibold text-ink-900'
                              : 'text-ink-500',
                          )}
                        >
                          {c.last_message_from_me && (
                            <span className="text-ink-500 mr-1">Bạn:</span>
                          )}
                          {c.last_message_preview}
                        </p>
                        {c.unread_owner > 0 && (
                          <span className="shrink-0 inline-grid h-5 min-w-5 px-1 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                            {c.unread_owner}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <ClientPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </>
  );
}
