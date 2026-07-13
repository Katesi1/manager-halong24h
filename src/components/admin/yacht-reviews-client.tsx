'use client';

import { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { MessageSquareText, Star } from 'lucide-react';

import {
  hideYachtReviewAction,
  replyYachtReviewAction,
  restoreYachtReviewAction,
} from '@/app/actions/yacht-reviews';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { REVIEW_CRITERIA } from '@/core/entities/review';
import {
  YACHT_REVIEW_STATUS_LABEL,
  type YachtReview,
} from '@/core/entities/yacht-review';
import { relativeTime } from '@/lib/format';
import { refetchApiResources, useApiResource } from '@/lib/use-api-resource';

type Tab = 'all' | 'visible' | 'hidden';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'visible', label: 'Đang hiển thị' },
  { key: 'hidden', label: 'Đã ẩn' },
];

export function YachtReviewsClient() {
  const [tab, setTab] = useState<Tab>('all');
  const url = `/api/admin/yacht-reviews?status=${tab}`;
  const { loading, error, data } = useApiResource<YachtReview[]>(url);

  const reviews = useMemo(() => data ?? [], [data]);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              'rounded-lg px-3.5 py-2 text-sm font-medium transition-all ' +
              (tab === t.key
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Không tải được đánh giá: {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-16 text-center">
          <MessageSquareText className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-3 text-sm font-medium text-ink-700">Không có đánh giá phù hợp</p>
        </div>
      ) : (
        <ol className="space-y-4">
          {reviews.map((r) => (
            <YachtReviewCard key={r.id} review={r} />
          ))}
        </ol>
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

function YachtReviewCard({ review: r }: { review: YachtReview }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<'none' | 'hide' | 'reply'>('none');
  const [hideReason, setHideReason] = useState('');
  const [replyText, setReplyText] = useState(r.reply ?? '');

  function doHide() {
    startTransition(async () => {
      const res = await hideYachtReviewAction(r.id, hideReason.trim() || undefined);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Đã ẩn đánh giá');
      setMode('none');
      refetchApiResources();
    });
  }

  function doRestore() {
    startTransition(async () => {
      const res = await restoreYachtReviewAction(r.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Đã khôi phục đánh giá');
      refetchApiResources();
    });
  }

  function doReply() {
    const text = replyText.trim();
    if (!text) return;
    startTransition(async () => {
      const res = await replyYachtReviewAction(r.yacht.id, r.id, text);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Đã gửi phản hồi');
      setMode('none');
      refetchApiResources();
    });
  }

  return (
    <li className="list-none rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink-900">{r.customer.name || 'Khách'}</span>
            <Stars rating={r.rating} />
            <span className="text-xs font-semibold text-ink-700">{r.avgRating.toFixed(1)}</span>
            <span
              className={
                'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ' +
                (r.status === 'hidden'
                  ? 'bg-amber-50 text-amber-800 ring-amber-200'
                  : 'bg-emerald-50 text-emerald-700 ring-emerald-200')
              }
            >
              {YACHT_REVIEW_STATUS_LABEL[r.status]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ink-400">
            {r.yacht.name} {r.yacht.code ? `· ${r.yacht.code}` : ''} · {relativeTime(r.createdAt)}
          </p>

          {r.comment && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-800">{r.comment}</p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg bg-cream-50 px-4 py-3 sm:grid-cols-3">
            {REVIEW_CRITERIA.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between text-xs">
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
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={url}
                    alt="Ảnh đánh giá"
                    width={80}
                    height={80}
                    unoptimized
                    className="h-20 w-20 rounded-lg object-cover ring-1 ring-ink-200 hover:opacity-90"
                  />
                </a>
              ))}
            </div>
          )}

          {r.reply && mode !== 'reply' && (
            <div className="mt-3 rounded-lg bg-navy-50 px-4 py-3 ring-1 ring-navy-100">
              <p className="text-xs font-semibold text-navy-700">Phản hồi từ hệ thống:</p>
              <p className="mt-1 text-sm text-ink-700">{r.reply}</p>
            </div>
          )}

          {r.status === 'hidden' && r.hiddenReason && (
            <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800 ring-1 ring-amber-100">
              Đã ẩn: {r.hiddenReason}
            </div>
          )}

          {mode === 'hide' && (
            <div className="mt-3 rounded-lg border border-ink-200 p-3">
              <Textarea
                value={hideReason}
                onChange={(e) => setHideReason(e.target.value)}
                rows={2}
                placeholder="Lý do ẩn (tuỳ chọn): spam, ngôn từ tục, lộ thông tin…"
              />
              <div className="mt-2 flex gap-2">
                <Button variant="danger" size="sm" onClick={doHide} disabled={pending}>
                  Xác nhận ẩn
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMode('none')} disabled={pending}>
                  Huỷ
                </Button>
              </div>
            </div>
          )}

          {mode === 'reply' && (
            <div className="mt-3 rounded-lg border border-ink-200 p-3">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                placeholder="Phản hồi thay mặt hệ thống…"
              />
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={doReply} disabled={pending || !replyText.trim()}>
                  Gửi phản hồi
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMode('none')} disabled={pending}>
                  Huỷ
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-40">
          {r.status === 'visible' ? (
            <Button variant="outline" size="sm" onClick={() => setMode(mode === 'hide' ? 'none' : 'hide')} disabled={pending}>
              Ẩn đánh giá
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={doRestore} disabled={pending}>
              Khôi phục
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setMode(mode === 'reply' ? 'none' : 'reply')} disabled={pending}>
            {r.reply ? 'Sửa phản hồi' : 'Trả lời'}
          </Button>
        </div>
      </div>
    </li>
  );
}
