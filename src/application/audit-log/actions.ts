import type { AuditLogRepository } from '@/application/ports/audit-log-repository';
import type {
  AuditEntry,
  AuditFilters,
  RecordAuditInput,
} from '@/core/entities/audit-log';

export async function listAuditEntriesUseCase(
  repo: AuditLogRepository,
  filters?: AuditFilters,
): Promise<AuditEntry[]> {
  return repo.list(filters);
}

export async function recordAuditEntryUseCase(
  repo: AuditLogRepository,
  input: RecordAuditInput,
): Promise<AuditEntry> {
  return repo.record(input);
}
