import type { GuestFilters, PaginatedGuests } from '@/core/entities/guest';
import type { GuestRepository } from '../ports/guest-repository';

export async function listGuestsUseCase(
  repo: GuestRepository,
  filters?: GuestFilters,
): Promise<PaginatedGuests> {
  return repo.list(filters);
}
