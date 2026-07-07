'use client';

import Link from 'next/link';

import { ChatThread } from '@/components/chat/chat-thread';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import type {
  Conversation as SpecConversation,
  Message,
} from '@/core/entities/chat';
import { useApiResource } from '@/lib/use-api-resource';
import { cn } from '@/lib/utils';

interface ChatDetailData {
  conv: SpecConversation;
  allConvs: SpecConversation[];
  currentUserId: string;
  peerUserId: string | null;
  initialMessages: Message[];
  initialNextCursor: string | null;
}

function customerOf(conv: SpecConversation) {
  return conv.members.find((m) => m.role === 'customer');
}

function customerNameOf(conv: SpecConversation): string {
  return customerOf(conv)?.user.name ?? 'Khách';
}

/**
 * Chi tiết hội thoại fetch từ `/api/host/messages/:id` PHÍA CLIENT → endpoint
 * hiện trong F12 Network (XHR). Tin realtime tiếp theo đi qua WebSocket.
 */
export function ChatDetailClient({ id }: { id: string }) {
  const { loading, error, data } = useApiResource<ChatDetailData>(
    `/api/host/messages/${id}`,
  );

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-500">Đang tải…</div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
        {error ?? 'Không tìm thấy hội thoại'}
      </div>
    );
  }

  const { conv, allConvs, currentUserId, peerUserId } = data;
  const customerName = customerNameOf(conv);

  return (
    <>
      <div className="mb-3">
        <Link
          href="/host/messages"
          className="inline-flex items-center gap-1 text-sm text-ink-700 hover:text-navy-700"
        >
          ← Tất cả hội thoại
        </Link>
      </div>

      <h1 className="mb-3 font-display text-lg font-semibold text-ink-900">
        Hội thoại với {customerName}
        {conv.subject && (
          <span className="ml-2 text-sm font-normal text-ink-500">
            · {conv.subject}
          </span>
        )}
      </h1>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Conversation list (hidden on mobile) */}
        <aside className="hidden lg:block overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200">
          {allConvs.length === 0 ? (
            <p className="p-4 text-xs text-ink-500">Chưa có hội thoại khác.</p>
          ) : (
            <ul className="divide-y divide-ink-200">
              {allConvs.map((c) => {
                const name = customerNameOf(c);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/host/messages/${c.id}`}
                      className={cn(
                        'block px-3 py-3 transition-colors',
                        c.id === id ? 'bg-navy-50' : 'hover:bg-cream-100',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <GradientAvatar name={name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink-900">
                            {name}
                          </p>
                          <p className="truncate text-xs text-ink-500">
                            {c.lastMessagePreview ?? '—'}
                          </p>
                        </div>
                        {c.myUnread > 0 && (
                          <span className="rounded-full bg-rose-500 px-1.5 text-[10px] text-white">
                            {c.myUnread}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Thread + composer */}
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200 flex flex-col min-h-[60vh]">
          <header className="flex items-center gap-3 border-b border-ink-200 px-4 py-3">
            <GradientAvatar name={customerName} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink-900">
                {customerName}
              </p>
              <p className="truncate text-xs text-ink-500">
                {conv.subject ?? `#${conv.id.slice(0, 8)}`}
              </p>
            </div>
          </header>

          <ChatThread
            conversationId={id}
            currentUserId={currentUserId}
            peerUserId={peerUserId}
            initialMessages={data.initialMessages}
            initialNextCursor={data.initialNextCursor}
          />
        </section>
      </div>
    </>
  );
}
