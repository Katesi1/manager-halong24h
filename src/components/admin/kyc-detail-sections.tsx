import Image from 'next/image';
import { Check, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type {
  KycPayment,
  KycUploadDetail,
  KycUploadSet,
  KycVerificationField,
} from '@/core/entities/kyc-admin';
import { formatDateTime, formatVND } from '@/lib/format';
import { cn } from '@/lib/utils';

const UPLOAD_LABELS: { key: keyof KycUploadSet; label: string }[] = [
  { key: 'cccdFront', label: 'CCCD mặt trước' },
  { key: 'cccdBack', label: 'CCCD mặt sau' },
  { key: 'selfie', label: 'Ảnh chân dung (selfie)' },
];

/** Điểm số 0–1 → phần trăm; bỏ qua nếu không phải số. */
function scoreNote(up: KycUploadDetail): string | null {
  const parts: string[] = [];
  if (typeof up.ocrConfidence === 'number')
    parts.push(`OCR ${Math.round(up.ocrConfidence * 100)}%`);
  if (typeof up.faceMatchScore === 'number')
    parts.push(`Khớp mặt ${Math.round(up.faceMatchScore * 100)}%`);
  if (typeof up.livenessScore === 'number')
    parts.push(`Liveness ${Math.round(up.livenessScore * 100)}%`);
  return parts.length ? parts.join(' · ') : null;
}

function UploadCard({
  label,
  upload,
}: {
  label: string;
  upload: KycUploadDetail | null;
}) {
  const note = upload ? scoreNote(upload) : null;
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-ink-200/60 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-ink-900">{label}</p>
      {upload?.imageUrl ? (
        <a
          href={upload.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-[3/2] overflow-hidden rounded-lg bg-cream-100 ring-1 ring-ink-100 hover:opacity-90"
        >
          <Image
            src={upload.imageUrl}
            alt={label}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className="object-cover"
            unoptimized
          />
        </a>
      ) : (
        <div className="flex aspect-[3/2] items-center justify-center rounded-lg bg-cream-50 text-xs text-ink-400 ring-1 ring-ink-100">
          Chưa tải ảnh
        </div>
      )}
      {note && <p className="mt-2 text-xs italic text-ink-500">{note}</p>}
      {upload?.provider && (
        <p className="mt-0.5 text-[11px] text-ink-400">
          Nhà cung cấp: {upload.provider}
        </p>
      )}
    </div>
  );
}

export function KycUploadsSection({ uploads }: { uploads: KycUploadSet }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold text-navy-900">
        Ảnh hồ sơ
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {UPLOAD_LABELS.map(({ key, label }) => (
          <UploadCard key={key} label={label} upload={uploads[key]} />
        ))}
      </div>
    </section>
  );
}

export function KycVerificationSection({
  fields,
  passedCount,
  totalCount,
}: {
  fields: KycVerificationField[];
  passedCount: number;
  totalCount: number;
}) {
  const allPassed = totalCount > 0 && passedCount >= totalCount;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-navy-900">
          Checklist xác minh tự động
        </h2>
        <Badge variant={allPassed ? 'success' : 'warning'}>
          {passedCount}/{totalCount} đạt
        </Badge>
      </div>
      {fields.length === 0 ? (
        <p className="rounded-xl bg-cream-100 px-4 py-3 text-sm text-ink-600">
          Chưa có dữ liệu xác minh.
        </p>
      ) : (
        <ul className="space-y-2">
          {fields.map((f) => (
            <li
              key={f.key}
              className="flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-ink-200/60 shadow-sm"
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                  f.passed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700',
                )}
              >
                {f.passed ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900">{f.label}</p>
                {f.source && (
                  <p className="mt-0.5 text-xs text-ink-500">{f.source}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
  expired: 'Hết hạn',
};

export function KycPaymentsSection({ payments }: { payments: KycPayment[] }) {
  if (payments.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold text-navy-900">
        Thanh toán
      </h2>
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-ink-200/60 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Gói</th>
              <th className="px-4 py-2.5 font-semibold">Số phòng</th>
              <th className="px-4 py-2.5 font-semibold">Số tiền</th>
              <th className="px-4 py-2.5 font-semibold">Phương thức</th>
              <th className="px-4 py-2.5 font-semibold">Trạng thái</th>
              <th className="px-4 py-2.5 font-semibold">Thanh toán lúc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {payments.map((p, i) => (
              <tr key={p.id ?? `${p.planId}-${i}`} className="text-ink-900">
                <td className="px-4 py-2.5">{p.planId ?? '—'}</td>
                <td className="px-4 py-2.5">
                  {typeof p.rooms === 'number' ? p.rooms : '—'}
                </td>
                <td className="px-4 py-2.5 font-medium">
                  {formatVND(p.totalAmount)}
                </td>
                <td className="px-4 py-2.5">{p.method ?? '—'}</td>
                <td className="px-4 py-2.5">
                  {p.status ? (
                    <Badge variant={p.status === 'paid' ? 'success' : 'warning'}>
                      {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-2.5 text-ink-600">
                  {p.paidAt ? formatDateTime(p.paidAt) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
