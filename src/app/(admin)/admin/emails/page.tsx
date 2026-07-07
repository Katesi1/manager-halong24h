import type { Metadata } from 'next';

import { AdminEmailsClient } from '@/components/admin/admin-emails-client';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Mẫu email' };

export default async function AdminEmailsPage(props: {
  searchParams: Promise<{ template?: string }>;
}) {
  const sp = await props.searchParams;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        backHref="/admin"
        backLabel="Quay lại Tổng quan"
        eyebrow="Cấu hình"
        title="Mẫu email"
        description="Các email hệ thống tự gửi từ noreply@halong24h.com. Danh sách lấy trực tiếp từ máy chủ. Bấm “Gửi test” để nhận email thật vào hộp thư và kiểm tra hiển thị."
        breadcrumbs={[
          { label: 'Tổng quan', href: '/admin' },
          { label: 'Mẫu email' },
        ]}
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/admin/emails → hiện endpoint trong Network */}
      <AdminEmailsClient template={sp.template} />
    </div>
  );
}
