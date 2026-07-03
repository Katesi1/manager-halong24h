'use client';

import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';

import {
  onChatEvent,
  type ChatSocketErrorPayload,
  type MessageDeletePayload,
  type MessageEditPayload,
  type MessageNewPayload,
  type PresencePayload,
  type ReadUpdatePayload,
  type TypingPayload,
} from './chat-socket';

export interface UseChatSocketHandlers {
  onMessage?: (p: MessageNewPayload) => void;
  onMessageEdit?: (p: MessageEditPayload) => void;
  onMessageDelete?: (p: MessageDeletePayload) => void;
  onRead?: (p: ReadUpdatePayload) => void;
  onTyping?: (p: TypingPayload) => void;
  onPresence?: (p: PresencePayload) => void;
  onError?: (p: ChatSocketErrorPayload) => void;
}

/**
 * Subscribe các event chat trên một socket ĐÃ được kết nối sẵn
 * (bởi `ChatSocketProvider`). Không tự tạo/huỷ connection — connection sống
 * ở tầng layout, connect ngay sau login (contract §17.4).
 *
 * Handlers ref-stable: lưu trong ref nội bộ để không re-subscribe mỗi render.
 * Chỉ re-subscribe khi chính `socket` đổi (vd sau reconnect với token mới).
 */
export function useChatEvents(
  socket: Socket | null,
  handlers: UseChatSocketHandlers,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!socket) return;

    const unsubs = [
      onChatEvent(socket, 'message:new', (p) =>
        handlersRef.current.onMessage?.(p),
      ),
      onChatEvent(socket, 'message:edit', (p) =>
        handlersRef.current.onMessageEdit?.(p),
      ),
      onChatEvent(socket, 'message:delete', (p) =>
        handlersRef.current.onMessageDelete?.(p),
      ),
      onChatEvent(socket, 'read:update', (p) => handlersRef.current.onRead?.(p)),
      onChatEvent(socket, 'typing', (p) => handlersRef.current.onTyping?.(p)),
      onChatEvent(socket, 'presence', (p) =>
        handlersRef.current.onPresence?.(p),
      ),
      onChatEvent(socket, 'error', (p) => handlersRef.current.onError?.(p)),
    ];

    return () => {
      for (const u of unsubs) u();
    };
  }, [socket]);
}
