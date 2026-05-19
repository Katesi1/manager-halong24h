'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  BedDouble,
  Building,
  Building2,
  Calendar,
  CalendarDays,
  CreditCard,
  History,
  Inbox,
  KeyRound,
  LayoutGrid,
  LogOut,
  type LucideIcon,
  MessageSquare,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';

import type { UserProfile } from '@/core/entities/user';
import { RoleCode } from '@/core/value-objects/role';
import { cn } from '@/lib/utils';

type Audience = 'admin' | 'manager';
type BadgeKey = 'kyc' | 'leads';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badgeKey?: BadgeKey;
  audience: Audience;
  /** Ẩn với SALE (chỉ OWNER + ADMIN thấy) */
  hideForSale?: boolean;
  /** Link external (mở tab mới với rel noopener) */
  external?: boolean;
}

// URL preview Sale Calendar — đọc từ env, fallback localhost dev
const SALE_CALENDAR_URL =
  process.env.NEXT_PUBLIC_SALE_CALENDAR_URL ?? 'http://localhost:3003';

interface NavGroup {
  id: string;
  label: string;
  audience: Audience;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  // ──────────── ADMIN ONLY ────────────
  {
    id: 'platform-ops',
    label: 'Vận hành hệ thống',
    audience: 'admin',
    items: [
      { href: '/admin', label: 'Tổng quan hệ thống', icon: LayoutGrid, exact: true, audience: 'admin' },
      { href: '/admin/kyc', label: 'Duyệt KYC', icon: ShieldCheck, badgeKey: 'kyc', audience: 'admin' },
      { href: '/admin/users', label: 'Người dùng', icon: Users, audience: 'admin' },
      { href: '/admin/properties', label: 'Cơ sở (toàn hệ thống)', icon: Building, audience: 'admin' },
      { href: '/admin/bookings', label: 'Đặt phòng (toàn hệ thống)', icon: BedDouble, audience: 'admin' },
    ],
  },
  {
    id: 'platform-finance',
    label: 'Tài chính & hỗ trợ',
    audience: 'admin',
    items: [
      { href: '/admin/payments', label: 'Subscription chủ nhà', icon: Wallet, audience: 'admin' },
      { href: '/admin/disputes', label: 'Khiếu nại', icon: AlertTriangle, audience: 'admin' },
      { href: '/admin/reviews', label: 'Kiểm duyệt review', icon: MessageSquare, audience: 'admin' },
      { href: '/admin/reports', label: 'Báo cáo', icon: TrendingUp, audience: 'admin' },
      { href: '/admin/audit-log', label: 'Nhật ký kiểm toán', icon: History, audience: 'admin' },
    ],
  },
  {
    id: 'platform-config',
    label: 'Cấu hình hệ thống',
    audience: 'admin',
    items: [
      { href: '/admin/permissions', label: 'Phân quyền', icon: KeyRound, audience: 'admin' },
      { href: '/admin/app-version', label: 'Phiên bản app', icon: Smartphone, audience: 'admin' },
      { href: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings, audience: 'admin' },
    ],
  },
  // ──────────── EVERYONE (ADMIN + OWNER + SALE) ────────────
  {
    id: 'overview',
    label: 'Tổng quan',
    audience: 'manager',
    items: [
      { href: '/host', label: 'Tổng quan của tôi', icon: LayoutGrid, exact: true, audience: 'manager' },
      { href: '/host/reports', label: 'Báo cáo', icon: TrendingUp, audience: 'manager' },
    ],
  },
  {
    id: 'operations',
    label: 'Vận hành kinh doanh',
    audience: 'manager',
    items: [
      { href: '/host/calendar', label: 'Lịch phòng', icon: Calendar, audience: 'manager' },
      { href: '/host/bookings', label: 'Đặt phòng', icon: BedDouble, audience: 'manager' },
      { href: '/host/leads', label: 'Yêu cầu khách', icon: Inbox, badgeKey: 'leads', audience: 'manager' },
      { href: '/host/messages', label: 'Tin nhắn', icon: MessageSquare, audience: 'manager' },
      // External preview — Sale Calendar (Next 16, port 3003 local, mock data)
      // Hiển thị cho cả ADMIN, OWNER, SALE; mở tab mới
      {
        href: SALE_CALENDAR_URL,
        label: 'Lịch CTV (Sale)',
        icon: CalendarDays,
        audience: 'manager',
        external: true,
      },
    ],
  },
  {
    id: 'property-people',
    label: 'Cơ sở & nhân sự',
    audience: 'manager',
    items: [
      { href: '/host/properties', label: 'Cơ sở của tôi', icon: Building2, audience: 'manager' },
      { href: '/host/guests', label: 'Khách hàng', icon: Users, audience: 'manager' },
      { href: '/host/hk', label: 'Dọn phòng', icon: Sparkles, audience: 'manager' },
      { href: '/host/staff', label: 'Nhân viên', icon: UserCog, audience: 'manager', hideForSale: true },
    ],
  },
  {
    id: 'account',
    label: 'Tài khoản',
    audience: 'manager',
    items: [
      { href: '/host/billing', label: 'Gói cước', icon: CreditCard, audience: 'manager', hideForSale: true },
      { href: '/host/settings', label: 'Cài đặt cá nhân', icon: Settings, audience: 'manager' },
    ],
  },
];

