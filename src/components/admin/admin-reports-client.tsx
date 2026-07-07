'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import {
  DISPUTE_STATUS_LABEL,
  DISPUTE_TYPE_ICON,
  type Dispute,
  type DisputeStatus,
} from '@/core/entities/dispute';
import {
  RISK_RANGES,
  RISK_RANGE_LABEL,
  type RiskKpis,
  type RiskMetric,
  type RiskRange,
} from '@/core/entities/risk-kpi';
import { formatDate, formatVND } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

type Tone = 'danger' | 'warning' | 'info' | 'success';
type Kind = 'count' | 'rate' | 'money';

const TONE_VALUE: Record<Tone, string> = {
  danger: 'text-rose-600',
  warning: 'text-amber-600',
  info: 'text-navy-700',
  success: 'text-emerald-600',
};

const TONE_DOT: Record<Tone, string> = {
  danger: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-navy-600',
  success: 'bg-emerald-500',
};

interface CardCfg {
  key: string;
  label: string;
  hint: string;
  href: string;
  cta: string;
  tone: Tone;
  kind: Kind;
  metric: RiskMetric;
  hideDelta?: boolean;
  goodWhenUp?: boolean;
}

function formatMetric(kind: Kind, value: number): string {
  if (kind === 'money') return formatVND(value);
  if (kind === 'rate') return `${value.toFixed(1)}%`;
  return String(value);
}

function deltaInfo(
  cfg: CardCfg,
): { text: string; up: boolean; good: boolean } | null {
  if (cfg.hideDelta) return null;
  const { value, prev } = cfg.metric;
  const raw = value - prev;
  if (raw === 0) return null;
  let text: string;
  if (cfg.kind === 'rate') {
    text = `${Math.abs(raw).toFixed(1)}pp`;
  } else if (cfg.kind === 'money') {
    if (prev === 0) return null;
    text = `${Math.abs((raw / prev) * 100).toFixed(0)}%`;
  } else {
    text = String(Math.abs(raw));
  }
  const up = raw > 0;
  const good = cfg.goodWhenUp ? up : !up;
  return { text, up, good };
}

function disputeBadge(status: DisputeStatus) {
  const variant: Parameters<typeof Badge>[0]['variant'] =
    status === 'open'
      ? 'danger'
      : status === 'investigating'
        ? 'warning'
        : status === 'resolved'
          ? 'success'
          : 'default';
  return <Badge variant={variant}>{DISPUTE_STATUS_LABEL[status]}</Badge>;
}

function cancelFlag(rate: number) {
  if (rate >= 10) return <Badge variant="danger">Cao</Badge>;
  if (rate >= 5) return <Badge variant="warning">Trung bình</Badge>;
  return <Badge variant="success">Thấp</Badge>;
}

