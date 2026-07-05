import type { Metadata } from 'next';

import { getCurrentProfile } from '@/app/actions/auth';
import { getMyBankAction } from '@/app/actions/bank-accounts';
import { BankAccountForm } from '@/components/host/bank-account-form';
import { PageHeader } from '@/components/host/page-header';
import type { BankAccountState } from '@/core/entities/bank-account';
import { RoleCode } from '@/core/value-objects/role';

export const metadata: Metadata = { title: 'Tài khoản nhận tiền' };

export default async function HostBankAccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const isOwner = profile.role === RoleCode.OWNER;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Nhận tiền"
        title="Tài khoản nhận tiền"
        description="Số tài khoản ngân hàng dùng để nhận tiền cọc từ khách (sinh mã VietQR). Thông tin phải được quản trị viên duyệt trước khi có hiệu lực."
        backHref="/host/settings"
      />

      {!isOwner ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-ink-700">
            Chỉ chủ nhà (OWNER) mới cấu hình được tài khoản nhận tiền.
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Tài khoản của bạn không có quyền này.
          </p>
        </div>
      ) : (
        <BankSection />
      )}
    </div>
  );
}

async function BankSection() {
  const result = await getMyBankAction();

  if (!result.ok) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <span className="font-semibold">Không tải được thông tin: </span>
        {result.error}
      </div>
    );
  }

  const state: BankAccountState = result.data;

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
      <BankAccountForm state={state} />
    </section>
  );
}
