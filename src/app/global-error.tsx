'use client';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Manager GlobalError]', error);
  }, [error]);
  return (
    <html lang="vi">
      <body>
        <main className="grid min-h-screen place-items-center bg-cream-100 p-6 text-center">
          <div className="max-w-md">
            <p className="text-sm font-medium text-gold-700">Lỗi hệ thống</p>
            <h1 className="mt-2 text-3xl font-bold text-navy-900">
              Có lỗi xảy ra
            </h1>
            <p className="mt-2 text-ink-500">
              Lỗi nội bộ. Vui lòng thử lại hoặc liên hệ admin.
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-ink-400">Mã: {error.digest}</p>
            )}
            <button
              onClick={reset}
              className="mt-6 inline-flex h-10 items-center rounded-md bg-navy-900 px-5 text-white font-medium hover:bg-navy-800"
            >
              Thử lại
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
