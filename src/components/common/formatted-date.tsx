'use client';
import { useEffect, useState } from 'react';

import { formatDate } from '@/lib/format';

type Props = {
  iso: string | Date | null | undefined;
  fallback?: string;
  className?: string;
};

/**
 * Render date client-side để tránh hydration mismatch.
 *
 * Lý do: `Intl.DateTimeFormat('vi-VN')` có thể cho output khác nhau giữa
 * Node ICU và browser ICU (ví dụ space ký tự, separator). Khi server render
 * khác client → React cảnh báo hydration mismatch.
 *
 * Cách giải: server gửi `fallback` (mặc định "—"), client render lại sau
 * mount với `formatDate(iso)`. `suppressHydrationWarning` được đặt vì
 * sự khác biệt initial value (fallback) vs final value (locale-formatted)
 * là cố tình.
 */
export function FormattedDate({ iso, fallback = '—', className }: Props) {
  const [text, setText] = useState<string>(fallback);
  useEffect(() => {
    if (!iso) return;
    try {
      setText(formatDate(iso));
    } catch {
      setText(fallback);
    }
  }, [iso, fallback]);
  return (
    <span suppressHydrationWarning className={className}>
      {text}
    </span>
  );
}
