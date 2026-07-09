'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';

import { PageHeader } from '@/components/host/page-header';
import { REVIEW_CRITERIA, type Review } from '@/core/entities/review';
import { relativeTime } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

interface PropertyLite {
  id: string;
  name: string;
}

/**
 * Trang host xem đánh giá của khách cho cơ sở mình (thang điểm 6 tiêu chí +
 * ảnh + comment + phản hồi). Fetch client-side qua BFF `/api/host/reviews`.
 */
export function HostReviewsClient() {
  const {
    loading,
    error,
    data: properties,
  } = useApiResource<PropertyLite[]>('/api/properties');
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    if (properties && properties.length > 0 && !selected) {
      setSelected(properties[0].id);
    }
  }, [properties, selected]);

  return (
    <>
      <PageHeader
        title="Đánh giá cơ sở"
        description="Xem đánh giá khách để lại sau khi lưu trú tại cơ sở của bạn"
      />

      {loading && (
        <p className="py-16 text-center text-sm text-ink-500">Đang tải…</p>
      )}
      {error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          {error}
        </div>
      )}
      {properties && properties.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-cream-50 p-10 text-center">
          <p className="text-sm text-ink-700">
            Bạn chưa có cơ sở nào để nhận đánh giá.
          </p>
        </div>
      )}

      {properties && properties.length > 0 && (
        <div className="space-y-5">
          <div>
            <label
              htmlFor="review-property"
              className="overline muted no-dash text-[10px]"
            >
              Chọn cơ sở
            </label>
            <select
              id="review-property"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="mt-1 block w-full max-w-md rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-navy-500 focus:outline-none"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {selected && <PropertyReviews propertyId={selected} />}
        </div>
      )}
    </>
  );
}

function PropertyReviews({ propertyId }: { propertyId: string }) {
  const { loading, error, data } = useApiResource<Review[]>(
    `/api/host/reviews?propertyId=${propertyId}`,
  );
  const [minRating, setMinRating] = useState(0);

  const summary = useMemo(() => {
    if (!data || data.length === 0) return null;
    const avg = data.reduce((s, r) => s + r.avgRating, 0) / data.length;
    return { avg, count: data.length };
  }, [data]);

  const reviews = useMemo(
    () => (data ?? []).filter((r) => r.avgRating >= minRating),
    [data, minRating],
  );

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-ink-500">Đang tải đánh giá…</p>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
        {error}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-cream-50 p-10 text-center">
        <p className="text-sm text-ink-700">
          Cơ sở này chưa có đánh giá nào từ khách.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-2xl font-bold text-navy-900">
            <Star className="h-6 w-6 fill-gold-500 text-gold-500" />
            {summary?.avg.toFixed(1)}
          </span>
          <span className="text-sm text-ink-500">
            {summary?.count} đánh giá
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="review-min" className="text-xs text-ink-500">
            Lọc theo sao
          </label>
          <select
            id="review-min"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 focus:border-navy-500 focus:outline-none"
          >
            <option value={0}>Tất cả</option>
            <option value={5}>5 sao</option>
            <option value={4}>Từ 4 sao</option>
            <option value={3}>Từ 3 sao</option>
            <option value={2}>Từ 2 sao</option>
            <option value={1}>Từ 1 sao</option>
          </select>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-500">
          Không có đánh giá nào khớp bộ lọc.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id}>
              <ReviewCard review={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewCard({ review: r }: { review: Review }) {
  const rounded = Math.round(r.avgRating);
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-200 text-xs font-bold uppercase text-navy-800">
          {(r.customer.name || '?').charAt(0)}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink-900">
              {r.customer.name || 'Khách'}
            </span>
            <span
              className="inline-flex gap-0.5"
              aria-label={`${r.avgRating.toFixed(1)} sao`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < rounded
                      ? 'fill-gold-500 text-gold-500'
                      : 'fill-ink-200 text-ink-200'
                  }`}
                />
              ))}
            </span>
            <span className="text-xs font-semibold text-ink-700">
              {r.avgRating.toFixed(1)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ink-400">
            {relativeTime(r.createdAt)}
          </p>
        </div>
      </div>

      {r.comment && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-800">
          {r.comment}
        </p>
      )}

      {/* Thang điểm 6 tiêu chí (spec §7.3) */}
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
            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
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

      {r.ownerReply && (
        <div className="mt-3 rounded-lg bg-cream-50 px-4 py-3 ring-1 ring-ink-100">
          <p className="text-xs font-semibold text-ink-700">Phản hồi của bạn:</p>
          <p className="mt-1 text-sm text-ink-700">{r.ownerReply}</p>
        </div>
      )}
    </div>
  );
}
