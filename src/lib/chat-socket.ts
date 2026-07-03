'use client';

import { io, type Socket } from 'socket.io-client';

import type {
  Message,
  SendMessageInput,
} from '@/core/entities/chat';

/**
 * Chat WebSocket client — spec §17.4.
 *
 * Singleton per browser tab. Tự reconnect khi mất mạng.
 * Multi-device: BE broadcast tới mọi socket của cùng user.
 *
 * Usage:
 *   const sock = getChatSocket({ accessToken, locale: 'vi' });
 *   sock.on('message:new', ({ message }) => …);
 *   sock.emit('message:send', { conversationId, content });
 */

export type ChatSocketEvent =
  | 'message:new'
  | 'message:ack'
  | 'message:edit'
  | 'message:delete'
  | 'read:update'
  | 'typing'
  | 'presence'
  | 'error';

export interface ChatSocketOptions {
  accessToken: string;
  locale?: 'vi' | 'en';
  /** Override base URL (mặc định lấy từ NEXT_PUBLIC_API_BASE_URL). */
  baseUrl?: string;
}

export interface MessageNewPayload {
  conversationId: string;
  message: Message;
}

export interface MessageAckPayload {
  localContent: string;
  message: Message;
}

export interface MessageEditPayload {
  conversationId: string;
  message: Pick<Message, 'id' | 'conversationId' | 'content' | 'editedAt'>;
}

export interface MessageDeletePayload {
  conversationId: string;
  messageId: string;
}

export interface ReadUpdatePayload {
  conversationId: string;
  userId: string;
  lastReadAt: string;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  typing: boolean;
}

export interface PresencePayload {
  userId: string;
  online: boolean;
}

export interface ChatSocketErrorPayload {
  /**
   * Spec §17.4: `error { code?, message }`. `code='tokenExpired'` (kèm BE
   * `disconnect(true)` khi accessToken 15' hết hạn giữa session) → client
   * refresh accessToken (REST) + reconnect. `code` có thể vắng ở lỗi generic.
   */
  code?: string;
  /** Message đã dịch theo locale (BE luôn gửi; để optional cho phòng thủ). */
  message?: string;
}

/** Map `error.code` → thông báo tiếng Việt cho UI. */
export function chatErrorMessage(code: string): string {
  switch (code) {
    case 'tokenExpired':
      return 'Phiên đã hết hạn, đang kết nối lại…';
    case 'unauthorized':
      return 'Không có quyền truy cập hội thoại này.';
    case 'forbidden':
      return 'Bạn không được phép thực hiện thao tác này.';
    default:
      return 'Mất kết nối trò chuyện. Đang thử lại…';
  }
}

type EventPayloadMap = {
  'message:new': MessageNewPayload;
  'message:ack': MessageAckPayload;
  'message:edit': MessageEditPayload;
  'message:delete': MessageDeletePayload;
  'read:update': ReadUpdatePayload;
  typing: TypingPayload;
  presence: PresencePayload;
  error: ChatSocketErrorPayload;
};

let singleton: Socket | null = null;
let currentToken: string | null = null;

function resolveBaseUrl(override?: string): string {
  if (override) return override;
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

export function getChatSocket(opts: ChatSocketOptions): Socket {
  // Token đổi (refresh) → disconnect + recreate.
  if (singleton && currentToken !== opts.accessToken) {
    singleton.disconnect();
    singleton = null;
  }
  if (singleton) return singleton;

  const url = `${resolveBaseUrl(opts.baseUrl)}/chat`;
  singleton = io(url, {
    auth: { token: opts.accessToken },
    query: { lang: opts.locale ?? 'vi' },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });
  currentToken = opts.accessToken;
  return singleton;
}

export function disconnectChatSocket(): void {
  if (singleton) {
    singleton.disconnect();
    singleton = null;
    currentToken = null;
  }
}

export function onChatEvent<E extends ChatSocketEvent>(
  socket: Socket,
  event: E,
  handler: (payload: EventPayloadMap[E]) => void,
): () => void {
  // socket.io typings stricter — relax via any-cast at boundary.
  const cast = handler as (...args: unknown[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (socket as any).on(event, cast);
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket as any).off(event, cast);
  };
}

export function sendChatMessage(
  socket: Socket,
  input: SendMessageInput,
): void {
  socket.emit('message:send', input);
}

export function emitChatRead(socket: Socket, conversationId: string): void {
  socket.emit('read', { conversationId });
}

export function emitTypingStart(
  socket: Socket,
  conversationId: string,
): void {
  socket.emit('typing:start', { conversationId });
}

export function emitTypingStop(
  socket: Socket,
  conversationId: string,
): void {
  socket.emit('typing:stop', { conversationId });
}
