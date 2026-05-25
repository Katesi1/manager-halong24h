import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-ink-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/login" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-white font-display text-sm font-bold">
              H
            </span>
            <span className="text-lg font-semibold tracking-tight text-navy-900">
              Halong<span className="text-gold-600">24h</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-ink-500 hover:text-ink-700 transition-colors"
          >
            ← Đăng nhập
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
      <footer className="border-t border-ink-100 py-6 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} Halong24h. Mọi quyền được bảo lưu.
      </footer>
    </div>
  );
}
