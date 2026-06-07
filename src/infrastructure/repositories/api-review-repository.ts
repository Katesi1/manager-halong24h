import 'server-only';

import type {
  HideReviewInput,
  RestoreReviewInput,
  Review,
  ReviewFilters,
  ReviewStatus,
} from '@/core/entities/review';
import type { ReviewRepository } from '@/application/ports/review-repository';

import { apiClient } from '../http/api-client';

/** Spec §7.3. */
interface SpecReview {
  id: string;
  propertyId: string;
  bookingId: string;
  customerId: string;
  cleanliness: number;
  location: number;
  amenities: number;
  service: number;
  value: number;
  accuracy: number;
  avgRating: number;
  comment: string;
  photos: string[];
  ownerReply: string | null;
  ownerReplyAt: string | null;
  isHidden: boolean;
  hiddenReason: string | null;
  createdAt: string;
  updatedAt: string;
  /** Optional hydrated fields tuỳ BE bundle. */
  propertyName?: string;
  ownerId?: string;
  ownerName?: string;
  bookingCode?: string;
  customer?: { id: string; name: string; avatarUrl?: string | null };
  hiddenBy?: { id: string; name: string } | null;
  hiddenAt?: string | null;
}

function mapStatus(s: SpecReview): ReviewStatus {
  return s.isHidden ? 'hidden' : 'published';
}

function mapReview(s: SpecReview): Review {
  return {
    id: s.id,
    bookingId: s.bookingId,
    bookingCode: s.bookingCode ?? s.bookingId,
    propertyId: s.propertyId,
    propertyName: s.propertyName ?? '',
    ownerId: s.ownerId ?? '',
    ownerName: s.ownerName ?? '',
    customer: s.customer ?? { id: s.customerId, name: '' },
    rating: Math.round(s.avgRating),
    comment: s.comment,
    status: mapStatus(s),
    ownerReply: s.ownerReply,
    ownerReplyAt: s.ownerReplyAt,
    flags: [],
    flagReason: null,
    hiddenBy: s.hiddenBy ?? null,
    hiddenAt: s.hiddenAt ?? null,
    hiddenReason: s.hiddenReason,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export class ApiReviewRepository implements ReviewRepository {
  async list(filters?: ReviewFilters): Promise<Review[]> {
    // Spec §7.2 — GET /admin/reviews?status=visible|hidden|all&rating&search
    const statusParam =
      filters?.status === 'hidden'
        ? 'hidden'
        : filters?.status === 'published'
          ? 'visible'
          : 'all';
    const data = await apiClient.get<SpecReview[] | { items: SpecReview[] }>(
      '/admin/reviews',
      {
        query: {
          status: statusParam,
          rating: filters?.rating,
          search: filters?.search,
        },
        cache: 'no-store',
      },
    );
    const arr = Array.isArray(data) ? data : (data.items ?? []);
    return arr.map(mapReview);
  }

  async getById(id: string): Promise<Review | null> {
    // Spec v1.3 §7 B1 — GET /admin/reviews/:reviewId trả full ReviewDto hydrated.
    try {
      const data = await apiClient.get<SpecReview>(`/admin/reviews/${id}`, {
        cache: 'no-store',
      });
      return mapReview(data);
    } catch (err) {
      if (
        err instanceof Error &&
        'status' in err &&
        (err as { status: number }).status === 404
      ) {
        return null;
      }
      throw err;
    }
  }

  async countFlagged(): Promise<number> {
    const data = await apiClient.get<number | { count: number }>(
      '/admin/reviews/count-flagged',
      { cache: 'no-store' },
    );
    return typeof data === 'number' ? data : data.count;
  }

  async hide(
    input: HideReviewInput & { hiddenBy: { id: string; name: string } },
  ): Promise<Review> {
    // Spec §7.2 — DELETE /admin/reviews/:reviewId body: { reason }
    const spec = await apiClient.delete<SpecReview>(
      `/admin/reviews/${input.reviewId}`,
      { body: { reason: input.reason } },
    );
    return mapReview(spec);
  }

  async restore(input: RestoreReviewInput): Promise<Review> {
    const spec = await apiClient.post<SpecReview>(
      `/admin/reviews/${input.reviewId}/restore`,
    );
    return mapReview(spec);
  }
}
