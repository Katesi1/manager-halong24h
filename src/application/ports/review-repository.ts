import type {
  HideReviewInput,
  RestoreReviewInput,
  Review,
  ReviewFilters,
} from '@/core/entities/review';

export interface ReviewRepository {
  list(filters?: ReviewFilters): Promise<Review[]>;
  /** Spec §7.2 — GET /properties/:id/reviews (public). Host xem review cơ sở mình. */
  listByProperty(propertyId: string): Promise<Review[]>;
  getById(id: string): Promise<Review | null>;
  countFlagged(): Promise<number>;
  hide(
    input: HideReviewInput & { hiddenBy: { id: string; name: string } },
  ): Promise<Review>;
  restore(input: RestoreReviewInput): Promise<Review>;
}
