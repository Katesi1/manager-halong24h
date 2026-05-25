'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Drawer } from 'vaul';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/host', label: 'Tổng quan', icon: '📊', exact: true },
  { href: '/host/calendar', label: 'Lịch phòng', icon: '📅' },
  { href: '/host/properties', label: 'Cơ sở', icon: '🏠' },
  { href: '/host/bookings', label: 'Đặt phòng', icon: '🛏️' },
  { href: '/host/leads', label: 'Yêu cầu', icon: '📥' },
  { href: '/host/hk', label: 'Housekeeping', icon: '🧹' },
  { href: '/host/guests', label: 'Khách hàng', icon: '👥' },
  { href: '/host/staff', label: 'Nhân viên', icon: '👤' },
  { href: '/host/reports', label: 'Báo cáo', icon: '📈' },
  { href: '/host/messages', label: 'Tin nhắn', icon: '💬' },
  { href: '/host/billing', label: 'Gói cước', icon: '💳' },
  { href: '/host/settings', label: 'Cài đặt', icon: '⚙️' },
];

export function HostMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} direction="left">
      <Drawer.Trigger asChild>
        <button
          type="button"
          aria-label="Menu"
          className="grid h-10 w-10 place-items-center rounded-lg hover:bg-cream-100 lg:hidden"
        >
          <Menu className="h-5 w-5 text-ink-700" />
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl outline-none">
          <Drawer.Title className="sr-only">Menu</Drawer.Title>
          <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
            <span className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy-900 text-white font-display font-bold">
                H
              </span>
              <span className="text-xl font-semibold tracking-tight text-navy-900">
                Halong<span className="text-gold-600">24h</span>
              </span>
            </span>
            <Drawer.Close asChild>
              <button
                type="button"
                aria-label="Đóng"
                className="grid h-9 w-9 place-items-center rounded-lg hover:bg-cream-100"
              >
                <X className="h-5 w-5" />
              </button>
            </Drawer.Close>
          </div>
          <nav className="flex-1 overflow-y-auto p-3">
            {items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-navy-50 text-navy-900'
                      : 'text-ink-700 hover:bg-cream-100',
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-ink-200 p-4">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full text-left text-sm text-ink-700 hover:text-navy-900 font-medium"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
