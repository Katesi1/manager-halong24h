import 'server-only';

import type {
  AuditAction,
  AuditEntry,
  AuditFilters,
  AuditTargetType,
} from '@/core/entities/audit-log';
import type { AuditLogRepository } from '@/application/ports/audit-log-repository';

import { apiClient } from '../http/api-client';

/**
 * Spec §14.3 — BE entry shape.
 */
interface SpecAuditEntry {
  id: string;
  actorId: string;
  actorRole: number;
  actor: { id: string; name: string; email?: string; role: number } | null;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const ALLOWED_ACTIONS: AuditAction[] = [
  'kyc_approve',
  'kyc_reject',
  'user_ban',
  'user_unban',
  'user_revoke_sessions',
  'user_reset_password',
  'user_change_plan',
  'user_change_role',
  'user_delete',
  'user_kyc_bypass_toggle',
  'property_approve',
  'property_reject',
  'property_suspend',
  'dispute_resolve',
  'dispute_reject',
  'dispute_investigate',
  'review_hide',
  'review_restore',
  'booking_mark_paid',
  'subscription_trial_grant',
  'subscription_trial_revoke',
  'subscription_set_price',
  'subscription_mark_paid',
  'subscription_freeze',
  'subscription_unfreeze',
];

/** spec dot-slug → FE underscore. Reject action lạ thay vì cast bừa. */
function mapAction(spec: string): AuditAction | null {
  const normalized = spec.replaceAll('.', '_');
  return ALLOWED_ACTIONS.includes(normalized as AuditAction)
    ? (normalized as AuditAction)
    : null;
}

function mapTargetType(spec: string): AuditTargetType | null {
  const set: AuditTargetType[] = [
    'user',
    'property',
    'booking',
    'dispute',
    'subscription',
    'kyc',
    'review',
  ];
  return set.includes(spec as AuditTargetType) ? (spec as AuditTargetType) : null;
}

function mapEntry(s: SpecAuditEntry): AuditEntry | null {
  const action = mapAction(s.action);
  const targetType = mapTargetType(s.targetType);
  if (!action || !targetType) return null;
  const reason =
    typeof s.metadata?.reason === 'string' ? (s.metadata.reason as string) : null;
  return {
    id: s.id,
    actor: {
      id: s.actorId,
      name: s.actor?.name ?? s.actor?.email ?? 'Quản trị viên',
    },
    action,
    target: {
      type: targetType,
      id: s.targetId,
      label: s.targetLabel ?? s.targetId,
    },
    reason,
    at: s.createdAt,
  };
}

export class ApiAuditLogRepository implements AuditLogRepository {
  async list(filters?: AuditFilters): Promise<AuditEntry[]> {
    const data = await apiClient.get<SpecAuditEntry[] | { items: SpecAuditEntry[] }>(
      '/admin/audit-log',
      {
        query: {
          actorId: filters?.actorId,
          action: filters?.action,
          targetType: filters?.targetType,
          from: filters?.from,
          to: filters?.to,
          search: filters?.q,
          limit: filters?.limit,
        },
        cache: 'no-store',
      },
    );
    const arr = Array.isArray(data) ? data : data.items ?? [];
    return arr
      .map(mapEntry)
      .filter((e): e is AuditEntry => e !== null);
  }
}
