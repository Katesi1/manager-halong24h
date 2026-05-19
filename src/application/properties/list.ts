import type { Property, PropertyFilters } from '@/core/entities/property';
import type { PropertyRepository } from '../ports/property-repository';

export async function listPropertiesUseCase(
  repo: PropertyRepository,
  filters?: PropertyFilters,
): Promise<Property[]> {
  return repo.list(filters);
}
