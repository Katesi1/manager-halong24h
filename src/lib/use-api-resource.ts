'use client';

import { useEffect, useRef, useState } from 'react';

interface ResourceState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

const RESOURCE_REFETCH_EVENT = 'app:data-changed';

/**
 * Gọi sau khi một Server Action mutation thành công để mọi `useApiResource`
 * đang mount **tự fetch lại** (list/detail cập nhật ngay, không cần F5). Vì
 * trang đã chuyển client-fetch, `router.refresh()` KHÔNG refetch hook này —
 * dùng hàm này thay/kèm theo. Badge server-rendered ở layout vẫn cần
 * `router.refresh()`.
 */
export function refetchApiResources(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(RESOURCE_REFETCH_EVENT));
  }
}

/**
 * Hook fetch dữ liệu từ BFF route (`/api/…`) PHÍA CLIENT → endpoint hiện trong
 * F12 Network. Trả `data` (trường `data` trong response), refetch khi `url` đổi
 * (đổi filter/trang → truyền url mới) HOẶC khi `refetchApiResources()` được gọi
 * (refetch nền, giữ dữ liệu cũ — không nháy spinner). Token BE vẫn ở server.
 */
export function useApiResource<T>(url: string): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({
    loading: true,
    error: null,
    data: null,
  });
  const [tick, setTick] = useState(0);
  // URL đã tải xong ít nhất 1 lần → phân biệt lần đầu (spinner) vs refetch (nền).
  const loadedUrlRef = useRef<string | null>(null);

  // Refetch nền khi có mutation ở nơi khác.
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener(RESOURCE_REFETCH_EVENT, handler);
    return () => window.removeEventListener(RESOURCE_REFETCH_EVENT, handler);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Lần đầu với url này → hiện spinner. Refetch (tick/url cũ) → giữ data cũ.
    if (loadedUrlRef.current !== url) {
      setState({ loading: true, error: null, data: null });
    }

    fetch(url, { credentials: 'same-origin' })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Không tải được dữ liệu');
        return json.data as T;
      })
      .then((data) => {
        if (cancelled) return;
        loadedUrlRef.current = url;
        setState({ loading: false, error: null, data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: err instanceof Error ? err.message : 'Không tải được dữ liệu',
          data: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [url, tick]);

  return state;
}
