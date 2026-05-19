import type { AuditLogRepository } from '@/application/ports/audit-log-repository';
import type {
  AuditEntry,
  AuditFilters,
  RecordAuditInput,
} from '@/core/entities/audit-log';

/**
 * Mock audit log — in-memory store.
 *
 * LƯU Ý: Next.js có thể restart module giữa request → store reset. Đủ cho dev
 * + demo. Khi BE có endpoint, swap sang ApiAuditLogRepository giữ nguyên seed.
 */

const SEED: AuditEntry[] = [
  {
    id: 'log-seed-001',
    actor: { id: 'dev-admin', name: 'Quản trị viên' },
    action: 'kyc_approve',
    target: { type: 'kyc', id: 'kyc-sub-004', label: 'Hồ sơ Lê Hoàng Đức' },
    reason: null,
    at: '2026-05-15T22:00:00.000Z',
  },
  {
    id: 'log-seed-002',
    actor: { id: 'dev-admin', name: 'Quản trị viên' },
    action: 'kyc_reject',
    target: { type: 'kyc', id: 'kyc-sub-003', label: 'Hồ sơ Phạm Hữu Cường' },
    reason: 'Tên TK ngân hàng không khớp CCCD. Yêu cầu cung cấp STK đúng chủ.',
    at: '2026-05-15T16:00:00.000Z',
  },
  {
    id: 'log-seed-003',
    actor: { id: 'dev-admin', name: 'Quản trị viên' },
    action: 'user_ban',
    target: { type: 'user', id: 'cus-002', label: 'Khách Nguyễn Hữu Cường' },
    reason: 'Phá cơ sở, gây ồn 3h sáng. Có khiếu nại từ chủ Tuấn.',
    at: '2025-12-09T10:00:00.000Z',
  },
  {
    id: 'log-seed-004',
    actor: { id: 'dev-admin', name: 'Quản trị viên' },
    action: 'user_change_plan',
    target: { type: 'user', id: 'owner-004', label: 'Chủ nhà Lê Hoàng Đức' },
    reason: 'Nâng từ Cơ bản → Tiêu chuẩn theo yêu cầu chủ nhà',
    at: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'log-seed-005',
    actor: { id: 'dev-admin', name: 'Quản trị viên' },
    action: 'dispute_resolve',
    target: {
      type: 'dispute',
      id: 'd-4',
      label: 'Khiếu nại no-show HL-2026-04-0011',
    },
    reason: 'Chủ nhà giữ 100% cọc theo policy hủy <48h. Khách flag warning.',
    at: '2026-04-16T15:00:00.000Z',
  },
];

const store: AuditEntry[] = [...SEED];

let counter = SEED.length;

function nextId(): string {
  counter += 1;
  const stamp = Date.now().toString(36);
  return `log-${stamp}-${counter}`;
}

function matchesFilters(entry: AuditEntry, f: AuditFilters): boolean {
  if (f.actorId && entry.actor.id !== f.actorId) return false;
  if (f.action && entry.action !== f.action) return false;
  if (f.targetType && entry.target.type !== f.targetType) return false;
  if (f.from && entry.at < f.from) return false;
  if (f.to && entry.at > f.to) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay =
      `${entry.actor.name} ${entry.target.label} ${entry.reason ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export class MockAuditLogRepository implements AuditLogRepository {
  async list(filters: AuditFilters = {}): Promise<AuditEntry[]> {
    const sorted = [...store].sort((a, b) => b.at.localeCompare(a.at));
    const filtered = sorted.filter((e) => matchesFilters(e, filters));
    return filters.limit ? filtered.slice(0, filters.limit) : filtered;
  }

  async record(input: RecordAuditInput): Promise<AuditEntry> {
    const entry: AuditEntry = {
      id: nextId(),
      actor: input.actor,
      action: input.action,
      target: input.target,
      reason: input.reason ?? null,
      at: new Date().toISOString(),
    };
    store.unshift(entry);
    return entry;
  }
}
