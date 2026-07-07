'use client';

import { BankAccountForm } from '@/components/host/bank-account-form';
import { PageHeader } from '@/components/host/page-header';
import type { BankAccountState } from '@/core/entities/bank-account';
import { useApiResource } from '@/lib/use-api-resource';

interface BankData {
  isOwner: boolean;
  state: BankAccountState | null;
  error: string | null;
}

/**
 * Tài khoản nhận tiền fetch từ `/api/host/bank` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Form gửi qua Server Action như cũ.
 */
export function BankSettingsClient() {
  const { loading, error, data } = useApiResource<BankData>('/api/host/bank');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Nhận tiền"
        title="Tài khoản nhận tiền"
        description="Số tài khoản ngân hàng dùng để nhận tiền cọc từ khách (sinh mã VietQR). Thông tin phải được quản trị viên duyệt trước khi có hiệu lực."
        backHref="/host/settings"
      />

      {loading && (
        <div className="py-8 text-center text-sm text-ink-500">Đang tải…</div>
      )}

      {!loading && (error || !data) && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          {error ?? 'Không tải được thông tin'}
        </div>
      )}

      {!loading && data && !data.isOwner && (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-ink-700">
            Chỉ chủ nhà (OWNER) mới cấu hình được tài khoản nhận tiền.
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Tài khoản của bạn không có quyền này.
          </p>
        </div>
      )}

      {!loading && data && data.isOwner && !data.state && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">Không tải được thông tin: </span>
          {data.error ?? 'Vui lòng thử lại.'}
        </div>
      )}

      {!loading && data && data.isOwner && data.state && (
        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <BankAccountForm state={data.state} />
        </section>
      )}
    </div>
  );
}
