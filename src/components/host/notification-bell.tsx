'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/app/actions/notifications';
import { cn } from '@/lib/utils';
import { relativeTime } from '@/lib/format';
import { notificationHref, type ManagerArea } from '@/lib/notification-link';
import type { Notification } from '@/core/entities/notification';
import { useToast } from '@/components/ui/toast';

interface Props {
  notifications: Notification[];
  unreadCount: number;
  /** Khu vực đang đứng — quyết định deep-link trỏ /admin/* hay /host/* */
  area?: ManagerArea;
}

export function NotificationBell({
  notifications,
  unreadCount,
  area = 'host',
}: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  // Không dùng backdrop `fixed inset-0`: topbar có backdrop-blur nên
  // position:fixed của con bị giới hạn trong topbar, không phủ được cả trang.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function onMarkRead(id: string, link: string | null) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      setOpen(false);
      if (link) {
        router.push(link);
      } else {
        router.refresh();
      }
    });
  }

  function onMarkAll() {
    startTransition(async () => {
      const r = await markAllNotificationsReadAction();
      if (r.ok) {
        show('✓ Đã đánh dấu tất cả là đã đọc', 'success');
        router.refresh();
      } else {
        show(r.error || 'Có lỗi', 'error');
      }
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-cream-100"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-80 rounded-2xl bg-white shadow-floating ring-1 ring-ink-200">
            <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
              <p className="font-display text-lg font-semibold tracking-tight text-navy-900">
                Thông báo
              </p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAll}
                  className="text-xs font-semibold text-navy-700 hover:underline"
                >
                  Đánh dấu đã đọc tất cả
                </button>
              )}
            </div>
            <ul className="max-h-[420px] overflow-y-auto divide-y divide-ink-200">
              {notifications.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-ink-500">
                  Chưa có thông báo nào.
                </li>
              ) : (
                notifications.map((n) => {
                  const unread = !n.readAt;
                  const href = notificationHref(n, area);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onMarkRead(n.id, href)}
                        className={cn(
                          'block w-full text-left px-4 py-3 transition-colors hover:bg-cream-100',
                          unread && 'bg-navy-50/30',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {unread && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-navy-700" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'text-sm',
                                unread
                                  ? 'font-semibold text-ink-900'
                                  : 'font-medium text-ink-700',
                              )}
                            >
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="mt-0.5 text-xs text-ink-500 line-clamp-2">
                                {n.body}
                              </p>
                            )}
                            <p className="mt-1 text-[11px] text-ink-400">
                              {relativeTime(n.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="border-t border-ink-200 px-4 py-2 text-center">
              <Link
                href="/host/notifications"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-navy-700 hover:underline"
              >
                Xem tất cả thông báo →
              </Link>
            </div>
        </div>
      )}
    </div>
  );
}
