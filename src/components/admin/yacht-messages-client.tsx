'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { MessageSquare, Send } from 'lucide-react';

import { sendYachtMessageAction } from '@/app/actions/yacht-conversations';
import { Button } from '@/components/ui/button';
import type { Conversation, Message } from '@/core/entities/chat';
import { formatDateTime, relativeTime } from '@/lib/format';
import { refetchApiResources, useApiResource } from '@/lib/use-api-resource';
import { cn } from '@/lib/utils';

const POLL_MS = 15_000;

function customerLabel(conv: Conversation): string {
  const customer = conv.members.find((m) => m.role === 'customer');
  return customer?.user.name || conv.subject || 'Khách hàng';
}

export function YachtMessagesClient() {
  const { loading, error, data } = useApiResource<Conversation[]>('/api/admin/yacht-conversations');
  const [selected, setSelected] = useState<string | null>(null);

  // Poll: refetch mọi resource đang mount (list + thread) — ADMIN không nhận WS.
  useEffect(() => {
    const t = setInterval(() => refetchApiResources(), POLL_MS);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <span className="font-semibold">Không tải được hội thoại: </span>
        {error}
      </div>
    );
  }

  const convs = data ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-2xl bg-white shadow-card ring-1 ring-ink-200/60">
        <div className="border-b border-ink-200 px-4 py-3 text-sm font-semibold text-ink-700">
          Hội thoại du thuyền ({convs.length})
        </div>
        {convs.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-500">
            <MessageSquare className="mx-auto h-8 w-8 text-ink-300" />
            <p className="mt-2">Chưa có hội thoại nào</p>
          </div>
        ) : (
          <ul className="max-h-[70vh] divide-y divide-ink-100 overflow-y-auto">
            {convs.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors hover:bg-cream-100',
                    selected === c.id && 'bg-cream-100',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-navy-900">{customerLabel(c)}</span>
                    {c.lastMessageAt && (
                      <span className="shrink-0 text-[11px] text-ink-400">{relativeTime(c.lastMessageAt)}</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-500">{c.lastMessagePreview ?? 'Chưa có tin nhắn'}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-white shadow-card ring-1 ring-ink-200/60">
        {selected ? (
          <ThreadView conversationId={selected} />
        ) : (
          <div className="grid h-full min-h-[300px] place-items-center p-8 text-center text-sm text-ink-500">
            Chọn một hội thoại để xem tin nhắn
          </div>
        )}
      </div>
    </div>
  );
}

interface ThreadData {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
}

function ThreadView({ conversationId }: { conversationId: string }) {
  const { loading, error, data } = useApiResource<ThreadData>(
    `/api/admin/yacht-conversations/${conversationId}`,
  );
  const [draft, setDraft] = useState('');
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [data?.messages.length]);

  function send() {
    const content = draft.trim();
    if (!content) return;
    startTransition(async () => {
      const res = await sendYachtMessageAction({ conversationId, content });
      if (!res.ok) return;
      setDraft('');
      refetchApiResources();
    });
  }

  if (loading) {
    return <div className="grid min-h-[300px] place-items-center text-sm text-ink-500">Đang tải tin nhắn…</div>;
  }
  if (error || !data) {
    return (
      <div className="grid min-h-[300px] place-items-center text-sm text-amber-800">
        {error ?? 'Không tải được hội thoại'}
      </div>
    );
  }

  const nameById = new Map(data.conversation.members.map((m) => [m.userId, m.user.name]));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-200 px-4 py-3">
        <p className="font-semibold text-navy-900">{customerLabel(data.conversation)}</p>
        <p className="text-xs text-ink-500">{data.conversation.subject ?? 'Hội thoại du thuyền'}</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: '55vh' }}>
        {data.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-500">Chưa có tin nhắn</p>
        ) : (
          data.messages.map((m) => {
            const mine = m.senderId === data.currentUserId;
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[75%] rounded-2xl px-3.5 py-2', mine ? 'bg-navy-900 text-cream-50' : 'bg-cream-100 text-ink-900')}>
                  {!mine && (
                    <p className="mb-0.5 text-[11px] font-semibold text-ink-500">{nameById.get(m.senderId) ?? 'Khách'}</p>
                  )}
                  {m.deletedAt ? (
                    <p className="text-sm italic opacity-70">Tin nhắn đã thu hồi</p>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                  )}
                  <p className={cn('mt-1 text-[10px]', mine ? 'text-cream-50/60' : 'text-ink-400')}>{formatDateTime(m.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-ink-200 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Nhập tin nhắn trả lời khách…"
          className="h-11 flex-1 rounded-lg border border-ink-300 bg-white px-4 text-sm focus:border-ink-900 focus:outline-none"
        />
        <Button onClick={send} disabled={pending || !draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
