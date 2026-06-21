import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Lightbulb } from 'lucide-react';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Tin nhắn' };
import { FilterChips } from '@/components/ui/filter-chips';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { Pagination } from '@/components/ui/pagination';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { buildPageHref, pageCount, paginate, parsePage } from '@/lib/pagination';
import { listConversationsAction } from '@/app/actions/conversations';
import { getCurrentProfile } from '@/app/actions/auth';
import type { Conversation as SpecConversation } from '@/core/entities/chat';

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

function adaptConversation(
  c: SpecConversation,
  currentUserId: string | null,
): Conversation {
  const customer = c.members.find((m) => m.role === 'customer');
  return {
    id: c.id,
    property_name: c.subject ?? '',
    property_short: c.propertyId ? c.propertyId.slice(0, 6) : '—',
    customer_name: customer?.user.name ?? 'Khách',
    last_message_preview: c.lastMessagePreview ?? '',
    last_message_from_me:
      currentUserId !== null && c.lastSenderId === currentUserId,
    last_message_at: c.lastMessageAt ?? c.createdAt,
    unread_owner: c.myUnread,
    online: false,
  };
}

type ConvState =
  | { items: Conversation[]; mode: 'ok' }
  | { items: Conversation[]; mode: 'error'; error: string };

async function getConversations(): Promise<ConvState> {
  const [res, profile] = await Promise.all([
    listConversationsAction(),
    getCurrentProfile(),
  ]);
  if (!res.ok) {
    // BE lỗi — hiển thị lỗi rõ ràng, không dùng dữ liệu giả.
    return { items: [], mode: 'error', error: res.error };
  }
  return {
    items: res.data.map((c) => adaptConversation(c, profile?.id ?? null)),
    mode: 'ok',
  };
}

export default async function HostMessagesPage(props: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const state = await getConversations();
  const all = state.items;
  const errorMsg = state.mode === 'error' ? state.error : null;
  const unreadCount = all.filter((c) => c.unread_owner > 0).length;
  const filtered =
    sp.filter === 'unread' ? all.filter((c) => c.unread_owner > 0) : all;

  const currentPage = parsePage(sp.page);
  const totalPages = pageCount(filtered.length, PAGE_SIZE);
  const pageItems = paginate(filtered, currentPage, PAGE_SIZE);

  function pageHref(page: number) {
    return buildPageHref('/host/messages', {
      filter: sp.filter,
      page: page > 1 ? String(page) : undefined,
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Tin nhắn"
        description="Trò chuyện với khách. Phản hồi nhanh để tăng tỷ lệ chốt đặt phòng."
        actions={
          <button
            type="button"
            aria-label="Tìm kiếm"
            className="grid h-10 w-10 place-items-center rounded-lg border border-ink-200 hover:bg-cream-100"
          >
            <Search className="h-4 w-4 text-ink-700" />
          </button>
        }
      />

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          <Lightbulb className="mr-2 inline h-4 w-4" />
          Không tải được hội thoại từ BE: {errorMsg}
        </div>
      )}

      <div className="mb-4">
        <FilterChips
          active={sp.filter ?? 'all'}
          items={[
            { key: 'all', label: 'Tất cả', href: '/host/messages', count: all.length },
            { key: 'unread', label: 'Chưa đọc', href: '/host/messages?filter=unread', count: unreadCount },
            { key: 'booking', label: 'Có booking', href: '/host/messages?filter=booking' },
            { key: 'returning', label: 'Khách quen', href: '/host/messages?filter=returning' },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <p className="text-2xl">💬</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-navy-900">Chưa có tin nhắn</h2>
          <p className="mt-1 text-sm text-ink-500">Khách nhắn tin sẽ hiện ở đây.</p>
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
                    c.unread_owner > 0 ? 'bg-navy-50/40 hover:bg-navy-50' : 'hover:bg-cream-100',
                  )}
                >
                  <GradientAvatar name={c.customer_name} size="lg" online={c.online} />
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
                          c.unread_owner > 0 ? 'font-bold text-navy-700' : 'text-ink-500',
                        )}
                      >
                        {relativeTime(c.last_message_at)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          'text-sm truncate',
                          c.unread_owner > 0 ? 'font-semibold text-ink-900' : 'text-ink-500',
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          buildHref={pageHref}
        />
        </>
      )}
    </div>
  );
}
