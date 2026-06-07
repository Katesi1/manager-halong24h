import type { Metadata } from 'next';
import Link from 'next/link';

import { getMySubscriptionAction } from '@/app/actions/subscriptions';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Gói cước' };
import {
  PLAN_LABEL,
  PRICE_PER_ROOM,
  type SubscriptionStatus,
} from '@/core/entities/subscription';
import { blockedReason } from '@/lib/subscription-guard';
import { formatDate, formatVND } from '@/lib/format';

const STATUS_VARIANT: Record<
  SubscriptionStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  none: 'default',
  trial: 'gold',
  active: 'success',
  past_due: 'danger',
  cancelled: 'default',
  frozen: 'dark',
  expired: 'warning',
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  none: 'Chưa có',
  trial: 'Đang trial',
  active: 'Đang hoạt động',
  past_due: 'Quá hạn',
  cancelled: 'Đã huỷ',
  frozen: 'Đã khoá',
  expired: 'Hết hạn',
};

export default async function HostSubscriptionPage() {
  const result = await getMySubscriptionAction();
  const sub = result.ok ? result.data : null;
  const blocked = blockedReason(sub);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Tài khoản & cài đặt"
        title="Gói cước Halong24h"
        description="Halong24h thu phí cố định mỗi phòng/tháng. Khách trả tiền trực tiếp cho bạn — chúng tôi không lấy hoa hồng trên booking."
        breadcrumbs={[
          { label: 'Cài đặt', href: '/host/settings' },
          { label: 'Gói cước' },
        ]}
      />

      {!sub ? (
        <div className="rounded-2xl bg-cream-100 p-8 text-center">
          <p className="text-2xl">🎁</p>
          <p className="mt-2 text-sm font-medium text-ink-900">
            Bạn đang ở gói Miễn phí
          </p>
          <p className="mt-1 text-xs text-ink-600 max-w-md mx-auto">
            Áp dụng tự động cho 1-3 phòng. Khi thêm phòng thứ 4, hệ thống sẽ tự
            sinh hoá đơn gói Cơ bản (50.000 ₫/phòng/tháng).
          </p>
        </div>
      ) : (
        <>
          {blocked && (
            <div className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
              ⚠️ <strong>Gói cước bị chặn:</strong> {blocked}
            </div>
          )}

          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="overline muted no-dash text-[10px]">Gói hiện tại</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-navy-900">
                  {PLAN_LABEL[sub.plan]}
                </h2>
                <p className="mt-1 text-xs text-ink-600">
                  Kỳ {sub.cycle === 'yearly' ? 'năm' : 'tháng'} ·{' '}
                  {sub.roomCount} phòng · {formatVND(PRICE_PER_ROOM[sub.plan])}
                  /phòng/tháng
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[sub.status]}>
                {STATUS_LABEL[sub.status]}
              </Badge>
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              <Detail label="Tổng kỳ này" value={formatVND(sub.amount)} />
              <Detail label="Bắt đầu" value={formatDate(sub.startAt)} />
              <Detail
                label="Hết hạn"
                value={formatDate(sub.expireAt)}
                hint={sub.status === 'past_due' ? '⚠️ Đã quá hạn' : undefined}
              />
              {sub.paidAt && (
                <Detail label="Đã thu" value={formatDate(sub.paidAt)} />
              )}
              <Detail label="Hoá đơn" value={formatDate(sub.invoicedAt)} />
            </dl>

            {sub.note && sub.status === 'frozen' && (
              <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
                <p className="font-semibold">Lý do khoá:</p>
                <p className="mt-1">{sub.note}</p>
              </div>
            )}

            {(sub.status === 'past_due' || sub.status === 'trial') && (
              <div className="mt-5 rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
                <p className="text-sm font-semibold text-amber-900">
                  Chuyển khoản phí gói cước
                </p>
                <p className="mt-2 text-xs text-amber-800 leading-relaxed">
                  STK: <strong className="font-mono">9999-1234-5678-90</strong>{' '}
                  · Ngân hàng MBBank · Chủ TK: Halong24h JSC
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Nội dung CK: <strong>{sub.id}</strong>
                </p>
                <p className="mt-2 text-[11px] text-amber-700">
                  Sau khi chuyển, gọi 0900-xxxxx hoặc chat để admin ghi nhận.
                  Trong tương lai sẽ tự động xác nhận qua webhook bank.
                </p>
              </div>
            )}

            <div className="mt-5">
              <Link
                href="/host/settings"
                className="text-sm font-semibold text-navy-700 hover:underline"
              >
                ← Về Cài đặt
              </Link>
            </div>
          </section>

          <p className="mt-5 text-xs text-ink-500">
            Bảng giá: Miễn phí (1-3 phòng: 0 ₫) · Cơ bản (4-10:
            50.000 ₫/phòng) · Tiêu chuẩn (11-30: 40.000 ₫/phòng) · Chuyên
            nghiệp (31+: 30.000 ₫/phòng). Trả theo năm giảm 20%.
          </p>
        </>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="overline muted no-dash text-[10px]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink-900">{value}</dd>
      {hint && <p className="mt-0.5 text-[10px] text-rose-700">{hint}</p>}
    </div>
  );
}
