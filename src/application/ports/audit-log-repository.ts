import type {
  AuditEntry,
  AuditFilters,
} from '@/core/entities/audit-log';

/**
 * Spec §14 — BE tự ghi mỗi khi admin gọi API.
 * FE chỉ ĐỌC, không ghi. Cố tình không có method `record()`.
 */
export interface AuditLogRepository {
  list(filters?: AuditFilters): Promise<AuditEntry[]>;
}
