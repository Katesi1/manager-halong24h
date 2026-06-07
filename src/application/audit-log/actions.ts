import type { AuditLogRepository } from '@/application/ports/audit-log-repository';
import type {
  AuditEntry,
  AuditFilters,
} from '@/core/entities/audit-log';

export async function listAuditEntriesUseCase(
  repo: AuditLogRepository,
  filters?: AuditFilters,
): Promise<AuditEntry[]> {
  return repo.list(filters);
}
