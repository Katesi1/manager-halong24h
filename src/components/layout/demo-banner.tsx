import 'server-only';

/**
 * Server-side check: bật demo banner khi env BE chưa cấu hình HOẶC bypass dev đang on.
 *
 * Logic: nếu `NEXT_PUBLIC_API_BASE_URL` empty hoặc match placeholder dev mặc định
 * (`103.183.118.148:3000`) thì coi như chưa cấu hình BE thật.
 *
 * `DEV_BYPASS_AUTH=1` cũng coi là demo mode (auth bypass).
 */
function isDemoMode(): boolean {
  if (process.env.NODE_ENV === 'production') {
    // Production: chỉ coi là demo nếu thực sự không có API base URL.
    return !process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (process.env.DEV_BYPASS_AUTH === '1') return true;
  const url = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  return !url || url.includes('103.183.118.148');
}

export function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-900">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-2 text-center text-xs">
        <span aria-hidden>⚠️</span>{' '}
        <span className="font-semibold">Chế độ demo</span> — đang dùng mock data. Để nối BE thật,
        đặt <code className="rounded bg-amber-100 px-1.5 py-0.5">NEXT_PUBLIC_API_BASE_URL</code>{' '}
        trong <code className="rounded bg-amber-100 px-1.5 py-0.5">.env.local</code>.
      </div>
    </div>
  );
}

/**
 * Notice cho trang /login + /signup + /forgot-password: mock auth chấp nhận mọi thông tin,
 * và email pattern quyết định role được giả lập:
 *   - "admin"        → admin
 *   - "owner"/"host" → owner
 *   - "sale"/"staff" → sale
 *   - còn lại         → customer (ForbiddenScreen)
 */
export function DemoAuthNotice() {
  if (!isDemoMode()) return null;
  return (
    <div
      role="status"
      className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-[12.5px] leading-[1.55] text-amber-900"
    >
      <span aria-hidden>⚠️</span>{' '}
      <span className="font-semibold">Chế độ demo</span> — không cần tài khoản thật. Email chứa{' '}
      <code className="rounded bg-amber-100 px-1 py-0.5">admin</code>,{' '}
      <code className="rounded bg-amber-100 px-1 py-0.5">owner</code> hoặc{' '}
      <code className="rounded bg-amber-100 px-1 py-0.5">sale</code> sẽ giả lập role tương ứng.
    </div>
  );
}
