import Link from 'next/link';

import { listReviewsAction } from '@/app/actions/reviews';
import { ReviewModerationActions } from '@/components/admin/review-moderation-actions';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import {
  REVIEW_FLAG_LABEL,
  REVIEW_STATUS_LABEL,
  type Review,
  type ReviewFilters,
  type ReviewStatus,
} from '@/core/entities/review';
import { formatDateTime, relativeTime } from '@/lib/format';

const STATUS_VARIANT: Record<
  ReviewStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  published: 'success',
  hidden: 'warning',
  deleted: 'default',
};

function parseStatus(v: string | undefined): ReviewStatus | undefined {
  if (v === 'published' || v === 'hidden' || v === 'deleted') return v;
  return undefined;
}

function parseRating(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return n >= 1 && n <= 5 ? n : undefined;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} sao`} className="text-gold-700">
      {'★'.repeat(rating)}
      <span className="text-ink-200">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export default async function AdminReviewsPage(props: {
  searchParams: Promise<{
    status?: string;
    rating?: string;
    flagged?: string;
    q?: string;
  }>;
}) {
  const sp = await props.searchParams;
  const filters: ReviewFilters = {
    status: parseStatus(sp.status),
    rating: parseRating(sp.rating),
    flagged: sp.flagged === '1' || undefined,
    search: sp.q?.trim() || undefined,
  };

  const result = await listReviewsAction(filters);
  const reviews: Review[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  const flaggedCount = reviews.filter(
    (r) => r.flags.length > 0 && r.status === 'published',
  ).length;

  const activeFilters = [
    filters.status,
    filters.rating,
    filters.flagged,
    filters.search,
  ].filter(Boolean).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Kiểm duyệt nội dung"
        title="Quản lý đánh giá"
        description="Xem và ẩn review vi phạm chính sách: spam, ngôn từ tục, lộ thông tin cá nhân, review giả."
        actions={
          flaggedCount > 0 && (
            <Badge variant="danger">{flaggedCount} bị flag</Badge>
          )
        }
      />

      <div className="mb-4 rounded-lg bg-cream-100 px-4 py-3 text-xs text-ink-700">
        ℹ️ Backend chưa expose endpoint <code>/reviews</code>. Đang dùng mock —
        khi BE ready chỉ cần swap repository, UI không đổi.
      </div>

      <form
        className="mb-5 rounded-2xl bg-white p-4 ring-1 ring-ink-200/60 shadow-card grid gap-3 sm:grid-cols-[1fr_1fr_auto_1fr_auto]"
        action="/admin/reviews"
      >
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1">
            Trạng thái
          </label>
          <select
            name="status"
            defaultValue={filters.status ?? ''}
            className="h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          >
            <option value="">Tất cả</option>
            <option value="published">Đang hiển thị</option>
            <option value="hidden">Đã ẩn</option>
            <option value="deleted">Đã xoá</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1">
            Số sao
          </label>
          <select
            name="rating"
            defaultValue={filters.rating ? String(filters.rating) : ''}
            className="h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          >
            <option value="">Tất cả</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            name="flagged"
            value="1"
            defaultChecked={filters.flagged === true}
            className="h-4 w-4 rounded border-ink-300"
          />
          <span>Chỉ bị flag</span>
        </label>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1">
            Tìm theo tên / mã / nội dung
          </label>
          <input
            type="search"
            name="q"
            defaultValue={filters.search ?? ''}
            placeholder="VD: HL-2026, Phạm Văn An…"
            className="h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="h-9 rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
          >
            Lọc
          </button>
          {activeFilters > 0 && (
            <Link
              href="/admin/reviews"
              className="h-9 inline-flex items-center rounded-md border border-ink-200 px-3 text-sm text-ink-700 hover:bg-cream-100"
            >
              Xoá
            </Link>
          )}
        </div>
      </form>

      {apiError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Không tải được reviews: {apiError}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-ink-200/60 shadow-card">
          <p className="text-2xl">⭐</p>
          <p className="mt-2 text-sm font-medium text-ink-900">
            Không có review phù hợp
          </p>
        </div>
      ) : (
        <ol className="space-y-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars rating={r.rating} />
                    <Badge variant={STATUS_VARIANT[r.status]}>
                      {REVIEW_STATUS_LABEL[r.status]}
                    </Badge>
                    {r.flags.length > 0 && (
                      <Badge variant="danger">
                        🚩 {r.flags.length} flag
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm">
                    <strong className="text-ink-900">{r.customer.name}</strong>{' '}
                    <span className="text-ink-500">đánh giá</span>{' '}
                    <Link
                      href={`/admin/properties/${r.propertyId}`}
                      className="font-medium text-navy-700 hover:underline"
                    >
                      {r.propertyName}
                    </Link>{' '}
                    <span className="text-xs font-mono text-ink-500">
                      ({r.bookingCode})
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-ink-800 whitespace-pre-line">
                    {r.comment}
                  </p>

                  {r.flags.length > 0 && (
                    <div className="mt-2 rounded-md bg-rose-50 p-2 text-xs ring-1 ring-rose-200">
                      <p className="font-semibold text-rose-900">
                        Flag từ owner / hệ thống:
                      </p>
                      <ul className="mt-1 list-disc list-inside text-rose-800">
                        {r.flags.map((f) => (
                          <li key={f}>{REVIEW_FLAG_LABEL[f]}</li>
                        ))}
                      </ul>
                      {r.flagReason && (
                        <p className="mt-1 italic text-rose-700">
                          “{r.flagReason}”
                        </p>
                      )}
                    </div>
                  )}

                  {r.ownerReply && (
                    <div className="mt-2 rounded-md bg-cream-100 p-2 text-xs">
                      <p className="font-semibold text-ink-900">
                        Phản hồi của {r.ownerName}:
                      </p>
                      <p className="mt-1 text-ink-700">{r.ownerReply}</p>
                    </div>
                  )}

                  {r.status === 'hidden' && r.hiddenReason && (
                    <p className="mt-2 text-xs text-amber-800 italic">
                      Đã ẩn bởi <strong>{r.hiddenBy?.name}</strong>: {r.hiddenReason}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-ink-500">
                    {relativeTime(r.createdAt)} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <div className="w-full sm:w-56 shrink-0">
                  <ReviewModerationActions reviewId={r.id} status={r.status} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
