import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

import {
  getUnreadNotificationCountAction,
  listNotificationsAction,
} from '@/app/actions/notifications';

import { NotificationBell } from '@/components/host/notification-bell';
import { UserMenu } from '@/components/layout/user-menu';
import type { UserProfile } from '@/core/entities/user';
import { roleName } from '@/core/value-objects/role';

interface AdminAlerts {
  kycPending?: number;
}

interface TopbarProps {
  profile: Pick<UserProfile, 'name' | 'email' | 'role' | 'avatar'>;
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
            area={roleKey === 'ADMIN' ? 'admin' : 'host'}
          />
          <UserMenu
            displayName={profile.name || profile.email}
            roleLabel={roleLabel}
            initial={initial}
            avatar={profile.avatar}
          />
        </div>
      </div>
    </div>
  );
}
