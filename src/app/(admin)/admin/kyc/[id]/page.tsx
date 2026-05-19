import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getKycAdminAction } from '@/app/actions/kyc-admin';
import { KycModerationActions } from '@/components/admin/kyc-moderation-actions';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export default async function AdminKycDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const result = await getKycAdminAction(id);
  if (!result.ok || result.data === null) notFound();
  const submission = result.data;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Duyệt KYC"
        title={submission.ownerName}
        description={`Hồ sơ ${submission.id} · Nộp lúc ${formatDateTime(submission.submittedAt)}`}
        breadcrumbs={[
          { label: 'Duyệt hồ sơ KYC', href: '/admin/kyc' },
          { label: submission.ownerName },
        ]}
        actions={<Badge variant="gold">{KYC_STATUS_LABEL[submission.status]}</Badge>}
      />

      {submission.status === 'rejected' && submission.rejectedReason && (
        <div className="mb-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          <p className="font-semibold">Đã từ chối — Lý do:</p>
          <p className="mt-1">{submission.rejectedReason}</p>
          {submission.rejectedAt && (
            <p className="mt-1 text-xs text-rose-600">
              Lúc {formatDateTime(submission.rejectedAt)}
            </p>
          )}
        </div>
      )}

      {submission.status === 'approved' && submission.approvedAt && (
        <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
          ✓ Đã duyệt lúc {formatDateTime(submission.approvedAt)}.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Thông tin chủ nhà
            </h2>
            <dl className="mt-4 grid gap-3 md:grid-cols-3">
              <div>
                <dt className="overline muted no-dash text-[10px]">Họ tên</dt>
                <dd className="mt-1 text-sm font-semibold text-ink-900">
                  {submission.ownerName}
                </dd>
              </div>
              <div>
                <dt className="overline muted no-dash text-[10px]">Email</dt>
                <dd className="mt-1 text-sm text-ink-900 break-all">
                  {submission.ownerEmail}
                </dd>
              </div>
              <div>
                <dt className="overline muted no-dash text-[10px]">
                  Số điện thoại
                </dt>
                <dd className="mt-1 text-sm text-ink-900">
                  {submission.ownerPhone}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              7 yếu tố xác minh
            </h2>
            <p className="mt-1 text-sm text-ink-700">
              Đối chiếu từng yếu tố. Tên trên STK, tên VNeID và tên CCCD phải
              trùng khớp.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {submission.fields.map((field) => (
                <KycFieldCard key={field.key} field={field} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
              <p className="overline muted no-dash text-[10px]">
                Hành động duyệt
              </p>
              <div className="mt-3">
                <KycModerationActions
                  submissionId={submission.id}
                  status={submission.status}
                />
              </div>
            </div>

            <Link href={`/admin/users?q=${submission.ownerId}`}>
              <Button variant="outline" className="w-full">
                👤 Xem hồ sơ chủ nhà
              </Button>
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
    pending: 'bg-cream-100 text-ink-700',
    matched: 'bg-emerald-100 text-emerald-800',
    mismatched: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
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
        <div className="mt-3 rounded-lg bg-cream-100 px-3 py-2 text-sm text-ink-900">
          {field.value ?? '— Chưa cung cấp —'}
        </div>
      )}
      {field.note && (
        <p className="mt-2 text-xs italic text-ink-500">{field.note}</p>
      )}
    </div>
  );
}

