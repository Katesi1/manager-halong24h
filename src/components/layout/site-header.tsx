import Link from 'next/link';
import { SearchPill } from './search-pill';
import { GlobeIcon, MenuIcon } from '@/components/ui/icons';

export async function SiteHeader() {
  let user: { id: string; email: string | null } | null = null;
  let role: string | null = null;
  let fullName: string | null = null;

  if (false) {
    try {
} catch {
      // ignore
    }
  } else {
    // Demo mode: pre-login với fake "owner" account để xem flow chủ phòng ngay
    user = { id: 'demo-owner', email: 'owner@demo.local' };
    role = 'owner';
    fullName = 'Anh Tuấn (Demo Owner)';
  }

  const initial = (fullName || user?.email || '?').slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy-900 text-white font-display font-bold text-lg">
            H
          </span>
          <span className="hidden sm:inline-block font-display text-xl font-bold tracking-tight text-navy-900">
            Halong<span className="text-gold-600">24h</span>
          </span>
        </Link>

        {/* Search pill (center) */}
        <SearchPill />

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <Link
            href={role === 'owner' || role === 'super_admin' ? '/host' : '/host/onboarding'}
            className="hidden md:inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-ink-900 hover:bg-cream-100"
          >
            Trở thành host
          </Link>
          <button
            type="button"
            className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-cream-100"
            aria-label="Ngôn ngữ"
          >
            <GlobeIcon className="h-4 w-4 text-ink-700" />
          </button>

          {/* User menu trigger (simplified — full menu sẽ làm sau với dropdown) */}
          <details className="relative">
            <summary className="list-none flex h-12 items-center gap-2 rounded-full border border-ink-200 px-2 py-1 hover:shadow-pill cursor-pointer">
              <MenuIcon className="h-4 w-4 ml-1 text-ink-700" />
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-700 text-white text-xs font-semibold">
                {user ? initial : '?'}
              </span>
            </summary>
            <div className="absolute right-0 top-14 w-60 rounded-xl bg-white py-2 ring-1 ring-ink-200 shadow-card-hover">
              {user ? (
                <>
                  <div className="px-4 py-2 border-b border-ink-200">
                    <div className="text-sm font-semibold text-ink-900 truncate">
                      {fullName || user.email}
                    </div>
                    {fullName && (
                      <div className="text-xs text-ink-500 truncate">{user.email}</div>
                    )}
                    {role && (
                      <div className="mt-1 text-xs text-gold-700 font-semibold uppercase tracking-wide">
                        {role}
                      </div>
                    )}
                  </div>
                  <MenuLink href="/my/bookings">Booking của tôi</MenuLink>
                  <MenuLink href="/my/favorites">Yêu thích</MenuLink>
                  <MenuLink href="/my/messages">Tin nhắn</MenuLink>
                  {(role === 'owner' || role === 'super_admin') && (
                    <MenuLink href="/host">Trang chủ nhà</MenuLink>
                  )}
                  {role === 'super_admin' && (
                    <MenuLink href="/admin">Admin Panel</MenuLink>
                  )}
                  <div className="my-1 border-t border-ink-200" />
                  <MenuLink href="/account">Tài khoản</MenuLink>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="w-full text-left px-4 py-2.5 text-sm text-ink-700 hover:bg-cream-100"
                    >
                      Đăng xuất
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <MenuLink href="/signup" bold>
                    Đăng ký
                  </MenuLink>
                  <MenuLink href="/login">Đăng nhập</MenuLink>
                  <div className="my-1 border-t border-ink-200" />
                  <MenuLink href="/host/onboarding">Trở thành chủ nhà</MenuLink>
                  <MenuLink href="/help">Trợ giúp</MenuLink>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  children,
  bold,
}: {
  href: string;
  children: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block px-4 py-2.5 text-sm hover:bg-cream-100 ${bold ? 'font-semibold text-ink-900' : 'text-ink-700'}`}
    >
      {children}
    </Link>
  );
}