interface ManagerSidebarProps {
  profile: Pick<UserProfile, 'role' | 'name' | 'email'>;
  /** Real-time counts cho badge — fetched từ layout server-side */
  badges?: Partial<Record<BadgeKey, number>>;
}

export function ManagerSidebar({
  profile,
  badges = {},
}: ManagerSidebarProps) {
  const pathname = usePathname();
  const isAdmin = profile.role === RoleCode.ADMIN;
  const isSale = profile.role === RoleCode.SALE;

  const visibleGroups = GROUPS.filter((g) =>
    g.audience === 'admin' ? isAdmin : true,
  ).map((g) => ({
    ...g,
    items: g.items.filter((item) => !(isSale && item.hideForSale)),
  }));

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-ink-200 bg-cream-50">
      <div className="px-6 py-5 border-b border-ink-200">
        <Link
          href={isAdmin ? '/admin' : '/host'}
          className="flex items-center gap-2.5"
        >
          <Image
            src="/logo-mark.png"
            alt="Halong24h"
            width={36}
            height={36}
            priority
            className="h-9 w-9"
          />
          <span className="text-xl font-semibold tracking-tight text-navy-900">
            Halong24h
          </span>
        </Link>
        <p
          className="overline gold no-dash mt-3 text-[10px]"
          style={{ color: 'var(--color-gold-700)' }}
        >
          {isAdmin ? 'Quản trị · Vận hành' : isSale ? 'Quản trị · Nhân viên' : 'Quản trị · Chủ nhà'}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {visibleGroups.map((group) => (
          <NavGroupRender
            key={group.id}
            group={group}
            pathname={pathname}
            badges={badges}
          />
        ))}
      </nav>

      <div className="border-t border-ink-200 p-4">
        <p className="text-xs text-ink-700 line-clamp-1 font-medium">
          {profile.name}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-500 line-clamp-1">
          {profile.email}
        </p>
        <form action="/auth/signout" method="post" className="mt-3">
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 font-medium rounded-lg hover:bg-cream-100 hover:text-navy-900 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavGroupRender({
  group,
  pathname,
  badges,
}: {
  group: NavGroup;
  pathname: string;
  badges: Partial<Record<BadgeKey, number>>;
}) {
  if (group.items.length === 0) return null;
  return (
    <div>
      <p className="px-3 mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500">
        {group.label}
      </p>
      <div className="space-y-0.5">
        {group.items.map((item) => {
          // External link không có khái niệm "active" theo pathname nội bộ
          const active = item.external
            ? false
            : item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          const count = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;
          const className = cn(
            'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            active
              ? 'bg-cream-100 text-navy-900 font-semibold'
              : 'text-ink-700 font-medium hover:bg-cream-100 hover:text-navy-900',
          );
          const iconEl = (
            <Icon
              className={cn(
                'h-4 w-4 shrink-0',
                active
                  ? 'text-navy-900'
                  : 'text-ink-500 group-hover:text-navy-900',
              )}
              strokeWidth={active ? 2 : 1.75}
            />
          );
          const labelEl = <span className="flex-1">{item.label}</span>;
          const badgeEl =
            count > 0 ? (
              <span className="grid h-5 min-w-5 px-1 place-items-center rounded-full bg-gold-500 text-[10px] font-bold text-white">
                {count}
              </span>
            ) : null;
          if (item.external) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {iconEl}
                {labelEl}
                <span
                  aria-label="Mở tab mới"
                  title="Mở tab mới"
                  className="text-[10px] text-ink-500 group-hover:text-navy-900"
                >
                  ↗
                </span>
                {badgeEl}
              </a>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={className}
            >
              {iconEl}
              {labelEl}
              {badgeEl}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
