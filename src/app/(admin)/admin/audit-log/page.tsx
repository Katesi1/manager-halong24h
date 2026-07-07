import { AdminAuditLogClient } from '@/components/admin/admin-audit-log-client';
import { PageHeader } from '@/components/host/page-header';

export default async function AdminAuditLogPage(props: {
  searchParams: Promise<{ target?: string; q?: string }>;
}) {
  const sp = await props.searchParams;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Thông báo hệ thống"
        description="Mọi hành động quan trọng của quản trị viên: duyệt KYC, quản lý người dùng, xử lý khiếu nại, kiểm duyệt review."
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/admin/audit-log → hiện endpoint trong Network */}
      <AdminAuditLogClient target={sp.target} q={sp.q?.trim() || undefined} />
    </div>
  );
}
