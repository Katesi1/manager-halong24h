'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Props {
  displayName: string;
  roleLabel: string;
  initial: string;
}

export function UserMenu({ displayName, roleLabel, initial }: Props) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-full border border-ink-200 bg-white px-2 py-1 hover:shadow-pill cursor-pointer"
        aria-label="Menu tài khoản"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-navy-900 text-white text-xs font-semibold">
          {initial}
        </span>
        <span className="hidden sm:inline-block pr-2 text-sm font-medium text-ink-900">
          {displayName}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-52 sm:w-56 rounded-xl bg-white py-2 ring-1 ring-ink-200 shadow-card-hover">
          <div className="px-4 py-2 border-b border-ink-200">
            <div className="text-sm font-semibold text-ink-900 truncate">
              {displayName}
            </div>
            <div className="text-xs text-gold-700 font-semibold uppercase tracking-wide">
              {roleLabel}
            </div>
          </div>
          <Link
            href="/host/settings"
            onClick={() => setOpen(false)}
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
      )}
    </div>
  );
}
