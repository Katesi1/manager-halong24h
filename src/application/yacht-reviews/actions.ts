import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  YachtReview,
  YachtReviewFilters,
} from '@/core/entities/yacht-review';
import type { YachtReviewRepository } from '../ports/yacht-review-repository';

export async function listYachtReviewsUseCase(
  repo: YachtReviewRepository,
  filters?: YachtReviewFilters,
): Promise<YachtReview[]> {
  return repo.list(filters);
}

const HideSchema = z.object({
  reviewId: z.string().min(1, 'Thiếu mã đánh giá'),
  reason: z.string().trim().max(500).optional(),
});

export async function hideYachtReviewUseCase(
  repo: YachtReviewRepository,
  reviewId: string,
  reason?: string,
): Promise<YachtReview> {
  const parsed = HideSchema.safeParse({ reviewId, reason });
  if (!parsed.success) {
    throw new ValidationError('Dữ liệu ẩn đánh giá không hợp lệ');
  }
  return repo.hide(parsed.data.reviewId, parsed.data.reason);
}

export async function restoreYachtReviewUseCase(
  repo: YachtReviewRepository,
  reviewId: string,
): Promise<YachtReview> {
  if (!reviewId) throw new ValidationError('Thiếu mã đánh giá');
  return repo.restore(reviewId);
}

const ReplySchema = z.object({
  yachtId: z.string().min(1, 'Thiếu mã du thuyền'),
  reviewId: z.string().min(1, 'Thiếu mã đánh giá'),
  reply: z.string().trim().min(1, 'Nội dung phản hồi không được trống').max(2000),
});

export async function replyYachtReviewUseCase(
  repo: YachtReviewRepository,
  yachtId: string,
  reviewId: string,
  reply: string,
): Promise<YachtReview> {
  const parsed = ReplySchema.safeParse({ yachtId, reviewId, reply });
  if (!parsed.success) {
    throw new ValidationError(
      'Nội dung phản hồi không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.reply(parsed.data.yachtId, parsed.data.reviewId, parsed.data.reply);
}
