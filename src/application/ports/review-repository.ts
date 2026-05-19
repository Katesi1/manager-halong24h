import type {
  HideReviewInput,
  RestoreReviewInput,
  Review,
  ReviewFilters,
} from '@/core/entities/review';

export interface ReviewRepository {
  list(filters?: ReviewFilters): Promise<Review[]>;
  getById(id: string): Promise<Review | null>;
  countFlagged(): Promise<number>;
  hide(
    input: HideReviewInput & { hiddenBy: { id: string; name: string } },
  ): Promise<Review>;
  restore(input: RestoreReviewInput): Promise<Review>;
}
