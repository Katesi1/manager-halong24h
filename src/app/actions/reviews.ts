'use server';

import { revalidatePath } from 'next/cache';

import {
  countFlaggedReviewsUseCase,
  getReviewUseCase,
  hideReviewUseCase,
  listPropertyReviewsUseCase,
  listReviewsUseCase,
  restoreReviewUseCase,
} from '@/application/reviews/actions';
import type { ReviewFilters } from '@/core/entities/review';
import { reviewRepository } from '@/infrastructure/container';
import { requireAdmin, requireOwnerOfProperty } from '@/lib/auth-guard';

import { toResult } from './_helpers';

export async function listReviewsAction(filters?: ReviewFilters) {
  return toResult(async () => {
    await requireAdmin();
    return listReviewsUseCase(reviewRepository(), filters);
  });
}

/**
 * Host xem review 1 cơ sở của mình. `requireOwnerOfProperty` chặn xem chéo
 * cơ sở owner khác (dù endpoint BE là public — defense-in-depth).
 */
export async function listPropertyReviewsAction(propertyId: string) {
  return toResult(async () => {
    await requireOwnerOfProperty(propertyId);
    return listPropertyReviewsUseCase(reviewRepository(), propertyId);
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
