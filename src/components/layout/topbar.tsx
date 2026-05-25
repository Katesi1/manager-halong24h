import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

import {
  getUnreadNotificationCountAction,
  listNotificationsAction,
} from '@/app/actions/notifications';

import { NotificationBell } from '@/components/host/notification-bell';
import type { UserProfile } from '@/core/entities/user';
import { roleName } from '@/core/value-objects/role';

interface AdminAlerts {
  kycPending?: number;
}

interface TopbarProps {
  profile: Pick<UserProfile, 'name' | 'email' | 'role'>;
  adminAlerts?: AdminAlerts;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  OWNER: 'Chủ nhà',
  SALE: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
};

export async function ManagerTopbar({ profile, adminAlerts }: TopbarProps) {
  const initial = (profile.name || profile.email || '?')
    .slice(0, 1)
    .toUpperCase();

  const [notifResult, countResult] = await Promise.all([
    listNotificationsAction({ limit: 10 }),
    getUnreadNotificationCountAction(),
  ]);
  const notifications = notifResult.ok ? notifResult.data : [];
  const unreadCount = countResult.ok ? countResult.data : 0;

  const roleKey = roleName(profile.role);
  const roleLabel = ROLE_LABEL[roleKey] ?? roleKey;

  return (
    <div className="border-b border-ink-200 bg-cream-50/95 backdrop-blur">
      <div className="flex h-14 items-center justify-end px-4 pl-14 lg:pl-6 lg:px-6">
        <div className="flex items-center gap-3">
          {adminAlerts?.kycPending != null && adminAlerts.kycPending > 0 && (
            <Link
              href="/admin/kyc?status=awaiting_approval"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-gold-50 px-3 py-1.5 text-xs font-semibold text-gold-800 ring-1 ring-gold-200 transition-colors hover:bg-gold-100"
              title="Hồ sơ KYC chờ duyệt"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {adminAlerts.kycPending} KYC chờ duyệt
            </Link>
          )}
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
                {profile.name || profile.email}
              </span>
            </summary>
            <div className="absolute right-0 top-12 w-52 sm:w-56 rounded-xl bg-white py-2 ring-1 ring-ink-200 shadow-card-hover z-30">
              <div className="px-4 py-2 border-b border-ink-200">
                <div className="text-sm font-semibold text-ink-900 truncate">
                  {profile.name || profile.email}
                </div>
                <div className="text-xs text-gold-700 font-semibold uppercase tracking-wide">
                  {roleLabel}
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
