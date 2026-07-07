'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { ClientPagination } from '@/components/ui/client-pagination';
import { FilterChips } from '@/components/ui/filter-chips';
import {
  DISPUTE_STATUS_LABEL,
  DISPUTE_TYPE_ICON,
  DISPUTE_TYPE_LABEL,
  type Dispute,
  type DisputeStatus,
} from '@/core/entities/dispute';
import { formatDate, formatVND, relativeTime } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

const PAGE_SIZE = 10;

const STATUS_VARIANT: Record<
  DisputeStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  open: 'warning',
  investigating: 'info',
  resolved: 'success',
  rejected: 'default',
};

/**
 * Khiếu nại fetch từ `/api/admin/disputes` PHÍA CLIENT → endpoint hiện trong
 * F12 Network. Count + filter theo `status` (URL) + phân trang in-memory.
 */
export function AdminDisputesClient({ status }: { status?: DisputeStatus }) {
  const { loading, error, data } = useApiResource<Dispute[]>(
    '/api/admin/disputes',
  );
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status]);

  const all = data ?? [];
  const counts = {
    all: all.length,
    open: all.filter((d) => d.status === 'open').length,
    investigating: all.filter((d) => d.status === 'investigating').length,
    resolved: all.filter((d) => d.status === 'resolved').length,
    rejected: all.filter((d) => d.status === 'rejected').length,
  };
  const totalInDispute = all
    .filter((d) => d.status === 'open' || d.status === 'investigating')
    .reduce((s, d) => s + (d.amount ?? 0), 0);

  const disputes = status ? all.filter((d) => d.status === status) : all;
  const totalPages = Math.ceil(disputes.length / PAGE_SIZE);
  const pageItems = disputes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        eyebrow="Tài chính & hỗ trợ"
        title="Khiếu nại"
        description={`${counts.open + counts.investigating} đang xử lý · ${formatVND(totalInDispute)} đang tranh chấp · Đọc chat + bill trong hệ thống để ra phán quyết trung gian.`}
      />

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          {error}
        </div>
      )}

      <div className="mb-5">
        <FilterChips
          active={status ?? 'all'}
          items={[
            { key: 'all', label: 'Tất cả', href: '/admin/disputes', count: counts.all },
            { key: 'open', label: 'Mới mở', href: '/admin/disputes?status=open', count: counts.open },
            { key: 'investigating', label: 'Đang xử lý', href: '/admin/disputes?status=investigating', count: counts.investigating },
            { key: 'resolved', label: 'Đã giải quyết', href: '/admin/disputes?status=resolved', count: counts.resolved },
            { key: 'rejected', label: 'Đã bác bỏ', href: '/admin/disputes?status=rejected', count: counts.rejected },
          ]}
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>
      ) : disputes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <p className="text-2xl">⚖️</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-navy-900">
            Không có khiếu nại
          </h2>
          <p className="mt-1 text-sm text-ink-500">Hệ thống đang vận hành ổn.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pageItems.map((d) => {
            const urgent =
              d.priority === 'high' &&
              (d.status === 'open' || d.status === 'investigating');
            return (
              <Link
                key={d.id}
                href={`/admin/disputes/${d.id}`}
                className={
                  'block rounded-2xl bg-white p-5 ring-1 transition-all shadow-card hover:ring-navy-300 ' +
                  (urgent ? 'ring-2 ring-rose-300 bg-rose-50/30' : 'ring-ink-200/60')
                }
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">
                    {DISPUTE_TYPE_ICON[d.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-ink-900">
                          {DISPUTE_TYPE_LABEL[d.type]}
                        </h3>
                        <Badge variant={STATUS_VARIANT[d.status]}>
                          {DISPUTE_STATUS_LABEL[d.status]}
                        </Badge>
                        {urgent && <Badge variant="danger">⚡ Ưu tiên cao</Badge>}
                      </div>
                      <span className="text-xs text-ink-500 shrink-0">
                        {relativeTime(d.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-ink-900">
                      {d.subject}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      <span className="font-medium text-ink-700">
                        {d.opener.name}
                      </span>{' '}
                      ({d.opener.role === 'customer'
                        ? 'khách'
                        : d.opener.role === 'owner'
                          ? 'chủ nhà'
                          : 'admin'}
                      ) báo cáo · Đặt phòng{' '}
                      <span className="font-mono">{d.bookingCode}</span> ·{' '}
                      {d.propertyName}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                      {d.amount && (
                        <span className="font-semibold text-amber-700">
                          💰 {formatVND(d.amount)}
                        </span>
                      )}
                      {d.evidence.length > 0 && (
                        <span className="text-ink-500">
                          📎 {d.evidence.length} bằng chứng
                        </span>
                      )}
                      {d.chatExcerpts.length > 0 && (
                        <span className="text-ink-500">
                          💬 {d.chatExcerpts.length} đoạn chat trích
                        </span>
                      )}
                      <span className="ml-auto text-navy-700 font-semibold">
                        Xem chi tiết →
                      </span>
                    </div>

                    {d.resolution && (
                      <div className="mt-3 rounded-lg bg-cream-100 p-3 text-xs">
                        <p className="overline muted no-dash text-[10px]">
                          {d.status === 'resolved'
                            ? '✓ Giải pháp'
                            : 'Lý do bác bỏ'}
                          {d.resolvedAt && ` · ${formatDate(d.resolvedAt)}`}
                        </p>
                        <p className="mt-1 text-ink-900 line-clamp-2">
                          {d.resolution}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {disputes.length > 0 && (
        <ClientPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={disputes.length}
          pageSize={PAGE_SIZE}
        />
      )}
    </>
  );
}
