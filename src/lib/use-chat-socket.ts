'use client';

import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

import {
  disconnectChatSocket,
  getChatSocket,
  onChatEvent,
  type ChatSocketErrorPayload,
  type ChatSocketOptions,
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

export interface UseChatSocketResult {
  socket: Socket | null;
  connected: boolean;
}

/**
 * Connect to chat WS + auto-subscribe to selected events.
 *
 * `opts.accessToken` đổi → tự reconnect singleton.
 * Handlers ref-stable: lưu trong ref nội bộ để không re-subscribe mỗi render.
 */
export function useChatSocket(
  opts: ChatSocketOptions | null,
  handlers: UseChatSocketHandlers = {},
): UseChatSocketResult {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Stabilize opts với primitive equality để effect không re-run khi caller
  // truyền inline object mỗi render.
  const token = opts?.accessToken ?? null;
  const locale = opts?.locale ?? null;
  const baseUrl = opts?.baseUrl ?? null;

  useEffect(() => {
    if (!token) {
      // Cleanup singleton khi user logout / opts = null. Không chỉ clear state
      // local — phải tear down WebSocket cũ với token đã revoke.
      disconnectChatSocket();
      setSocket(null);
      setConnected(false);
      return;
    }
    const opts: ChatSocketOptions = {
      accessToken: token,
      locale: locale ?? undefined,
      baseUrl: baseUrl ?? undefined,
    };
    const sock = getChatSocket(opts);
    setSocket(sock);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    if (sock.connected) setConnected(true);

    const unsubs = [
      onChatEvent(sock, 'message:new', (p) => handlersRef.current.onMessage?.(p)),
      onChatEvent(sock, 'message:edit', (p) =>
        handlersRef.current.onMessageEdit?.(p),
      ),
      onChatEvent(sock, 'message:delete', (p) =>
        handlersRef.current.onMessageDelete?.(p),
      ),
      onChatEvent(sock, 'read:update', (p) => handlersRef.current.onRead?.(p)),
      onChatEvent(sock, 'typing', (p) => handlersRef.current.onTyping?.(p)),
      onChatEvent(sock, 'presence', (p) => handlersRef.current.onPresence?.(p)),
      onChatEvent(sock, 'error', (p) => handlersRef.current.onError?.(p)),
    ];

    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      for (const u of unsubs) u();
    };
  }, [token, locale, baseUrl]);

  return { socket, connected };
}
