'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin route error]', error);
  }, [error]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-xl rounded-2xl border-2 border-rose-200 bg-rose-50/40 p-8 text-center shadow-card">
        <p className="text-3xl">⚠️</p>
        <p className="mt-3 text-sm font-medium text-gold-700">Lỗi trang quản trị</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-navy-900">
          Không thể tải trang
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Đã có lỗi xảy ra khi xử lý trang admin. Bạn có thể thử lại hoặc quay
          về dashboard.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs font-mono text-ink-400">
            Mã: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-md bg-navy-900 px-5 text-sm font-medium text-white hover:bg-navy-800"
          >
            Thử lại
          </button>
          <a
            href="/admin"
            className="inline-flex h-10 items-center rounded-md border border-ink-300 bg-white px-5 text-sm font-medium text-ink-900 hover:bg-cream-100"
          >
            Về dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
