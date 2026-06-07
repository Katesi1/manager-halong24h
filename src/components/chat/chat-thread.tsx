'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  listMessagesAction,
  markConversationReadAction,
  sendMessageAction,
} from '@/app/actions/conversations';
import { MessageBubble } from '@/components/chat/message-bubble';
import type { Message } from '@/core/entities/chat';
import { emitTypingStart, emitTypingStop } from '@/lib/chat-socket';
import { useChatSocket } from '@/lib/use-chat-socket';
import { cn } from '@/lib/utils';

/** Throttle window cho `typing:start` — spec §17.6 gợi ý 3s. */
const TYPING_EMIT_INTERVAL_MS = 3000;
/** Sau N ms không gõ thêm → tự gửi `typing:stop`. */
const TYPING_STOP_DELAY_MS = 4000;

interface Props {
  conversationId: string;
  currentUserId: string;
  /**
   * Access token cho Socket.IO `auth.token` (Spec §17.4 connect example).
   * Cố tình expose JWT vào client bundle vì WS client cần. Tradeoff: token
   * 15-min TTL + httpOnly cookie vẫn là primary auth. Đừng dùng cho mục đích
   * khác trên client.
   */
  accessToken: string;
  /** ID của peer chính (customer) — dùng để show presence indicator. */
  peerUserId?: string | null;
  /** Tin nhắn ban đầu Server Component đã fetch (oldest-first). */
  initialMessages: Message[];
  /** Cursor để load older messages (nếu BE đã trả). */
  initialNextCursor: string | null;
}

