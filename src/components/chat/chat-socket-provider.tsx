'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Socket } from 'socket.io-client';

import { refreshChatTokenAction } from '@/app/actions/auth';
import {
  disconnectChatSocket,
  getChatSocket,
  onChatEvent,
} from '@/lib/chat-socket';

interface ChatConnection {
  socket: Socket | null;
  connected: boolean;
  currentUserId: string | null;
}

const ChatConnectionContext = createContext<ChatConnection>({
  socket: null,
  connected: false,
  currentUserId: null,
});

/** Đọc socket chat dùng chung (đã connect ở layout). */
export function useChatConnection(): ChatConnection {
  return useContext(ChatConnectionContext);
}

interface Props {
  /**
   * accessToken REST hiện tại (server-fetched). Socket.IO `auth.token` dùng
   * CHÍNH token này (contract chung App+Web — không có key riêng cho socket).
   * Cố tình expose vào client bundle vì WS client cần; token TTL 15 phút +
   * httpOnly cookie vẫn là primary auth.
   */
  initialAccessToken: string;
  currentUserId: string;
  children: React.ReactNode;
}

/**
 * Kết nối chat WS NGAY khi vào khu vực quản lý (sau login) — không lazy theo
 * màn hình. Giữ 1 connection sống suốt phiên để nhận `message:new`/`presence`
 * ở mọi trang, không chỉ trang hội thoại.
 *
 * tokenExpired flow (contract §17.4): nhận `error{code:'tokenExpired'}` →
 * refresh accessToken qua REST Server Action → set token mới → reconnect.
 */
export function ChatSocketProvider({
  initialAccessToken,
  currentUserId,
  children,
}: Props) {
  const router = useRouter();
  const [token, setToken] = useState(initialAccessToken);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  // Chặn refresh storm: chỉ 1 lần refresh in-flight cho mỗi lần token hết hạn.
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (!token) {
      disconnectChatSocket();
      setSocket(null);
      setConnected(false);
      return;
    }

    const sock = getChatSocket({ accessToken: token, locale: 'vi' });
    setSocket(sock);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    if (sock.connected) setConnected(true);

    const offError = onChatEvent(sock, 'error', (p) => {
      if (p.code !== 'tokenExpired' || refreshingRef.current) return;
      refreshingRef.current = true;
      void refreshChatTokenAction()
        .then((res) => {
          refreshingRef.current = false;
          if (res.ok) {
            // setToken → effect re-run → getChatSocket recreate với token mới.
            setToken(res.accessToken);
          } else if (res.kicked) {
            // Phiên bị đá (login thiết bị khác) → tear down + về login kèm lý do
            // (§1.6.1.4). Token đã bị clear server-side.
            disconnectChatSocket();
            router.replace('/login?reason=session-ended');
          }
          // Các fail khác: giữ nguyên; request REST kế tiếp sẽ redirect /login.
        })
        .catch(() => {
          refreshingRef.current = false;
        });
    });

    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      offError();
    };
  }, [token, router]);

  // Tear down hoàn toàn khi rời khu vực quản lý (logout / thoát route group).
  // Điều hướng giữa các trang cùng layout KHÔNG unmount → connection giữ nguyên.
  useEffect(() => {
    return () => {
      disconnectChatSocket();
    };
  }, []);

  return (
    <ChatConnectionContext.Provider
      value={{ socket, connected, currentUserId }}
    >
      {children}
    </ChatConnectionContext.Provider>
  );
}
