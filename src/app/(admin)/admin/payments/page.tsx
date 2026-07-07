import type { Metadata } from 'next';

import { AdminPaymentsClient } from '@/components/admin/admin-payments-client';
import { PaymentsExport } from '@/components/admin/payments-export';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Gói cước chủ nhà' };

export default async function AdminPaymentsPage(props: {
  searchParams: Promise<{
    view?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const sp = await props.searchParams;
  const view =
    sp.view === 'approve' || sp.view === 'subs' ? sp.view : undefined;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Tài chính"
        title="Gói cước chủ nhà"
        description="Chủ nhà chuyển khoản mua gói → admin duyệt (xác nhận đã nhận tiền) → gói được kích hoạt. Đây là nguồn doanh thu duy nhất; khách thuê chuyển khoản trực tiếp cho chủ nhà, không qua hệ thống."
        actions={<PaymentsExport />}
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/admin/payments → hiện endpoint trong Network */}
      <AdminPaymentsClient
        view={view}
        status={sp.status}
        q={sp.q?.trim() || undefined}
        page={page}
      />
    </div>
  );
}
