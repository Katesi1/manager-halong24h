'use client';

import Link from 'next/link';
import { Search, ShieldCheck } from 'lucide-react';

import { KycRowActions } from '@/components/admin/kyc-row-actions';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import {
  KYC_STATUS_LABEL,
  type KycSubmissionStatus,
} from '@/core/entities/kyc';
import type {
  KycAdminListResult,
  KycQueueFilter,
} from '@/core/entities/kyc-admin';
import { formatDateTime } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

const PAGE_SIZE = 10;

const TABS: { key: KycQueueFilter; label: string }[] = [
  { key: 0, label: 'Tất cả' },
  { key: 1, label: 'Chờ duyệt' },
  { key: 2, label: 'Đã duyệt' },
  { key: 3, label: 'Đã từ chối' },
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

function buildHref(base: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

interface Props {
  filter: KycQueueFilter;
  q?: string;
  page: number;
}

/**
 * Hàng đợi KYC fetch từ `/api/admin/kyc` PHÍA CLIENT → endpoint hiện trong F12
 * Network. Phân trang + filter + search server-side (đổi URL → refetch).
 */
export function AdminKycClient({ filter, q, page }: Props) {
  const params = new URLSearchParams();
  if (filter !== 0) params.set('filter', String(filter));
  if (q) params.set('q', q);
  if (page > 1) params.set('page', String(page));
  const { loading, error, data } = useApiResource<KycAdminListResult>(
    `/api/admin/kyc?${params.toString()}`,
  );

  const queue = data;
  const items = queue?.items ?? [];
  const total = queue?.total ?? 0;
  const pendingCount = queue?.pendingCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">Không tải được danh sách: </span>
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = filter === t.key;
            return (
              <Link
                key={t.key}
                href={buildHref('/admin/kyc', {
                  filter: t.key === 0 ? undefined : String(t.key),
                  q,
                })}
                className={
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-all ' +
                  (active
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900')
                }
              >
                {t.label}
                {t.key === 1 && pendingCount > 0 && (
                  <span
                    className={
                      'ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ' +
                      (active
                        ? 'bg-white text-navy-900'
                        : 'bg-rose-100 text-rose-700')
                    }
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <form
          action="/admin/kyc"
          method="GET"
          className="relative max-w-xs w-full sm:w-auto"
        >
          {filter !== 0 && (
            <input type="hidden" name="filter" value={String(filter)} />
          )}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tìm tên, email, SĐT..."
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        </form>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>
      ) : total === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <ShieldCheck className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-sm font-medium text-ink-700">
            {filter === 1
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
                {items.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-cream-50">
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
                      <KycRowActions
                        submissionId={s.id}
                        status={s.status}
                        ownerName={s.ownerName}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            buildHref={(p) =>
              buildHref('/admin/kyc', {
                filter: filter === 0 ? undefined : String(filter),
                q,
                page: p > 1 ? String(p) : undefined,
              })
            }
          />
        </>
      )}
    </>
  );
}
