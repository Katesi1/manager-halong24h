import 'server-only';

import type {
  YachtReview,
  YachtReviewFilters,
} from '@/core/entities/yacht-review';
import type { YachtReviewRepository } from '@/application/ports/yacht-review-repository';

import { apiClient } from '../http/api-client';

interface RawYachtReview {
  id: string;
  yacht?: { id: string; name: string; code: string } | null;
  yachtId?: string;
  customer?: { id: string; name: string; avatarUrl?: string | null } | null;
  customerId?: string;
  cleanliness?: number;
  location?: number;
  amenities?: number;
  service?: number;
  value?: number;
  accuracy?: number;
  avgRating?: number;
  comment?: string | null;
  photos?: string[] | null;
  reply?: string | null;
  replyAt?: string | null;
  isHidden?: boolean;
  hiddenReason?: string | null;
  createdAt: string;
}

function mapReview(r: RawYachtReview): YachtReview {
  const avg = r.avgRating ?? 0;
  return {
    id: r.id,
    yacht: r.yacht ?? { id: r.yachtId ?? '', name: '', code: '' },
    customer: r.customer ?? { id: r.customerId ?? '', name: '' },
    breakdown: {
      cleanliness: r.cleanliness ?? 0,
      location: r.location ?? 0,
      amenities: r.amenities ?? 0,
      service: r.service ?? 0,
      value: r.value ?? 0,
      accuracy: r.accuracy ?? 0,
    },
    avgRating: avg,
    rating: Math.round(avg),
    comment: r.comment ?? '',
    photos: r.photos ?? [],
    reply: r.reply ?? null,
    replyAt: r.replyAt ?? null,
    status: r.isHidden ? 'hidden' : 'visible',
    hiddenReason: r.hiddenReason ?? null,
    createdAt: r.createdAt,
  };
}

export class ApiYachtReviewRepository implements YachtReviewRepository {
  async list(filters?: YachtReviewFilters): Promise<YachtReview[]> {
    const data = await apiClient.get<
      RawYachtReview[] | { items: RawYachtReview[] }
    >('/admin/yacht-reviews', {
      query: {
        status: filters?.status ?? 'all',
        page: filters?.page,
        pageSize: filters?.pageSize,
      },
      cache: 'no-store',
    });
    const arr = Array.isArray(data) ? data : (data.items ?? []);
    return arr.map(mapReview);
  }

  async hide(reviewId: string, reason?: string): Promise<YachtReview> {
    const data = await apiClient.delete<RawYachtReview>(
      `/admin/yacht-reviews/${reviewId}`,
      { body: reason ? { reason } : undefined },
    );
    return mapReview(data);
  }

  async restore(reviewId: string): Promise<YachtReview> {
    const data = await apiClient.post<RawYachtReview>(
      `/admin/yacht-reviews/${reviewId}/restore`,
    );
    return mapReview(data);
  }

  async reply(
    yachtId: string,
    reviewId: string,
    reply: string,
  ): Promise<YachtReview> {
    const data = await apiClient.post<RawYachtReview>(
      `/yachts/${yachtId}/reviews/${reviewId}/reply`,
      { reply },
    );
    return mapReview(data);
  }
}
