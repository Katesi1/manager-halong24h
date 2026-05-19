'use server';

import { revalidatePath } from 'next/cache';

import {
  countFlaggedReviewsUseCase,
  getReviewUseCase,
  hideReviewUseCase,
  listReviewsUseCase,
  restoreReviewUseCase,
} from '@/application/reviews/actions';
import type { ReviewFilters } from '@/core/entities/review';
import { reviewRepository } from '@/infrastructure/container';
import { recordAudit } from '@/lib/audit-recorder';
import { requireAdmin } from '@/lib/auth-guard';

import { toResult } from './_helpers';

export async function listReviewsAction(filters?: ReviewFilters) {
  return toResult(async () => {
    await requireAdmin();
    return listReviewsUseCase(reviewRepository(), filters);
  });
}

export async function getReviewAction(id: string) {
  return toResult(async () => {
    await requireAdmin();
    return getReviewUseCase(reviewRepository(), id);
  });
}

export async function countFlaggedReviewsAction() {
  return toResult(async () => {
    await requireAdmin();
    return countFlaggedReviewsUseCase(reviewRepository());
  });
}

export async function hideReviewAction(reviewId: string, reason: string) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    const review = await hideReviewUseCase(
      reviewRepository(),
      { reviewId, reason },
      { id: profile.id, name: profile.name || profile.email || 'Admin' },
    );
    await recordAudit(
      profile,
      'review_hide',
      {
        type: 'review',
        id: review.id,
        label: `Review của ${review.customer.name} (${review.propertyName})`,
      },
      reason,
    );
    return review;
  });
  if (result.ok) {
    revalidatePath('/admin/reviews');
    revalidatePath(`/admin/reviews/${reviewId}`);
  }
  return result;
}

export async function restoreReviewAction(reviewId: string) {
  const result = await toResult(async () => {
    await requireAdmin();
    return restoreReviewUseCase(reviewRepository(), reviewId);
  });
  if (result.ok) {
    revalidatePath('/admin/reviews');
    revalidatePath(`/admin/reviews/${reviewId}`);
  }
  return result;
}
