'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Phone, ShieldCheck, User } from 'lucide-react';

import {
  KycPaymentsSection,
  KycUploadsSection,
  KycVerificationSection,
} from '@/components/admin/kyc-detail-sections';
import { KycModerationActions } from '@/components/admin/kyc-moderation-actions';
import { Badge } from '@/components/ui/badge';
import { KYC_STATUS_LABEL } from '@/core/entities/kyc';
import type { KycAdminDetail } from '@/core/entities/kyc-admin';
import { displayName, formatDateTime } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

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

/**
 * Chi tiết KYC fetch từ `/api/admin/kyc/:id` PHÍA CLIENT → endpoint hiện trong
 * F12 Network. Loading/error/not-found ở client.
 */
export function AdminKycDetailClient({ id }: { id: string }) {
  const { loading, error, data } = useApiResource<KycAdminDetail>(
    `/api/admin/kyc/${id}`,
  );

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-500">Đang tải…</div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
        {error ?? 'Không tìm thấy hồ sơ KYC'}
      </div>
    );
  }

  const s = data;
  const ownerName = displayName(s.user.name, s.user.email);
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  return (
    <>
      <Link
        href="/admin/kyc"
        className="group mb-6 inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Quay lại danh sách KYC
      </Link>

      <div className="mb-6 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cream-200 text-lg font-bold text-navy-800 uppercase">
            {ownerInitial || <User className="h-6 w-6 text-ink-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                {ownerName}
              </h1>
              <Badge variant={STATUS_VARIANT[s.status] ?? 'default'}>
                {s.statusLabel?.trim() || KYC_STATUS_LABEL[s.status]}
              </Badge>
              {s.user.kycBypass && (
                <Badge variant="navy">
                  <ShieldCheck className="mr-1 h-3 w-3" /> Bỏ qua KYC
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-600">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {s.user.email?.trim() || '—'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {s.user.phone?.trim() || '—'}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-400">
              Nộp hồ sơ lúc {formatDateTime(s.createdAt)}
              {typeof s.expectedRooms === 'number' && (
                <> · Đăng ký {s.expectedRooms} phòng</>
              )}
            </p>
          </div>
        </div>
      </div>

      {s.status === 'rejected' && s.rejectReason && (
        <div className="mb-6 rounded-xl bg-rose-50 px-5 py-4 ring-1 ring-rose-100">
          <p className="text-sm font-semibold text-rose-800">Đã từ chối</p>
          <p className="mt-1 text-sm text-rose-700">{s.rejectReason}</p>
          {s.rejectedItems.length > 0 && (
            <p className="mt-1.5 text-xs text-rose-500">
              Mục bị từ chối: {s.rejectedItems.join(', ')}
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <KycVerificationSection
            fields={s.verificationFields}
            passedCount={s.verificationPassedCount}
            totalCount={s.verificationTotalCount}
          />
          <KycUploadsSection uploads={s.uploads} />
          <KycPaymentsSection payments={s.payments} />
        </div>

        <aside>
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Hành động
              </p>
              <div className="mt-3">
                <KycModerationActions submissionId={s.id} status={s.status} />
              </div>
            </div>

            {s.userId && (
              <Link
                href={`/admin/users/${s.userId}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink-200/60 shadow-card transition-all hover:ring-navy-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-200">
                  <User className="h-5 w-5 text-ink-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    Xem hồ sơ chủ nhà
                  </p>
                  <p className="truncate text-xs text-ink-500">
                    {s.user.email?.trim() || ownerName}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
