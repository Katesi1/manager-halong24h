import type { Metadata } from 'next';

import { AdminBankAccountsClient } from '@/components/admin/admin-bank-accounts-client';
import { PageHeader } from '@/components/host/page-header';
import type { BankQueueFilter } from '@/core/entities/bank-account';

export const metadata: Metadata = { title: 'Duyệt tài khoản nhận tiền' };

function parseFilter(raw: string | undefined): BankQueueFilter {
  if (raw === 'approved' || raw === 'rejected' || raw === 'all') return raw;
  return 'pending';
}

export default async function AdminBankAccountsPage(props: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const filter = parseFilter(sp.status);
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Tài chính & hỗ trợ"
        title="Duyệt tài khoản nhận tiền"
        description="Chủ nhà gửi số tài khoản ngân hàng để nhận tiền cọc từ khách. Duyệt để STK được dùng sinh mã VietQR; từ chối kèm lý do nếu thông tin không hợp lệ."
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/admin/bank-accounts → hiện endpoint trong Network */}
      <AdminBankAccountsClient filter={filter} page={page} />
    </div>
  );
}
