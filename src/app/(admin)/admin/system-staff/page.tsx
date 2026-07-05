import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';

import { listSystemSalesAction } from '@/app/actions/system-staff';
import { SystemSaleCreateDialog } from '@/components/admin/system-sale-dialogs';
import {
  SystemSalesBrowser,
  type SystemSaleRow,
} from '@/components/admin/system-sales-browser';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Tài khoản Sale hệ thống' };

export default async function AdminSystemStaffPage(props: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const [{ status, q }, salesRes] = await Promise.all([
    props.searchParams,
    listSystemSalesAction(),
  ]);

  const rows: SystemSaleRow[] = salesRes.ok
    ? salesRes.data.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        isActive: s.isActive,
        createdAt: s.createdAt,
      }))
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Quản lý nền tảng"
        title="Tài khoản Sale hệ thống"
        description="Nhân viên Sale trực thuộc Halong24h — thấy dữ liệu toàn hệ thống, quyền cấp theo từng module (chỉ ADMIN quản lý)."
        actions={<SystemSaleCreateDialog />}
      />

      {!salesRes.ok && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          Không tải được danh sách tài khoản: {salesRes.error}
        </div>
      )}

      {salesRes.ok && rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <ShieldCheck className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-sm font-medium text-ink-700">
            Chưa có tài khoản Sale hệ thống nào
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-ink-500">
            Dùng nút &quot;Tạo tài khoản&quot; để thêm. Tài khoản mới chưa có
            quyền gì cho tới khi bạn cấp ở trang Phân quyền.
          </p>
        </div>
      ) : (
        rows.length > 0 && (
          <SystemSalesBrowser rows={rows} initialStatus={status} initialQ={q} />
        )
      )}
    </div>
  );
}
