'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { ArrowDown } from 'lucide-react';

import {
  listMessagesAction,
  markConversationReadAction,
  sendMessageAction,
} from '@/app/actions/conversations';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatStatusBar } from '@/components/chat/status-bar';
import { useChatConnection } from '@/components/chat/chat-socket-provider';
import type { Message } from '@/core/entities/chat';
import {
  chatErrorMessage,
  emitChatRead,
  emitTypingStart,
  emitTypingStop,
} from '@/lib/chat-socket';
import { useChatEvents } from '@/lib/use-chat-socket';

/** Throttle window cho `typing:start` — spec §17.6 gợi ý 3s. */
const TYPING_EMIT_INTERVAL_MS = 3000;
/** Sau N ms không gõ thêm → tự gửi `typing:stop`. */
const TYPING_STOP_DELAY_MS = 4000;

interface Props {
  conversationId: string;
  currentUserId: string;
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
  const [atBottom, setAtBottom] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Throttle state cho typing:start emit + auto-stop timer.
  const lastTypingEmitRef = useRef(0);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref tracking action gần nhất để phân biệt append (scroll bottom) vs
  // prepend (giữ vị trí scroll), tránh kéo user về cuối khi loadOlder.
  const lastAppendRef = useRef(true);

  // Socket dùng chung, đã connect ở layout (sau login). ChatThread chỉ subscribe
  // event của hội thoại này — không tự quản connection/token.
  const { socket, connected } = useChatConnection();

  useChatEvents(socket, {
    onMessage: (p) => {
      if (p.conversationId !== conversationId) return;
      // Bug fix: skip tin nhắn do CHÍNH MÌNH gửi — đã có optimistic + REST
      // response sẽ là authoritative. Nhận lại qua WS chỉ gây duplicate.
      if (p.message.senderId === currentUserId) return;
      // Normalize payload WS (content/attachments có thể null) trước khi vào state.
      const incoming: Message = {
        ...p.message,
        content: p.message.content ?? '',
        attachments: p.message.attachments ?? [],
      };
      setMessages((prev) =>
        prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
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
    onError: (p) => {
      // tokenExpired được Provider xử lý (refresh + reconnect) → không hiện lỗi,
      // tránh nhấp nháy trong lúc kết nối lại.
      if (p.code === 'tokenExpired') return;
      setError(p.message ?? chatErrorMessage(p.code ?? ''));
    },
  });

  useEffect(() => {
    if (connected) setError(null);
  }, [connected]);

  // Auto-scroll chỉ khi append tin mới VÀ user đang gần cuối.
  useEffect(() => {
    if (lastAppendRef.current && atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, atBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distance < 100);
  }, []);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  // Mark read khi mount + khi nhận tin mới TỪ NGƯỜI KHÁC (tránh spam BE).
  const lastMessage = messages[messages.length - 1];
  const lastFromOther =
    lastMessage && lastMessage.senderId !== currentUserId;
  useEffect(() => {
    if (!lastFromOther) return;
    void markConversationReadAction(conversationId);
    // Emit socket `read` để peer nhận `read:update` realtime (contract §17.4).
    // REST vẫn giữ để cập nhật badge server-side khi reload.
    if (socket && connected) emitChatRead(socket, conversationId);
  }, [conversationId, lastFromOther, lastMessage?.id, socket, connected]);

  useEffect(() => {
    void markConversationReadAction(conversationId);
    if (socket && connected) emitChatRead(socket, conversationId);
  }, [conversationId, socket, connected]);

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

  function handleTextKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter để gửi; Shift+Enter cho dòng mới (chuẩn chat UX).
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  }

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
      // Merge response vào optimistic thay vì thay thế nguyên khối — BE có thể
      // trả thiếu field (id/content/attachments) → giữ giá trị optimistic làm
      // fallback để không render message hỏng (crash .id/.length).
      const confirmed: Message = {
        ...optimistic,
        ...res.data,
        id: res.data?.id ?? optimistic.id,
        content: res.data?.content ?? optimistic.content,
        attachments: res.data?.attachments ?? optimistic.attachments,
      };
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? confirmed : m)),
      );
    } else {
      // Rollback optimistic + restore composer state để user retry.
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(content);
      setError(res.error);
    }
  }

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-3 overflow-y-auto bg-cream-50 px-4 py-4"
      >
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

      {!atBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Cuộn xuống tin mới nhất"
          className="absolute bottom-28 right-6 grid h-10 w-10 place-items-center rounded-full bg-white shadow-lg ring-1 ring-ink-200 hover:bg-cream-100 transition-transform hover:scale-105"
        >
          <ArrowDown className="h-4 w-4 text-ink-700" />
        </button>
      )}

      <div className="border-t border-ink-200 bg-white">
        <ChatStatusBar
          peerOnline={!!peerUserId && onlineUsers.has(peerUserId)}
          someoneTyping={typingUsers.size > 0}
          error={error}
        />
        <form onSubmit={handleSend} className="flex items-end gap-2 p-3">
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleTextKeyDown}
            rows={2}
            placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
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
    </div>
  );
}
