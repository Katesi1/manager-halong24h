'use client';

import Link from 'next/link';

import { DisputeResolutionForm } from '@/components/admin/dispute-resolution-form';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import {
  DISPUTE_PENALTY_LABEL,
  DISPUTE_STATUS_LABEL,
  DISPUTE_TYPE_ICON,
  DISPUTE_TYPE_LABEL,
  VERDICT_LABEL,
  type Dispute,
  type DisputeStatus,
} from '@/core/entities/dispute';
import { formatDateTime, formatVND } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

const STATUS_VARIANT: Record<
  DisputeStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  open: 'warning',
  investigating: 'info',
  resolved: 'success',
  rejected: 'default',
};

/**
 * Chi tiết khiếu nại fetch từ `/api/admin/disputes/:id` PHÍA CLIENT → endpoint
 * hiện trong F12 Network. Loading/error/not-found ở client.
 */
export function AdminDisputeDetailClient({ id }: { id: string }) {
  const { loading, error, data } = useApiResource<Dispute>(
    `/api/admin/disputes/${id}`,
  );

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-500">Đang tải…</div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
        {error ?? 'Không tìm thấy khiếu nại'}
      </div>
    );
  }

  const dispute = data;

  return (
    <>
      <PageHeader
        backHref="/admin/disputes"
        backLabel="Quay lại danh sách khiếu nại"
        eyebrow={`${DISPUTE_TYPE_ICON[dispute.type]} ${DISPUTE_TYPE_LABEL[dispute.type]}`}
        title={dispute.subject}
        description={`Khiếu nại ${dispute.id} · Đặt phòng ${dispute.bookingCode} · ${formatDateTime(dispute.createdAt)}`}
        breadcrumbs={[
          { label: 'Khiếu nại', href: '/admin/disputes' },
          { label: dispute.id },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[dispute.status]}>
              {DISPUTE_STATUS_LABEL[dispute.status]}
            </Badge>
            {dispute.priority === 'high' && (
              <Badge variant="danger">⚡ Ưu tiên cao</Badge>
            )}
          </div>
        }
      />

      {dispute.status === 'resolved' && (
        <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-100">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            <span>✓ Đã phán quyết</span>
            {dispute.verdict && <span>· {VERDICT_LABEL[dispute.verdict]}</span>}
            {dispute.penaltyAction && dispute.penaltyAction !== 'none' && (
              <Badge variant="danger">
                Xử phạt: {DISPUTE_PENALTY_LABEL[dispute.penaltyAction]}
              </Badge>
            )}
            {dispute.penalty && dispute.penalty.refundAmount && (
              <span>· Hoàn {formatVND(dispute.penalty.refundAmount)}</span>
            )}
          </p>
          {dispute.resolution && (
            <p className="mt-2 whitespace-pre-line">{dispute.resolution}</p>
          )}
          {dispute.resolvedAt && (
            <p className="mt-1 text-xs text-emerald-700">
              Bởi {dispute.resolvedBy?.name} · {formatDateTime(dispute.resolvedAt)}
            </p>
          )}
        </div>
      )}

      {dispute.status === 'rejected' && dispute.resolution && (
        <div className="mb-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-100">
          <p className="font-semibold">✕ Đã bác bỏ — Lý do:</p>
          <p className="mt-1 whitespace-pre-line">{dispute.resolution}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Mô tả
            </h2>
            <p className="mt-3 text-sm text-ink-700 leading-relaxed whitespace-pre-line">
              {dispute.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
              {dispute.amount && (
                <span className="font-semibold text-amber-700">
                  💰 Số tiền tranh chấp: {formatVND(dispute.amount)}
                </span>
              )}
              <span className="text-ink-500">
                Mở bởi <strong>{dispute.opener.name}</strong> (
                {dispute.opener.role === 'customer'
                  ? 'khách'
                  : dispute.opener.role === 'owner'
                    ? 'chủ nhà'
                    : 'admin'}
                )
              </span>
            </div>
          </section>

          {dispute.chatExcerpts.length > 0 && (
            <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                Đoạn chat trích dẫn ({dispute.chatExcerpts.length})
              </h2>
              <p className="mt-1 text-sm text-ink-700">
                {dispute.chatExcerpts.length} tin nhắn mới nhất của cuộc trò
                chuyện khách ↔ chủ nhà (cũ → mới) — làm bằng chứng cho phán quyết.
              </p>
              <ul className="mt-5 space-y-3">
                {dispute.chatExcerpts.map((c) => {
                  if (c.isSystem) {
                    return (
                      <li key={c.id} className="flex justify-center">
                        <div className="max-w-[90%] rounded-full bg-ink-100 px-3 py-1.5 text-center text-[11px] text-ink-600">
                          {c.content}
                          <span className="ml-1.5 text-ink-400">
                            {formatDateTime(c.createdAt)}
                          </span>
                        </div>
                      </li>
                    );
                  }
                  const isCustomer = c.senderId === dispute.customer.id;
                  const senderName = isCustomer
                    ? dispute.customer.name
                    : dispute.owner.name;
                  const senderLabel = isCustomer ? 'Khách' : 'Chủ nhà';
                  return (
                    <li
                      key={c.id}
                      className={'flex gap-3 ' + (isCustomer ? '' : 'flex-row-reverse')}
                    >
                      <div
                        className={
                          'grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white ' +
                          (isCustomer ? 'bg-ink-700' : 'bg-navy-900')
                        }
                      >
                        {(senderName || senderLabel).slice(0, 1).toUpperCase()}
                      </div>
                      <div className={'max-w-[80%] ' + (isCustomer ? '' : 'text-right')}>
                        <p className="text-[11px] font-medium text-ink-500">
                          {senderName || senderLabel} ·{' '}
                          <span className="text-ink-700">{senderLabel}</span> ·{' '}
                          {formatDateTime(c.createdAt)}
                        </p>
                        <div
                          className={
                            'mt-1 rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ' +
                            (isCustomer
                              ? 'bg-cream-100 text-ink-900 rounded-tl-sm'
                              : 'bg-navy-50 text-navy-900 rounded-tr-sm')
                          }
                        >
                          {c.content}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {dispute.evidence.length > 0 && (
            <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                Bằng chứng ({dispute.evidence.length})
              </h2>
              <p className="mt-1 text-sm text-ink-700">Ảnh / file 2 bên upload.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {dispute.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-ink-200 bg-white p-3"
                  >
                    {ev.type === 'image' && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ev.url}
                        alt={ev.caption ?? ''}
                        className="block w-full rounded-lg border border-ink-200 bg-cream-100"
                      />
                    )}
                    {ev.caption && (
                      <p className="mt-2 text-xs text-ink-700">{ev.caption}</p>
                    )}
                    <p className="mt-1 text-[11px] text-ink-500">
                      Upload bởi <strong>{ev.uploadedBy.name}</strong> ·{' '}
                      {formatDateTime(ev.uploadedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
              <p className="overline muted no-dash text-[10px]">Các bên</p>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-500">
                    Khách
                  </p>
                  <Link
                    href={`/admin/users/${dispute.customer.id}`}
                    className="mt-1 block text-sm font-semibold text-ink-900 hover:underline"
                  >
                    {dispute.customer.name}
                  </Link>
                  <p className="text-xs text-ink-500 break-all">
                    {dispute.customer.email}
                  </p>
                  <p className="text-xs text-ink-500">
                    {dispute.customer.phone ?? '—'}
                  </p>
                </div>
                <hr className="border-ink-200" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-500">
                    Chủ nhà
                  </p>
                  <Link
                    href={`/admin/users/${dispute.owner.id}`}
                    className="mt-1 block text-sm font-semibold text-ink-900 hover:underline"
                  >
                    {dispute.owner.name}
                  </Link>
                  <p className="text-xs text-ink-500 break-all">
                    {dispute.owner.email}
                  </p>
                  <p className="text-xs text-ink-500">
                    {dispute.owner.phone ?? '—'}
                  </p>
                </div>
                <hr className="border-ink-200" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-500">
                    Cơ sở
                  </p>
                  <Link
                    href={`/admin/properties/${dispute.propertyId}`}
                    className="mt-1 block text-sm font-semibold text-ink-900 hover:underline"
                  >
                    {dispute.propertyName}
                  </Link>
                  {dispute.propertyCode && (
                    <p className="text-xs text-ink-500">
                      Mã: {dispute.propertyCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
              <p className="overline muted no-dash text-[10px]">
                Phán quyết của admin
              </p>
              <div className="mt-3">
                <DisputeResolutionForm
                  disputeId={dispute.id}
                  status={dispute.status}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
