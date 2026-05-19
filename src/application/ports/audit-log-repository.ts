import type {
  AuditEntry,
  AuditFilters,
  RecordAuditInput,
} from '@/core/entities/audit-log';

export interface AuditLogRepository {
  list(filters?: AuditFilters): Promise<AuditEntry[]>;
  /** Ghi một entry mới. Trả về entry đã ghi (có id + at). */
  record(input: RecordAuditInput): Promise<AuditEntry>;
}