function KpiCard({ cfg }: { cfg: CardCfg }) {
  const delta = deltaInfo(cfg);
  return (
    <Link
      href={cfg.href}
      className="group flex flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60 transition-shadow hover:shadow-lg"
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${TONE_DOT[cfg.tone]}`} />
        <p className="overline muted no-dash text-[10px]">{cfg.label}</p>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p
          className={`font-display text-[1.9rem] font-semibold leading-none tracking-tight ${TONE_VALUE[cfg.tone]}`}
        >
          {formatMetric(cfg.kind, cfg.metric.value)}
        </p>
        {delta && (
          <span
            className={
              'text-xs font-semibold ' +
              (delta.good ? 'text-emerald-700' : 'text-rose-600')
            }
            title="So với kỳ liền trước cùng độ dài"
          >
            {delta.up ? '↑' : '↓'} {delta.text}
          </span>
        )}
      </div>
      <p className="mt-1.5 flex-1 text-xs leading-snug text-ink-500">{cfg.hint}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-navy-700 group-hover:gap-1.5">
        {cfg.cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function buildCards(k: RiskKpis): CardCfg[] {
  return [
    { key: 'disputes', label: 'Dispute đang mở', hint: 'Khiếu nại mở/đang xử lý phát sinh trong kỳ', href: '/admin/disputes', cta: 'Xem khiếu nại', tone: 'danger', kind: 'count', metric: k.disputesOpen },
    { key: 'hostCancel', label: 'Chủ huỷ sau confirmed', hint: 'Tỉ lệ chủ/sale/admin huỷ trên booking đã cọc', href: '/admin/bookings', cta: 'Xem booking', tone: 'warning', kind: 'rate', metric: k.hostCancelRate },
    { key: 'noShow', label: 'Khách no-show', hint: 'Tỉ lệ khách đã cọc nhưng không đến nhận phòng', href: '/admin/bookings?status=no_show', cta: 'Xem booking', tone: 'warning', kind: 'rate', metric: k.noShowRate },
    { key: 'flagged', label: 'Review bị gắn cờ', hint: 'Đánh giá bị report spam / giả / vi phạm trong kỳ', href: '/admin/reviews', cta: 'Kiểm duyệt', tone: 'warning', kind: 'count', metric: k.flaggedReviews },
    { key: 'deletion', label: 'Yêu cầu xoá account', hint: 'Số yêu cầu xoá tài khoản nhận trong kỳ (NĐ 13)', href: '/admin/users', cta: 'Xem người dùng', tone: 'info', kind: 'count', metric: k.deletionRequests },
    { key: 'kyc', label: 'KYC chờ duyệt', hint: 'Hồ sơ chủ nhà chờ admin xác minh', href: '/admin/kyc', cta: 'Duyệt hồ sơ', tone: 'info', kind: 'count', metric: k.kycPending },
    { key: 'overdue', label: 'Subscription quá hạn', hint: 'Chủ nhà đang nợ phí gói cước (snapshot hiện tại)', href: '/admin/payments', cta: 'Xem gói cước', tone: 'danger', kind: 'count', metric: k.subscriptionOverdue, hideDelta: true },
    { key: 'revenue', label: 'Doanh thu đã thu', hint: 'Phí gói cước chủ nhà đã thanh toán trong kỳ', href: '/admin/payments', cta: 'Đối soát', tone: 'success', kind: 'money', metric: k.revenuePaid, goodWhenUp: true },
  ];
}

interface ReportsData {
  kpis: RiskKpis | null;
  kpiError: string | null;
  recentDisputes: Dispute[];
}

/**
 * Báo cáo rủi ro fetch từ `/api/admin/reports` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Range theo URL.
 */
export function AdminReportsClient({ range }: { range: RiskRange }) {
  const { loading, error, data } = useApiResource<ReportsData>(
    `/api/admin/reports?range=${range}`,
  );

  const k = data?.kpis ?? null;
  const kpiError = data?.kpiError ?? error;
  const recentDisputes = data?.recentDisputes ?? [];
  const cards = k ? buildCards(k) : [];

  return (
    <>
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Báo cáo & Phân tích"
        description={`Chỉ số rủi ro vận hành trong ${k?.rangeDays ?? RISK_RANGE_LABEL[range]} ngày, so với kỳ liền trước. Dữ liệu thật từ Dispute, Booking, Review, KYC & Subscription.`}
        breadcrumbs={[{ label: 'Quản trị' }, { label: 'Báo cáo & Phân tích' }]}
        actions={
          <div className="flex flex-wrap gap-1.5">
            {RISK_RANGES.map((r) => {
              const active = r === range;
              return (
                <Link
                  key={r}
                  href={`/admin/reports?range=${r}`}
                  className={
                    'inline-flex h-9 items-center rounded-[10px] px-3 text-sm font-semibold transition-colors ' +
                    (active
                      ? 'bg-navy-900 text-white'
                      : 'bg-white text-ink-900 ring-1 ring-ink-200 hover:bg-cream-100')
                  }
                >
                  {RISK_RANGE_LABEL[r]}
                </Link>
              );
            })}
          </div>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>
      ) : (
        <>
          {kpiError && (
            <div className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
              Không tải được chỉ số rủi ro: {kpiError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((cfg) => (
              <KpiCard key={cfg.key} cfg={cfg} />
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
                    Top chủ huỷ sau confirmed
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    Chủ nhà có tỉ lệ tự huỷ cao nhất trong kỳ.
                  </p>
                </div>
                <Badge variant="warning">Cảnh báo</Badge>
              </div>
              <div className="mt-4 overflow-x-auto">
                {!k || k.topHostCancel.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">
                    Không có chủ nhà nào huỷ booking trong kỳ. 🎉
                  </p>
                ) : (
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-ink-500">
                        <th className="px-3 py-2 font-medium">Chủ nhà</th>
                        <th className="px-3 py-2 font-medium">Booking</th>
                        <th className="px-3 py-2 font-medium">Huỷ</th>
                        <th className="px-3 py-2 font-medium">Tỉ lệ</th>
                        <th className="px-3 py-2 font-medium">Mức</th>
                      </tr>
                    </thead>
                    <tbody>
                      {k.topHostCancel.map((row) => (
                        <tr
                          key={row.ownerId || row.name}
                          className="border-t border-ink-100 align-middle"
                        >
                          <td className="px-3 py-3">
                            {row.ownerId ? (
                              <Link
                                href={`/admin/users/${row.ownerId}`}
                                className="font-semibold text-ink-900 hover:text-navy-900 hover:underline"
                              >
                                {row.name || '—'}
                              </Link>
                            ) : (
                              <p className="font-semibold text-ink-900">
                                {row.name || '—'}
                              </p>
                            )}
                            <p className="text-[11px] text-ink-500">
                              {row.propertyCount} cơ sở
                            </p>
                          </td>
                          <td className="px-3 py-3 text-ink-700">
                            {row.bookingCount}
                          </td>
                          <td className="px-3 py-3 text-ink-700">
                            {row.cancelCount}
                          </td>
                          <td className="px-3 py-3 font-semibold text-ink-900">
                            {row.cancelRate.toFixed(1)}%
                          </td>
                          <td className="px-3 py-3">
                            {cancelFlag(row.cancelRate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
                    Dispute đang chờ
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    Khiếu nại mới mở hoặc đang xử lý.
                  </p>
                </div>
                <Link
                  href="/admin/disputes"
                  className="shrink-0 text-sm font-semibold text-navy-900 hover:underline"
                >
                  Xem tất cả →
                </Link>
              </div>
              <div className="mt-4 space-y-2">
                {recentDisputes.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">
                    Không có khiếu nại nào đang chờ. 🎉
                  </p>
                ) : (
                  recentDisputes.map((d) => (
                    <Link
                      key={d.id}
                      href={`/admin/disputes/${d.id}`}
                      className="block rounded-xl border border-ink-100 p-3 transition-colors hover:bg-cream-50"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-mono text-xs font-semibold text-ink-900">
                          {DISPUTE_TYPE_ICON[d.type]}{' '}
                          {d.bookingCode || d.id.slice(0, 8)}
                        </p>
                        {disputeBadge(d.status)}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-ink-900">
                        {d.subject}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-500">
                        {d.propertyName} · mở {formatDate(d.createdAt)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
