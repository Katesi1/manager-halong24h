import Link from 'next/link';

import { listAuditEntriesAction } from '@/app/actions/audit-log';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import {
  AUDIT_ACTION_LABEL,
  AUDIT_TARGET_HREF,
  type AuditAction,
  type AuditEntry,
  type AuditFilters,
  type AuditTargetType,
} from '@/core/entities/audit-log';
import { formatDateTime, relativeTime } from '@/lib/format';

const ACTION_TONE: Record<
  AuditAction,
  Parameters<typeof Badge>[0]['variant']
> = {
  kyc_approve: 'success',
  kyc_reject: 'danger',
  user_ban: 'danger',
  user_unban: 'success',
  user_revoke_session: 'warning',
  user_reset_password: 'info',
  user_change_plan: 'gold',
  user_change_role: 'gold',
  property_approve: 'success',
  property_reject: 'danger',
  property_suspend: 'warning',
  dispute_resolve: 'success',
  dispute_reject: 'default',
  dispute_start_investigation: 'info',
  review_hide: 'warning',
};

const ACTION_OPTIONS: { value: AuditAction; label: string }[] = (
  Object.keys(AUDIT_ACTION_LABEL) as AuditAction[]
).map((a) => ({ value: a, label: AUDIT_ACTION_LABEL[a] }));

const TARGET_OPTIONS: { value: AuditTargetType; label: string }[] = [
  { value: 'user', label: 'Người dùng' },
  { value: 'property', label: 'Cơ sở' },
  { value: 'dispute', label: 'Khiếu nại' },
  { value: 'kyc', label: 'KYC' },
  { value: 'review', label: 'Review' },
];

function parseAction(v: string | undefined): AuditAction | undefined {
  if (!v) return undefined;
  return (Object.keys(AUDIT_ACTION_LABEL) as AuditAction[]).includes(
    v as AuditAction,
  )
    ? (v as AuditAction)
    : undefined;
}

function parseTarget(v: string | undefined): AuditTargetType | undefined {
  if (!v) return undefined;
  return TARGET_OPTIONS.some((o) => o.value === v)
    ? (v as AuditTargetType)
    : undefined;
}

export default async function AdminAuditLogPage(props: {
  searchParams: Promise<{
    action?: string;
    target?: string;
    q?: string;
  }>;
}) {
  const sp = await props.searchParams;
  const filters: AuditFilters = {
    action: parseAction(sp.action),
    targetType: parseTarget(sp.target),
    q: sp.q?.trim() || undefined,
    limit: 200,
  };

  const result = await listAuditEntriesAction(filters);
  const entries: AuditEntry[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  const activeFilterCount = [
    filters.action,
    filters.targetType,
    filters.q,
  ].filter(Boolean).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Nhật ký kiểm toán"
        description="Mọi hành động quan trọng của quản trị viên đều được ghi lại để truy vết và đối chiếu khi có khiếu nại."
      />

      <div className="mb-4 rounded-lg bg-cream-100 px-4 py-3 text-xs text-ink-700">
        ℹ️ Backend chưa expose endpoint <code>/admin/audit-log</code> —
        đang dùng kho in-memory phía Manager. Mọi hành động (duyệt KYC, ban user,
        giải quyết khiếu nại…) được ghi tự động vào đây.
      </div>

      <form
        className="mb-5 rounded-2xl bg-white p-4 ring-1 ring-ink-200/60 shadow-card grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
        action="/admin/audit-log"
      >
        <div>
          <label
            htmlFor="action"
            className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1"
          >
            Loại hành động
          </label>
          <select
            id="action"
            name="action"
            defaultValue={filters.action ?? ''}
            className="h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          >
            <option value="">Tất cả</option>
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="target"
            className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1"
          >
            Đối tượng
          </label>
          <select
            id="target"
            name="target"
            defaultValue={filters.targetType ?? ''}
            className="h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          >
            <option value="">Tất cả</option>
            {TARGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="q"
            className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1"
          >
            Tìm theo tên / lý do
          </label>
          <input
            type="search"
            id="q"
            name="q"
            defaultValue={filters.q ?? ''}
            placeholder="VD: Lê Hoàng Đức, no-show…"
            className="h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="h-9 rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
          >
            Lọc
          </button>
          {activeFilterCount > 0 && (
            <Link
              href="/admin/audit-log"
              className="h-9 inline-flex items-center rounded-md border border-ink-200 px-3 text-sm text-ink-700 hover:bg-cream-100"
            >
              Xoá lọc
            </Link>
          )}
        </div>
      </form>

      {apiError && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          Không tải được nhật ký: {apiError}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-ink-200/60 shadow-card">
          <p className="text-2xl">📋</p>
          <p className="mt-2 text-sm font-medium text-ink-900">
            Không có entry phù hợp
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Thử điều chỉnh bộ lọc, hoặc thực hiện vài hành động ở /admin/kyc,
            /admin/users, /admin/disputes để sinh log mới.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink-200/60 shadow-card"
            >
              <div className="shrink-0">
                <Badge variant={ACTION_TONE[entry.action]}>
                  {AUDIT_ACTION_LABEL[entry.action]}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink-900">
                  <strong>{entry.actor.name}</strong> ·{' '}
                  <Link
                    href={AUDIT_TARGET_HREF[entry.target.type](entry.target.id)}
                    className="text-navy-700 hover:underline"
                  >
                    {entry.target.label}
                  </Link>
                </p>
                {entry.reason && (
                  <p className="mt-1 text-sm text-ink-700 italic">
                    Lý do: {entry.reason}
                  </p>
                )}
                <p className="mt-1 text-xs text-ink-500">
                  {relativeTime(entry.at)} · {formatDateTime(entry.at)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
