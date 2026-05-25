import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ShieldCheck } from 'lucide-react';

import { listKycAdminAction } from '@/app/actions/kyc-admin';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import {
  KYC_STATUS_LABEL,
  type KycSubmissionStatus,
} from '@/core/entities/kyc';
import type { KycAdminSubmission } from '@/core/entities/kyc-admin';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Duyệt KYC' };

const PAGE_SIZE = 10;

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

function buildHref(base: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export default async function AdminKycPage(props: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const status = isStatus(sp.status) ? sp.status : undefined;
  const result = await listKycAdminAction({ status, search: sp.q });
  const allSubmissions: KycAdminSubmission[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const totalPages = Math.ceil(allSubmissions.length / PAGE_SIZE);
  const paginated = allSubmissions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function pageHref(page: number) {
    return buildHref('/admin/kyc', {
      status: sp.status,
      q: sp.q,
      page: page > 1 ? String(page) : undefined,
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Duyệt hồ sơ KYC"
        description="Kiểm tra 7 yếu tố xác minh (GPKD/HKD, CCCD trước/sau, selfie, STK, VNeID, SĐT, Gmail) trước khi duyệt cho chủ nhà nhận booking."
      />

      {apiError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">Không tải được danh sách: </span>
          {apiError}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = (sp.status ?? '') === t.key;
            return (
              <Link
                key={t.key}
                href={buildHref('/admin/kyc', {
                  status: t.key || undefined,
                  q: sp.q,
                })}
                className={
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-all ' +
                  (active
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900')
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <form action="/admin/kyc" method="GET" className="relative max-w-xs w-full sm:w-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            name="q"
            defaultValue={sp.q}
            placeholder="Tìm tên, email, SĐT..."
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        </form>
      </div>

      {allSubmissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <ShieldCheck className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-sm font-medium text-ink-700">
            {status === 'awaiting_approval'
              ? 'Không có hồ sơ chờ duyệt.'
              : 'Không có hồ sơ phù hợp.'}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-cream-50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Chủ nhà
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Liên hệ
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Nộp lúc
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {paginated.map((s) => (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-cream-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-200 text-xs font-bold text-navy-800 uppercase">
                          {s.ownerName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900 truncate">
                            {s.ownerName}
                          </p>
                          <p className="text-[11px] font-mono text-ink-400 truncate">
                            {s.ownerId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-ink-800 truncate max-w-[200px]">
                        {s.ownerEmail}
                      </p>
                      <p className="text-xs text-ink-400">{s.ownerPhone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_VARIANT[s.status]}>
                        {KYC_STATUS_LABEL[s.status]}
                      </Badge>
                      {s.status === 'rejected' && s.rejectedReason && (
                        <p className="mt-1.5 max-w-[220px] text-[11px] text-rose-600 line-clamp-2">
                          {s.rejectedReason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-ink-500">
                      {formatDateTime(s.submittedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/kyc/${s.id}`}
                        className="inline-flex h-8 items-center rounded-lg bg-cream-100 px-3 text-xs font-semibold text-navy-800 transition-colors hover:bg-navy-900 hover:text-white"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={allSubmissions.length}
            pageSize={PAGE_SIZE}
            buildHref={pageHref}
          />
        </>
      )}
    </div>
  );
}
