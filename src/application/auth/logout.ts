import type { AuthRepository } from '../ports/auth-repository';

export async function logoutUseCase(repo: AuthRepository): Promise<void> {
  try {
    await repo.logout();
  } catch {
    // Server logout có thể fail (token đã hết hạn) — vẫn xoá token client-side
  }
}
