'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  Building,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  Search,
  ShieldCheck,
  UserCog,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ClientPagination } from '@/components/ui/client-pagination';
import {
  AUDIT_ACTION_LABEL,
  AUDIT_TARGET_HREF,
  type AuditAction,
  type AuditEntry,
  type AuditTargetType,
} from '@/core/entities/audit-log';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useApiResource } from '@/lib/use-api-resource';

const PAGE_SIZE = 15;

const ACTION_VARIANT: Record<
  AuditAction,
  Parameters<typeof Badge>[0]['variant']
> = {
  kyc_approve: 'success',
  kyc_reject: 'danger',
  user_ban: 'danger',
  user_unban: 'success',
  user_revoke_sessions: 'warning',
  user_reset_password: 'info',
  user_change_plan: 'gold',
  user_change_role: 'gold',
  user_delete: 'danger',
  user_kyc_bypass_toggle: 'info',
  property_approve: 'success',
  property_reject: 'danger',
  property_suspend: 'warning',
  dispute_resolve: 'success',
  dispute_reject: 'default',
  dispute_investigate: 'info',
  review_hide: 'warning',
  review_restore: 'success',
  booking_mark_paid: 'success',
  subscription_trial_grant: 'gold',
  subscription_trial_revoke: 'warning',
  subscription_set_price: 'info',
  subscription_mark_paid: 'success',
  subscription_freeze: 'warning',
  subscription_unfreeze: 'success',
};

const TARGET_ICON: Record<AuditTargetType, typeof Bell> = {
  kyc: ShieldCheck,
  user: UserCog,
  property: Building,
  booking: CalendarCheck,
  dispute: AlertTriangle,
  subscription: CreditCard,
  review: MessageSquare,
};

const TARGET_COLOR: Record<AuditTargetType, string> = {
  kyc: 'bg-emerald-100 text-emerald-700',
  user: 'bg-navy-100 text-navy-700',
  property: 'bg-gold-100 text-gold-700',
  booking: 'bg-sky-100 text-sky-700',
  dispute: 'bg-rose-100 text-rose-700',
  subscription: 'bg-violet-100 text-violet-700',
  review: 'bg-amber-100 text-amber-700',
};

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'kyc', label: 'KYC' },
  { key: 'user', label: 'Người dùng' },
  { key: 'property', label: 'Cơ sở' },
  { key: 'dispute', label: 'Khiếu nại' },
  { key: 'review', label: 'Review' },
];

function buildHref(base: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Nhật ký kiểm toán fetch từ `/api/admin/audit-log` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Filter target/q (URL) + phân trang in-memory.
 */
export function AdminAuditLogClient({ target, q }: { target?: string; q?: string }) {
  const params = new URLSearchParams();
  if (target) params.set('target', target);
  if (q) params.set('q', q);
  const { loading, error, data } = useApiResource<AuditEntry[]>(
    `/api/admin/audit-log?${params.toString()}`,
  );
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [target, q]);

  const entries = data ?? [];
  const totalPages = Math.ceil(entries.length / PAGE_SIZE);
  const pageItems = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Không tải được thông báo: {error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = (target ?? '') === t.key;
            return (
              <Link
                key={t.key}
                href={buildHref('/admin/audit-log', {
                  target: t.key || undefined,
                  q,
                })}
                className={
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-all ' +
                  (active
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900')
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <form
          action="/admin/audit-log"
          method="get"
          className="relative max-w-xs w-full sm:w-auto"
        >
          {target && <input type="hidden" name="target" value={target} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tìm tên, lý do..."
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        </form>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <Bell className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-sm font-medium text-ink-700">Chưa có thông báo nào</p>
          <p className="mt-1 text-xs text-ink-500">
            Các hành động quản trị sẽ xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-px rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card overflow-hidden">
            {pageItems.map((entry, i) => {
              const Icon = TARGET_ICON[entry.target.type] ?? Bell;
              const iconColor =
                TARGET_COLOR[entry.target.type] ?? 'bg-cream-200 text-ink-500';
              const isLast = i === pageItems.length - 1;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex gap-4 px-5 py-4 transition-colors hover:bg-cream-50',
                    !isLast && 'border-b border-ink-100',
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      iconColor,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={ACTION_VARIANT[entry.action]}>
                        {AUDIT_ACTION_LABEL[entry.action]}
                      </Badge>
                      <span className="text-xs text-ink-400">
                        {relativeTime(entry.at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-800">
                      <strong className="text-ink-900">{entry.actor.name}</strong>
                      {' đã thao tác trên '}
                      <Link
                        href={AUDIT_TARGET_HREF[entry.target.type](
                          entry.target.id,
                        )}
                        className="font-medium text-navy-700 hover:underline"
                      >
                        {entry.target.label}
                      </Link>
                    </p>
                    {entry.reason && (
                      <p className="mt-1 text-sm text-ink-500 italic">
                        {entry.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <ClientPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={entries.length}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </>
  );
}
