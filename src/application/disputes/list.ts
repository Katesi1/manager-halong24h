import type { Dispute, DisputeFilters } from '@/core/entities/dispute';
import type { DisputeRepository } from '../ports/dispute-repository';

export async function listDisputesUseCase(
  repo: DisputeRepository,
  filters?: DisputeFilters,
): Promise<Dispute[]> {
  return repo.list(filters);
}