export function ChatThread({
  conversationId,
  currentUserId,
  accessToken,
  peerUserId,
  initialMessages,
  initialNextCursor,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(() => new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(() => new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  // Throttle state cho typing:start emit + auto-stop timer.
  const lastTypingEmitRef = useRef(0);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wsOpts = useMemo(
    () => ({ accessToken, locale: 'vi' as const }),
    [accessToken],
  );

  // Ref tracking action gần nhất để phân biệt append (scroll bottom) vs
  // prepend (giữ vị trí scroll), tránh kéo user về cuối khi loadOlder.
  const lastAppendRef = useRef(true);

  const { socket, connected } = useChatSocket(wsOpts, {
    onMessage: (p) => {
      if (p.conversationId !== conversationId) return;
      // Bug fix: skip tin nhắn do CHÍNH MÌNH gửi — đã có optimistic + REST
      // response sẽ là authoritative. Nhận lại qua WS chỉ gây duplicate.
      if (p.message.senderId === currentUserId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === p.message.id) ? prev : [...prev, p.message],
      );
      lastAppendRef.current = true;
    },
    onMessageEdit: (p) => {
      if (p.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === p.message.id
            ? { ...m, content: p.message.content, editedAt: p.message.editedAt }
            : m,
        ),
      );
    },
    onMessageDelete: (p) => {
      if (p.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === p.messageId
            ? { ...m, deletedAt: new Date().toISOString() }
            : m,
        ),
      );
    },
    onTyping: (p) => {
      if (p.conversationId !== conversationId) return;
      if (p.userId === currentUserId) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (p.typing) next.add(p.userId);
        else next.delete(p.userId);
        return next;
      });
    },
    onPresence: (p) => {
      if (p.userId === currentUserId) return;
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (p.online) next.add(p.userId);
        else next.delete(p.userId);
        return next;
      });
    },
    onError: (p) => setError(p.message),
  });

  // Clear error khi kết nối lại được.
  useEffect(() => {
    if (connected) setError(null);
  }, [connected]);

  // Auto-scroll xuống cuối CHỈ khi append (tin mới), không khi prepend (load older).
  useEffect(() => {
    if (lastAppendRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Mark read khi mount + khi nhận tin mới TỪ NGƯỜI KHÁC.
  // Tránh spam BE khi user tự gửi nhiều tin liên tiếp.
  const lastMessage = messages[messages.length - 1];
  const lastFromOther =
    lastMessage && lastMessage.senderId !== currentUserId;
  useEffect(() => {
    if (lastFromOther) {
      void markConversationReadAction(conversationId);
    }
  }, [conversationId, lastFromOther, lastMessage?.id]);

  // Mark read 1 lần khi mount (initial unread).
  useEffect(() => {
    void markConversationReadAction(conversationId);
  }, [conversationId]);

  // Cleanup typing timer khi unmount + emit stop nếu đang typing.
  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
      }
      if (socket && lastTypingEmitRef.current > 0) {
        emitTypingStop(socket, conversationId);
      }
    };
  }, [socket, conversationId]);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    if (!socket || !connected) return;

    const now = Date.now();
    if (now - lastTypingEmitRef.current > TYPING_EMIT_INTERVAL_MS) {
      emitTypingStart(socket, conversationId);
      lastTypingEmitRef.current = now;
    }

    // Reset auto-stop timer mỗi keystroke.
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
    }
    typingStopTimerRef.current = setTimeout(() => {
      if (socket) emitTypingStop(socket, conversationId);
      lastTypingEmitRef.current = 0;
    }, TYPING_STOP_DELAY_MS);
  }

  async function loadOlder() {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    const res = await listMessagesAction(conversationId, nextCursor, 50);
    setLoadingOlder(false);
    if (res.ok) {
      lastAppendRef.current = false; // Prepend — đừng scroll xuống cuối
      setMessages((prev) => [...res.data.items, ...prev]);
      setNextCursor(res.data.nextCursor);
    } else {
      setError(res.error);
    }
  }

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    // Unique id để tránh collision khi gửi 2 tin trong cùng ms.
    const localId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `local-${crypto.randomUUID()}`
        : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: Message = {
      id: localId,
      conversationId,
      senderId: currentUserId,
      content,
      attachments: [],
      isSystem: false,
      editedAt: null,
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    lastAppendRef.current = true;
    setMessages((prev) => [...prev, optimistic]);
    setText('');

    const res = await sendMessageAction({ conversationId, content });
    setSending(false);
    if (res.ok) {
      // Replace optimistic với message thật (BE trả id chính thức).
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? res.data : m)),
      );
    } else {
      // Rollback optimistic + show error.
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError(res.error);
      setText(content); // Cho user retry
    }
  }

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto bg-cream-50 px-4 py-4">
        {nextCursor && (
          <div className="text-center">
            <button
              type="button"
              onClick={loadOlder}
              disabled={loadingOlder}
              className="rounded-full bg-white px-3 py-1 text-xs text-ink-600 ring-1 ring-ink-200 hover:bg-cream-100 disabled:opacity-50"
            >
              {loadingOlder ? 'Đang tải...' : '↑ Tin cũ hơn'}
            </button>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            fromMe={m.senderId === currentUserId}
            onEdited={(u) =>
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === u.id
                    ? { ...msg, content: u.content, editedAt: u.editedAt }
                    : msg,
                ),
              )
            }
            onDeleted={(messageId) =>
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === messageId
                    ? { ...msg, deletedAt: new Date().toISOString() }
                    : msg,
                ),
              )
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-ink-200 bg-white">
        <div className="flex items-center justify-between px-4 py-1 text-[10px] text-ink-400">
          <span
            className={cn(
              'inline-flex items-center gap-1',
              connected ? 'text-emerald-600' : 'text-ink-400',
            )}
          >
            <span
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full',
                connected ? 'bg-emerald-500' : 'bg-ink-300',
              )}
            />
            {connected ? 'Trực tuyến' : 'Đang kết nối...'}
          </span>
          {peerUserId && onlineUsers.has(peerUserId) && (
            <span className="text-emerald-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
              Đang online
            </span>
          )}
          {typingUsers.size > 0 && (
            <span className="italic text-ink-500">
              Đang nhập tin nhắn...
            </span>
          )}
          {error && <span className="text-rose-600">{error}</span>}
        </div>
        <form onSubmit={handleSend} className="flex items-end gap-2 p-3">
          <textarea
            value={text}
            onChange={handleTextChange}
            rows={2}
            placeholder="Nhập tin nhắn..."
            disabled={sending}
            className="flex-1 resize-none rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700/30 disabled:bg-cream-100"
            aria-label="Nội dung tin nhắn"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="h-10 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {sending ? '...' : 'Gửi'}
          </button>
        </form>
      </div>
    </>
  );
}
