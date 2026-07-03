import type { Property } from '@/core/entities/property';
import type { PropertyRepository } from '@/application/ports/property-repository';

/**
 * Use case duyệt cơ sở (admin moderation — spec §4.4 + §4.10).
 * Server Action validate input (Zod) trước khi gọi; ở đây chỉ điều phối repo.
 */

export function approvePropertyUseCase(
  repo: PropertyRepository,
  id: string,
): Promise<Property> {
  return repo.approve(id);
}

export function rejectPropertyUseCase(
  repo: PropertyRepository,
  id: string,
  reason: string,
): Promise<Property> {
  return repo.reject(id, reason);
}

export function suspendPropertyUseCase(
  repo: PropertyRepository,
  id: string,
  reason?: string,
): Promise<Property> {
  return repo.suspend(id, reason);
}

export function setPropertyHotUseCase(
  repo: PropertyRepository,
  id: string,
  isHot: boolean,
): Promise<Property> {
  return repo.setHot(id, isHot);
}
