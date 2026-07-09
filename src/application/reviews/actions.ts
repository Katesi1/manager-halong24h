import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  Review,
  ReviewFilters,
} from '@/core/entities/review';
import type { ReviewRepository } from '../ports/review-repository';

export async function listReviewsUseCase(
  repo: ReviewRepository,
  filters?: ReviewFilters,
): Promise<Review[]> {
  return repo.list(filters);
}

export async function listPropertyReviewsUseCase(
  repo: ReviewRepository,
  propertyId: string,
): Promise<Review[]> {
  if (!propertyId) throw new ValidationError('Thiếu mã cơ sở');
  return repo.listByProperty(propertyId);
}

export async function getReviewUseCase(
  repo: ReviewRepository,
  id: string,
): Promise<Review | null> {
  if (!id) return null;
  return repo.getById(id);
}

export async function countFlaggedReviewsUseCase(
  repo: ReviewRepository,
): Promise<number> {
  return repo.countFlagged();
}

const HideSchema = z.object({
  reviewId: z.string().min(1, 'Thiếu mã review'),
  reason: z.string().min(5, 'Lý do tối thiểu 5 ký tự').max(500),
});

export async function hideReviewUseCase(
  repo: ReviewRepository,
  raw: unknown,
  hiddenBy: { id: string; name: string },
): Promise<Review> {
  const parsed = HideSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu ẩn review không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.hide({ ...parsed.data, hiddenBy });
}

export async function restoreReviewUseCase(
  repo: ReviewRepository,
  reviewId: string,
): Promise<Review> {
  if (!reviewId) throw new ValidationError('Thiếu mã review');
  return repo.restore({ reviewId });
}
