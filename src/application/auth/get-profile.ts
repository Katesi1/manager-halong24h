import type { UserProfile } from '@/core/entities/user';
import type { AuthRepository } from '../ports/auth-repository';

export async function getProfileUseCase(
  repo: AuthRepository,
): Promise<UserProfile> {
  return repo.getProfile();
}
