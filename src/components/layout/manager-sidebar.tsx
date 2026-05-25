'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  AlertTriangle,
  BedDouble,
  Building,
  Building2,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  hideForSale?: boolean;
  external?: boolean;
}

const SALE_CALENDAR_URL = process.env.NEXT_PUBLIC_SALE_CALENDAR_URL!;

interface NavGroup {
  id: string;
  label: string;
  audience: Audience;
  collapsible?: boolean;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    id: 'platform-ops',
    label: 'Vận hành hệ thống',
    audience: 'admin',
    collapsible: true,
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
    collapsible: true,
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
    collapsible: true,
    items: [
      { href: '/admin/permissions', label: 'Phân quyền', icon: KeyRound, audience: 'admin' },
      { href: '/admin/app-version', label: 'Phiên bản app', icon: Smartphone, audience: 'admin' },
      { href: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings, audience: 'admin' },
    ],
  },
  {
    id: 'overview',
    label: 'Tổng quan',
    audience: 'manager',
    collapsible: true,
    items: [
      { href: '/host', label: 'Tổng quan của tôi', icon: LayoutGrid, exact: true, audience: 'manager' },
      { href: '/host/reports', label: 'Báo cáo', icon: TrendingUp, audience: 'manager' },
    ],
  },
  {
    id: 'operations',
    label: 'Vận hành kinh doanh',
    audience: 'manager',
    collapsible: true,
    items: [
      { href: '/host/calendar', label: 'Lịch phòng', icon: Calendar, audience: 'manager' },
      { href: '/host/bookings', label: 'Đặt phòng', icon: BedDouble, audience: 'manager' },
      { href: '/host/leads', label: 'Yêu cầu khách', icon: Inbox, badgeKey: 'leads', audience: 'manager' },
      { href: '/host/messages', label: 'Tin nhắn', icon: MessageSquare, audience: 'manager' },
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
    collapsible: true,
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
    collapsible: true,
    items: [
      { href: '/host/billing', label: 'Gói cước', icon: CreditCard, audience: 'manager', hideForSale: true },
      { href: '/host/settings', label: 'Cài đặt cá nhân', icon: Settings, audience: 'manager' },
    ],
  },
];

interface ManagerSidebarProps {
  profile: Pick<UserProfile, 'role' | 'name' | 'email'>;
  badges?: Partial<Record<BadgeKey, number>>;
}

export function ManagerSidebar({
  profile,
  badges = {},
}: ManagerSidebarProps) {
  const pathname = usePathname();
  const isAdmin = profile.role === RoleCode.ADMIN;
  const isSale = profile.role === RoleCode.SALE;
  const [collapsed, setCollapsed] = useState(false);

  const visibleGroups = GROUPS.filter((g) =>
    g.audience === 'admin' ? isAdmin : true,
  ).map((g) => ({
    ...g,
    items: g.items.filter((item) => !(isSale && item.hideForSale)),
  }));

  if (collapsed) {
    return (
      <aside className="hidden lg:flex w-16 shrink-0 flex-col border-r border-ink-200 bg-cream-50 sticky top-0 h-screen relative">
        <div className="flex justify-center py-5 border-b border-ink-200">
          <Link href={isAdmin ? '/admin' : '/host'}>
            <Image
              src="/logo-mark.png"
              alt="Halong24h"
              width={32}
              height={32}
              priority
              className="h-8 w-8"
            />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="absolute top-[68px] -right-3 z-10 grid h-6 w-6 place-items-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-sm hover:bg-navy-50 hover:text-navy-900 hover:shadow-md transition-all"
          title="Mở rộng sidebar"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        <nav className="flex-1 overflow-y-auto py-3 space-y-1 scrollbar-thin">
          {visibleGroups.flatMap((group) =>
            group.items.map((item) => {
              const active = item.external
                ? false
                : item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              const count = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;
              return (
                <div className="relative flex justify-center" key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.label}
                      className="grid h-10 w-10 place-items-center rounded-lg text-ink-500 hover:bg-cream-100 hover:text-navy-900 transition-colors"
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      title={item.label}
                      className={cn(
                        'grid h-10 w-10 place-items-center rounded-lg transition-colors',
                        active
                          ? 'bg-cream-100 text-navy-900'
                          : 'text-ink-500 hover:bg-cream-100 hover:text-navy-900',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.75} />
                    </Link>
                  )}
                  {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold-500 text-[9px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </div>
              );
            }),
          )}
        </nav>

        <div className="border-t border-ink-200 py-3 flex justify-center">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-cream-100 hover:text-navy-900 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-ink-200 bg-cream-50 sticky top-0 h-screen">
      <div className="flex items-center justify-between px-5 py-5 border-b border-ink-200">
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
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-cream-100 hover:text-navy-900 transition-colors"
          title="Thu gọn sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
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

  const hasActiveItem = group.items.some((item) =>
    item.external
      ? false
      : item.exact
        ? pathname === item.href
        : pathname.startsWith(item.href),
  );

  const [open, setOpen] = useState(!group.collapsible || hasActiveItem);

  if (group.collapsible) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500 hover:bg-cream-100 hover:text-ink-700 transition-colors"
        >
          <span>{group.label}</span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200',
              open ? 'rotate-0' : '-rotate-90',
            )}
          />
        </button>
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            open ? 'max-h-[500px] opacity-100 mt-0.5' : 'max-h-0 opacity-0',
          )}
        >
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavItemRender
                key={item.href}
                item={item}
                pathname={pathname}
                badges={badges}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500">
        {group.label}
      </p>
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavItemRender
            key={item.href}
            item={item}
            pathname={pathname}
            badges={badges}
          />
        ))}
      </div>
    </div>
  );
}

function NavItemRender({
  item,
  pathname,
  badges,
}: {
  item: NavItem;
  pathname: string;
  badges: Partial<Record<BadgeKey, number>>;
}) {
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
  const badgeEl =
    count > 0 ? (
      <span className="grid h-5 min-w-5 px-1 place-items-center rounded-full bg-gold-500 text-[10px] font-bold text-white">
        {count}
      </span>
    ) : null;

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {iconEl}
        <span className="flex-1">{item.label}</span>
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
    <Link href={item.href} className={className}>
      {iconEl}
      <span className="flex-1">{item.label}</span>
      {badgeEl}
    </Link>
  );
}
