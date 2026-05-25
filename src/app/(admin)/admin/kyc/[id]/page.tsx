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
} from '@/core/entities/kyc-admin';
import { formatDateTime } from '@/lib/format';
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
  'business_license',
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
              {s.ownerName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                  {s.ownerName}
                </h1>
                <Badge variant={STATUS_VARIANT[s.status] ?? 'default'}>
                  {KYC_STATUS_LABEL[s.status]}
                </Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {s.ownerEmail}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {s.ownerPhone}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-ink-400" />
                  <span className="font-mono text-xs text-ink-400">{s.ownerId}</span>
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-400">
                Nộp hồ sơ lúc {formatDateTime(s.submittedAt)}
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
              7 yếu tố xác minh
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">
              Đối chiếu từng yếu tố. Tên trên STK, VNeID và CCCD phải trùng khớp.
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

            <Link
              href={`/admin/users?q=${s.ownerId}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink-200/60 shadow-card transition-all hover:ring-navy-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-200">
                <User className="h-5 w-5 text-ink-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">
                  Xem hồ sơ chủ nhà
                </p>
                <p className="text-xs text-ink-500 truncate">{s.ownerEmail}</p>
              </div>
            </Link>
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
