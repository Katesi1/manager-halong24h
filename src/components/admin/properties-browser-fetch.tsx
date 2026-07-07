'use client';

import type { AdminPropertyRow } from '@/components/admin/admin-property-card';
import {
  PropertiesBrowser,
  type PropertiesBrowserInitial,
} from '@/components/admin/properties-browser';
import { useApiResource } from '@/lib/use-api-resource';

/**
 * Duyệt cơ sở fetch từ `/api/admin/properties` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Filter/sort/phân trang in-memory qua PropertiesBrowser.
 */
export function PropertiesBrowserFetch({
  initial,
}: {
  initial: PropertiesBrowserInitial;
}) {
  const { loading, error, data } = useApiResource<AdminPropertyRow[]>(
    '/api/admin/properties',
  );

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }

  return (
    <PropertiesBrowser
      rows={data ?? []}
      apiError={error}
      initial={initial}
    />
  );
}
