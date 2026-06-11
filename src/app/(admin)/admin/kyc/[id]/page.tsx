import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, User } from 'lucide-react';

import { getKycAdminAction } from '@/app/actions/kyc-admin';
import { KycModerationActions } from '@/components/admin/kyc-moderation-actions';
import { Badge } from '@/components/ui/badge';
import { KYC_STATUS_LABEL } from '@/core/entities/kyc';
import {
  KYC_VERIFICATION_LABEL,
  type KycField,
  type KycPayment,
} from '@/core/entities/kyc-admin';
import { formatDateTime, formatVND } from '@/lib/format';
import { cn } from '@/lib/utils';

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const result = await getKycAdminAction(id);
  if (result.ok && result.data) {
    return { title: `KYC · ${result.data.ownerName}` };
  }
  return { title: 'Chi tiết KYC' };
}

const IMAGE_KEYS = new Set<KycField['key']>([
  'cccd_front',
  'cccd_back',
  'selfie',
]);

const STATUS_VARIANT: Record<string, Parameters<typeof Badge>[0]['variant']> = {
  draft: 'default',
  kyc_submitted: 'info',
  payment_pending: 'warning',
  paid: 'info',
  awaiting_approval: 'gold',
  approved: 'success',
  rejected: 'danger',
  refunded: 'default',
};

export default async function AdminKycDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const result = await getKycAdminAction(id);
  if (!result.ok || result.data === null) notFound();
  const s = result.data;

  const ownerName = s.ownerName.trim() || 'Chủ nhà chưa rõ tên';
  const ownerInitial = s.ownerName.trim().charAt(0).toUpperCase();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Back button + breadcrumb */}
      <Link
        href="/admin/kyc"
        className="group mb-6 inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Quay lại danh sách KYC
      </Link>

      {/* Header card */}
      <div className="mb-6 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cream-200 text-lg font-bold text-navy-800 uppercase">
              {ownerInitial || <User className="h-6 w-6 text-ink-400" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                  {ownerName}
                </h1>
                <Badge variant={STATUS_VARIANT[s.status] ?? 'default'}>
                  {KYC_STATUS_LABEL[s.status]}
                </Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {s.ownerEmail?.trim() || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {s.ownerPhone?.trim() || '—'}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-400">
                Nộp hồ sơ lúc {formatDateTime(s.submittedAt)}
                {typeof s.expectedRooms === 'number' && (
                  <> · Đăng ký {s.expectedRooms} phòng</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status alerts */}
      {s.status === 'rejected' && s.rejectedReason && (
        <div className="mb-6 rounded-xl bg-rose-50 px-5 py-4 ring-1 ring-rose-100">
          <p className="text-sm font-semibold text-rose-800">Đã từ chối</p>
          <p className="mt-1 text-sm text-rose-700">{s.rejectedReason}</p>
          {s.rejectedAt && (
            <p className="mt-1.5 text-xs text-rose-500">
              Lúc {formatDateTime(s.rejectedAt)}
            </p>
          )}
        </div>
      )}

      {s.status === 'approved' && s.approvedAt && (
        <div className="mb-6 rounded-xl bg-emerald-50 px-5 py-4 ring-1 ring-emerald-100">
          <p className="text-sm font-semibold text-emerald-800">Đã duyệt</p>
          <p className="mt-1 text-sm text-emerald-700">
            Hồ sơ được duyệt lúc {formatDateTime(s.approvedAt)}. Chủ nhà có thể
            tạo cơ sở và nhận booking.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Verification fields */}
        <section>
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-navy-900">
              Yếu tố xác minh
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">
              Đối chiếu từng yếu tố. Tên trên CCCD và ảnh chân dung phải trùng
              khớp với thông tin chủ nhà.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {s.fields.map((field) => (
              <KycFieldCard key={field.key} field={field} />
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside>
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Hành động
              </p>
              <div className="mt-3">
                <KycModerationActions
                  submissionId={s.id}
                  status={s.status}
                />
              </div>
            </div>

            {s.payment && <PaymentCard payment={s.payment} />}

            {s.ownerId && (
              <Link
                href={`/admin/users/${s.ownerId}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink-200/60 shadow-card transition-all hover:ring-navy-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-200">
                  <User className="h-5 w-5 text-ink-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    Xem hồ sơ chủ nhà
                  </p>
                  <p className="text-xs text-ink-500 truncate">
                    {s.ownerEmail?.trim() || ownerName}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function KycFieldCard({ field }: { field: KycField }) {
  const isImage = IMAGE_KEYS.has(field.key);
  const verifClass: Record<KycField['verification'], string> = {
    pending: 'bg-cream-200 text-ink-600',
    matched: 'bg-emerald-100 text-emerald-800',
    mismatched: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-ink-200/60 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-ink-900">{field.label}</p>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            verifClass[field.verification],
          )}
        >
          {KYC_VERIFICATION_LABEL[field.verification]}
        </span>
      </div>
      {isImage && field.value ? (
        <div className="relative mt-3 aspect-video overflow-hidden rounded-lg bg-cream-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={field.value}
            alt={field.label}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="mt-3 rounded-lg bg-cream-50 px-3 py-2.5 text-sm text-ink-900 ring-1 ring-ink-100">
          {field.value ?? '— Chưa cung cấp —'}
        </div>
      )}
      {field.note && (
        <p className="mt-2 text-xs italic text-ink-500">{field.note}</p>
      )}
    </div>
  );
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
  expired: 'Hết hạn',
};

function PaymentCard({ payment }: { payment: KycPayment }) {
  const rows: { label: string; value: string }[] = [];
  if (payment.planId) rows.push({ label: 'Gói', value: payment.planId });
  if (typeof payment.rooms === 'number')
    rows.push({ label: 'Số phòng', value: String(payment.rooms) });
  if (payment.cycle) rows.push({ label: 'Chu kỳ', value: payment.cycle });
  if (payment.method) rows.push({ label: 'Phương thức', value: payment.method });
  if (payment.paidAt)
    rows.push({ label: 'Thanh toán lúc', value: formatDateTime(payment.paidAt) });

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
          Gói &amp; thanh toán
        </p>
        {payment.status && (
          <Badge
            variant={payment.status === 'paid' ? 'success' : 'warning'}
          >
            {PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}
          </Badge>
        )}
      </div>
      {typeof payment.totalAmount === 'number' && (
        <p className="mt-3 font-display text-2xl font-semibold text-navy-900">
          {formatVND(payment.totalAmount)}
        </p>
      )}
      {rows.length > 0 && (
        <dl className="mt-3 space-y-1.5 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-3">
              <dt className="text-ink-500">{r.label}</dt>
              <dd className="text-right font-medium text-ink-900">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
