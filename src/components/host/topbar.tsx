import Link from 'next/link';

import {
  getUnreadNotificationCountAction,
  listNotificationsAction,
} from '@/app/actions/notifications';

import { HostMobileNav } from './mobile-nav';
import { NotificationBell } from './notification-bell';
import type { Profile } from '@/lib/legacy-types';

interface TopbarProps {
  profile: Pick<Profile, 'full_name' | 'email' | 'role' | 'avatar_url'>;
}

export async function HostTopbar({ profile }: TopbarProps) {
  const initial = (profile.full_name || profile.email || '?')
    .slice(0, 1)
    .toUpperCase();

  const [notifResult, countResult] = await Promise.all([
    listNotificationsAction({ limit: 10 }),
    getUnreadNotificationCountAction(),
  ]);
  const notifications = notifResult.ok ? notifResult.data : [];
  const unreadCount = countResult.ok ? countResult.data : 0;

  return (
    <div className="border-b border-ink-200 bg-cream-50/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <HostMobileNav />
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
          />
          <details className="relative">
            <summary className="list-none flex h-10 items-center gap-2 rounded-full border border-ink-200 bg-white px-2 py-1 hover:shadow-pill cursor-pointer">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-navy-900 text-white text-xs font-semibold">
                {initial}
              </span>
              <span className="hidden sm:inline-block pr-2 text-sm font-medium text-ink-900">
                {profile.full_name || profile.email}
              </span>
            </summary>
            <div className="absolute right-0 top-12 w-52 sm:w-56 rounded-xl bg-white py-2 ring-1 ring-ink-200 shadow-card-hover z-30">
              <div className="px-4 py-2 border-b border-ink-200">
                <div className="text-sm font-semibold text-ink-900 truncate">
                  {profile.full_name || profile.email}
                </div>
                <div className="text-xs text-gold-700 font-semibold uppercase tracking-wide">
                  {profile.role}
                </div>
              </div>
              <Link
                href="/host/settings"
                className="block px-4 py-2.5 text-sm text-ink-700 hover:bg-cream-100"
              >
                Cài đặt tài khoản
              </Link>
              <div className="my-1 border-t border-ink-200" />
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="w-full text-left px-4 py-2.5 text-sm text-ink-700 hover:bg-cream-100"
                >
                  Đăng xuất
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
