import type { Metadata } from 'next';
import Link from 'next/link';

import { listDisputesAction } from '@/app/actions/disputes';

export const metadata: Metadata = { title: 'Khiếu nại' };
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { FilterChips } from '@/components/ui/filter-chips';
import { Pagination } from '@/components/ui/pagination';
import {
  DISPUTE_STATUS_LABEL,
  DISPUTE_TYPE_ICON,
  DISPUTE_TYPE_LABEL,
  type Dispute,
  type DisputeStatus,
} from '@/core/entities/dispute';
import { formatDate, formatVND, relativeTime } from '@/lib/format';
import { buildPageHref, pageCount, paginate, parsePage } from '@/lib/pagination';

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

function isStatus(s?: string): s is DisputeStatus {
  return s === 'open' || s === 'investigating' || s === 'resolved' || s === 'rejected';
}

export default async function AdminDisputesPage(props: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const status = isStatus(sp.status) ? sp.status : undefined;

  const result = await listDisputesAction(status ? { status } : undefined);
  const disputes: Dispute[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  // Counts cho filter chips (cần listAll)
  const allResult = await listDisputesAction();
  const all: Dispute[] = allResult.ok ? allResult.data : [];

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

  const currentPage = parsePage(sp.page);
  const totalPages = pageCount(disputes.length, PAGE_SIZE);
  const pageItems = paginate(disputes, currentPage, PAGE_SIZE);

  function pageHref(page: number) {
    return buildPageHref('/admin/disputes', {
      status,
      page: page > 1 ? String(page) : undefined,
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Tài chính & hỗ trợ"
        title="Khiếu nại"
        description={`${counts.open + counts.investigating} đang xử lý · ${formatVND(totalInDispute)} đang tranh chấp · Đọc chat + bill trong hệ thống để ra phán quyết trung gian.`}
      />

      {apiError && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          {apiError}
        </div>
      )}

      <div className="mb-5">
        <FilterChips
          active={sp.status ?? 'all'}
          items={[
            { key: 'all', label: 'Tất cả', href: '/admin/disputes', count: counts.all },
            { key: 'open', label: 'Mới mở', href: '/admin/disputes?status=open', count: counts.open },
            {
              key: 'investigating',
              label: 'Đang xử lý',
              href: '/admin/disputes?status=investigating',
              count: counts.investigating,
            },
            {
              key: 'resolved',
              label: 'Đã giải quyết',
              href: '/admin/disputes?status=resolved',
              count: counts.resolved,
            },
            {
              key: 'rejected',
              label: 'Đã bác bỏ',
              href: '/admin/disputes?status=rejected',
              count: counts.rejected,
            },
          ]}
        />
      </div>

      {apiError ? null : disputes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <p className="text-2xl">⚖️</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-navy-900">
            Không có khiếu nại
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Hệ thống đang vận hành ổn.
          </p>
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
                        {urgent && (
                          <Badge variant="danger">⚡ Ưu tiên cao</Badge>
                        )}
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

      {!apiError && disputes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={disputes.length}
          pageSize={PAGE_SIZE}
          buildHref={pageHref}
        />
      )}
    </div>
  );
}
