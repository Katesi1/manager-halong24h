import type { Property } from '@/core/entities/property';
import type { PropertyRepository } from '../ports/property-repository';

export async function getPropertyByIdUseCase(
  repo: PropertyRepository,
  id: string,
): Promise<Property | null> {
  if (!id) return null;
  return repo.getById(id);
}
