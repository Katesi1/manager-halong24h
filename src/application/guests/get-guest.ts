import type { GuestDetail } from '@/core/entities/guest';
import type { GuestRepository } from '../ports/guest-repository';

export async function getGuestUseCase(
  repo: GuestRepository,
  id: string,
): Promise<GuestDetail | null> {
  return repo.getById(id);
}
