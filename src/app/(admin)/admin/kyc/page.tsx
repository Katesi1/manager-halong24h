import type { Metadata } from 'next';
import Link from 'next/link';

import { listKycAdminAction } from '@/app/actions/kyc-admin';

export const metadata: Metadata = { title: 'Duyệt KYC' };
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import {
  KYC_STATUS_LABEL,
  type KycSubmissionStatus,
} from '@/core/entities/kyc';
import type { KycAdminSubmission } from '@/core/entities/kyc-admin';
import { formatDateTime } from '@/lib/format';

const TABS: { key: '' | KycSubmissionStatus; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'awaiting_approval', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Đã từ chối' },
];

const STATUS_VARIANT: Record<
  KycSubmissionStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  draft: 'default',
  kyc_submitted: 'info',
  payment_pending: 'warning',
  paid: 'info',
  awaiting_approval: 'gold',
  approved: 'success',
  rejected: 'danger',
  refunded: 'default',
};

function isStatus(s: string | undefined): s is KycSubmissionStatus {
  return (
    s === 'draft' ||
    s === 'kyc_submitted' ||
    s === 'payment_pending' ||
    s === 'paid' ||
    s === 'awaiting_approval' ||
    s === 'approved' ||
    s === 'rejected' ||
    s === 'refunded'
  );
}

export default async function AdminKycPage(props: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await props.searchParams;
  const status = isStatus(sp.status) ? sp.status : undefined;
  const result = await listKycAdminAction({ status, search: sp.q });
  const submissions: KycAdminSubmission[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Duyệt hồ sơ KYC"
        description="Kiểm tra 7 yếu tố (GPKD/HKD, CCCD trước/sau, selfie, STK, VNeID, SĐT, Gmail) trước khi duyệt cho chủ nhà nhận booking."
      />

      {apiError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">Không tải được danh sách: </span>
          {apiError}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2 border-b border-ink-200">
        {TABS.map((t) => {
          const active = (sp.status ?? '') === t.key;
          return (
            <Link
              key={t.key}
              href={t.key ? `/admin/kyc?status=${t.key}` : '/admin/kyc'}
              className={
                'shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ' +
                (active
                  ? 'border-navy-900 text-navy-900'
                  : 'border-transparent text-ink-500 hover:text-navy-900')
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-ink-500">
          {status === 'awaiting_approval'
            ? 'Không có hồ sơ chờ duyệt.'
            : 'Không có hồ sơ phù hợp.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-cream-100 text-left">
              <tr>
                <th className="overline muted no-dash text-[10px] px-4 py-3">
                  Chủ nhà
                </th>
                <th className="overline muted no-dash text-[10px] px-4 py-3">
                  Liên hệ
                </th>
                <th className="overline muted no-dash text-[10px] px-4 py-3">
                  Trạng thái
                </th>
                <th className="overline muted no-dash text-[10px] px-4 py-3">
                  Nộp lúc
                </th>
                <th className="overline muted no-dash text-[10px] px-4 py-3 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-cream-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{s.ownerName}</p>
                    <p className="text-[11px] font-mono text-ink-500">
                      {s.ownerId}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-700">
                    <p>{s.ownerEmail}</p>
                    <p className="text-ink-500">{s.ownerPhone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[s.status]}>
                      {KYC_STATUS_LABEL[s.status]}
                    </Badge>
                    {s.status === 'rejected' && s.rejectedReason && (
                      <p className="mt-1 max-w-xs text-[11px] text-rose-600 line-clamp-2">
                        {s.rejectedReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500 whitespace-nowrap">
                    {formatDateTime(s.submittedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/kyc/${s.id}`}
                      className="text-xs font-semibold text-navy-700 hover:underline"
                    >
                      Xem chi tiết →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
