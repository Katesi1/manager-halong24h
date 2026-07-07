'use client';

import { ShieldCheck } from 'lucide-react';

import {
  SystemSalesBrowser,
  type SystemSaleRow,
} from '@/components/admin/system-sales-browser';
import type { SystemSale } from '@/core/entities/system-sale';
import { useApiResource } from '@/lib/use-api-resource';

/**
 * Danh sách SALE hệ thống fetch từ `/api/admin/system-staff` PHÍA CLIENT →
 * endpoint hiện trong F12 Network. Lọc/tìm in-memory qua SystemSalesBrowser.
 */
export function SystemSalesFetchView({
  initialStatus,
  initialQ,
}: {
  initialStatus?: string;
  initialQ?: string;
}) {
  const { loading, error, data } = useApiResource<SystemSale[]>(
    '/api/admin/system-staff',
  );

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error) {
    return (
      <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
        Không tải được danh sách tài khoản: {error}
      </div>
    );
  }

  const rows: SystemSaleRow[] = (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    isActive: s.isActive,
    createdAt: s.createdAt,
    grantedModules: s.permissions.filter(
      (p) => p.canCreate || p.canRead || p.canUpdate || p.canDelete,
    ).length,
  }));

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
          <ShieldCheck className="h-7 w-7 text-ink-400" />
        </div>
        <p className="text-sm font-medium text-ink-700">
          Chưa có tài khoản Sale hệ thống nào
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs text-ink-500">
          Dùng nút &quot;Tạo tài khoản&quot; để thêm. Tài khoản mới chưa có quyền
          gì cho tới khi bạn cấp ở trang Phân quyền.
        </p>
      </div>
    );
  }

  return (
    <SystemSalesBrowser
      rows={rows}
      initialStatus={initialStatus}
      initialQ={initialQ}
    />
  );
}
