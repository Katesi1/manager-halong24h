'use server';

import { listAuditEntriesUseCase } from '@/application/audit-log/actions';
import type { AuditFilters } from '@/core/entities/audit-log';
import { auditLogRepository } from '@/infrastructure/container';
import { requireAdmin } from '@/lib/auth-guard';

import { toResult } from './_helpers';

export async function listAuditEntriesAction(filters?: AuditFilters) {
  return toResult(async () => {
    await requireAdmin();
    return listAuditEntriesUseCase(auditLogRepository(), filters);
  });
}
