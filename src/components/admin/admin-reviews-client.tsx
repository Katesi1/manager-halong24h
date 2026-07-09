'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Flag, MessageSquareText, Search, Star } from 'lucide-react';

import { ReviewModerationActions } from '@/components/admin/review-moderation-actions';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { ClientPagination } from '@/components/ui/client-pagination';
import {
  REVIEW_CRITERIA,
  REVIEW_FLAG_LABEL,
  REVIEW_STATUS_LABEL,
  type Review,
  type ReviewStatus,
} from '@/core/entities/review';
import { relativeTime } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

const PAGE_SIZE = 10;

const STATUS_VARIANT: Record<
  ReviewStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  published: 'success',
  hidden: 'warning',
  deleted: 'default',
};

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'published', label: 'Đang hiển thị' },
  { key: 'hidden', label: 'Đã ẩn' },
  { key: 'flagged', label: 'Bị flag' },
];

function buildHref(base: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

interface Props {
  status?: string;
  flagged?: boolean;
  q?: string;
}

/**
 * Review fetch từ `/api/admin/reviews` PHÍA CLIENT → endpoint hiện trong F12
 * Network. Lọc theo status/flagged/q (URL) + phân trang in-memory.
 */
export function AdminReviewsClient({ status, flagged, q }: Props) {
  const params = new URLSearchParams();
  if (flagged) params.set('flagged', '1');
  else if (status) params.set('status', status);
  if (q) params.set('q', q);
  const { loading, error, data } = useApiResource<Review[]>(
    `/api/admin/reviews?${params.toString()}`,
  );
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status, flagged, q]);

  const reviews = data ?? [];
  const flaggedCount = reviews.filter(
    (r) => r.flags.length > 0 && r.status === 'published',
  ).length;
  const activeTab = flagged ? 'flagged' : (status ?? '');
  const totalPages = Math.ceil(reviews.length / PAGE_SIZE);
  const pageItems = reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        eyebrow="Kiểm duyệt nội dung"
        title="Quản lý đánh giá"
        description="Xem và kiểm duyệt review khách hàng. Ẩn review vi phạm: spam, ngôn từ tục, lộ thông tin cá nhân, review giả."
        actions={
          flaggedCount > 0 ? (
            <Link href="/admin/reviews?flagged=1">
              <Badge variant="danger">{flaggedCount} bị flag</Badge>
            </Link>
          ) : null
        }
      />

      {error && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Không tải được reviews: {error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const href =
              t.key === 'flagged'
                ? buildHref('/admin/reviews', { flagged: '1', q })
                : buildHref('/admin/reviews', { status: t.key || undefined, q });
            return (
              <Link
                key={t.key}
                href={href}
                className={
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-all ' +
                  (active
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900')
                }
              >
                {t.label}
                {t.key === 'flagged' && flaggedCount > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {flaggedCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <form
          action="/admin/reviews"
          method="get"
          className="relative max-w-xs w-full sm:w-auto"
        >
          {status && <input type="hidden" name="status" value={status} />}
          {flagged && <input type="hidden" name="flagged" value="1" />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tìm tên, mã booking, nội dung..."
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        </form>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <MessageSquareText className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-sm font-medium text-ink-700">
            Không có review phù hợp
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <>
          <ol className="space-y-4">
            {pageItems.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </ol>
          <ClientPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={reviews.length}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} sao`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'fill-gold-500 text-gold-500' : 'fill-ink-200 text-ink-200'}`}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review: r }: { review: Review }) {
  const hasFlagAlert = r.flags.length > 0 && r.status === 'published';
  return (
    <li
      className={`list-none rounded-2xl bg-white ring-1 shadow-card transition-all ${
        hasFlagAlert ? 'ring-rose-200 shadow-rose-100/50' : 'ring-ink-200/60'
      }`}
    >
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-200 text-xs font-bold text-navy-800 uppercase">
                {r.customer.name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink-900">
                    {r.customer.name}
                  </span>
                  <Stars rating={r.rating} />
                  <span className="text-xs font-semibold text-ink-700">
                    {r.avgRating.toFixed(1)}
                  </span>
                  <Badge variant={STATUS_VARIANT[r.status]}>
                    {REVIEW_STATUS_LABEL[r.status]}
                  </Badge>
                  {r.flags.length > 0 && (
                    <Badge variant="danger">
                      <Flag className="mr-1 h-3 w-3" />
                      {r.flags.length} flag
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-ink-400">
                  <Link
                    href={`/admin/properties/${r.propertyId}`}
                    className="text-navy-700 hover:underline"
                  >
                    {r.propertyName}
                  </Link>
                  {' · '}
                  <span className="font-mono">{r.bookingCode}</span>
                  {' · '}
                  {relativeTime(r.createdAt)}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-ink-800 leading-relaxed whitespace-pre-line">
              {r.comment}
            </p>

            {/* Thang điểm 6 tiêu chí khách chấm (spec §7.3) */}
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg bg-cream-50 px-4 py-3 sm:grid-cols-3">
              {REVIEW_CRITERIA.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-ink-500">{label}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-ink-900">
                    <Star className="h-3 w-3 fill-gold-500 text-gold-500" />
                    {r.breakdown[key].toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            {r.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {r.photos.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src={url}
                      alt="Ảnh đánh giá của khách"
                      width={80}
                      height={80}
                      unoptimized
                      className="h-20 w-20 rounded-lg object-cover ring-1 ring-ink-200 transition-opacity hover:opacity-90"
                    />
                  </a>
                ))}
              </div>
            )}

            {r.flags.length > 0 && (
              <div className="mt-3 rounded-lg bg-rose-50 px-4 py-3 ring-1 ring-rose-100">
                <p className="text-xs font-semibold text-rose-800">
                  Lý do bị flag:
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {r.flags.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-medium text-rose-700"
                    >
                      {REVIEW_FLAG_LABEL[f]}
                    </span>
                  ))}
                </div>
                {r.flagReason && (
                  <p className="mt-2 text-xs italic text-rose-600">
                    &ldquo;{r.flagReason}&rdquo;
                  </p>
                )}
              </div>
            )}

            {r.ownerReply && (
              <div className="mt-3 rounded-lg bg-cream-50 px-4 py-3 ring-1 ring-ink-100">
                <p className="text-xs font-semibold text-ink-700">
                  Phản hồi của {r.ownerName}:
                </p>
                <p className="mt-1 text-sm text-ink-700">{r.ownerReply}</p>
              </div>
            )}

            {r.status === 'hidden' && r.hiddenReason && (
              <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
                <p className="text-xs text-amber-800">
                  Đã ẩn bởi <strong>{r.hiddenBy?.name}</strong>: {r.hiddenReason}
                </p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-48 shrink-0">
            <ReviewModerationActions reviewId={r.id} status={r.status} />
          </div>
        </div>
      </div>
    </li>
  );
}
