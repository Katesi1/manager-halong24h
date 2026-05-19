import type { PropertyRepository } from '../ports/property-repository';

export async function deletePropertyUseCase(
  repo: PropertyRepository,
  id: string,
): Promise<void> {
  await repo.delete(id);
}
