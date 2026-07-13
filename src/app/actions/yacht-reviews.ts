'use server';

import { revalidatePath } from 'next/cache';

import {
  hideYachtReviewUseCase,
  listYachtReviewsUseCase,
  replyYachtReviewUseCase,
  restoreYachtReviewUseCase,
} from '@/application/yacht-reviews/actions';
import type { YachtReviewFilters } from '@/core/entities/yacht-review';
import { yachtReviewRepository } from '@/infrastructure/container';
import { requireYachtManager } from '@/lib/auth-guard';

import { toResult } from './_helpers';

function revalidate() {
  revalidatePath('/admin/yacht-reviews');
}

export async function listYachtReviewsAction(filters?: YachtReviewFilters) {
  return toResult(async () => {
    await requireYachtManager();
    return listYachtReviewsUseCase(yachtReviewRepository(), filters);
  });
}

export async function hideYachtReviewAction(reviewId: string, reason?: string) {
  const result = await toResult(async () => {
    await requireYachtManager();
    return hideYachtReviewUseCase(yachtReviewRepository(), reviewId, reason);
  });
  if (result.ok) revalidate();
  return result;
}

export async function restoreYachtReviewAction(reviewId: string) {
  const result = await toResult(async () => {
    await requireYachtManager();
    return restoreYachtReviewUseCase(yachtReviewRepository(), reviewId);
  });
  if (result.ok) revalidate();
  return result;
}

export async function replyYachtReviewAction(
  yachtId: string,
  reviewId: string,
  reply: string,
) {
  const result = await toResult(async () => {
    await requireYachtManager();
    return replyYachtReviewUseCase(
      yachtReviewRepository(),
      yachtId,
      reviewId,
      reply,
    );
  });
  if (result.ok) revalidate();
  return result;
}
