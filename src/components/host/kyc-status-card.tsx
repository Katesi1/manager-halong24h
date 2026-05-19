import {
  KYC_STATUS_LABEL,
  type KycStatusResponse,
  type KycSubmissionStatus,
} from '@/core/entities/kyc';
import { cn } from '@/lib/utils';

interface KycStatusCardProps {
  status: KycStatusResponse;
}

const STATUS_TONE: Record<
  KycSubmissionStatus | 'none',
  { bg: string; text: string; icon: string }
> = {
  none: { bg: 'bg-amber-50 ring-amber-200', text: 'text-amber-900', icon: '⚠️' },
  draft: { bg: 'bg-amber-50 ring-amber-200', text: 'text-amber-900', icon: '✏️' },
  kyc_submitted: {
    bg: 'bg-blue-50 ring-blue-200',
    text: 'text-blue-900',
    icon: '⏳',
  },
  payment_pending: {
    bg: 'bg-amber-50 ring-amber-200',
    text: 'text-amber-900',
    icon: '💳',
  },
  paid: { bg: 'bg-blue-50 ring-blue-200', text: 'text-blue-900', icon: '💸' },
  awaiting_approval: {
    bg: 'bg-blue-50 ring-blue-200',
    text: 'text-blue-900',
    icon: '⏳',
  },
  approved: {
    bg: 'bg-emerald-50 ring-emerald-200',
    text: 'text-emerald-900',
    icon: '✅',
  },
  rejected: { bg: 'bg-rose-50 ring-rose-200', text: 'text-rose-900', icon: '❌' },
  refunded: {
    bg: 'bg-ink-50 ring-ink-200',
    text: 'text-ink-700',
    icon: '↩️',
  },
};

export function KycStatusCard({ status }: KycStatusCardProps) {
  const s = status.kycStatus;
  const tone = STATUS_TONE[s];
  const isApproved = s === 'approved' || status.kycBypass;
  const needsAction = s === 'none' || s === 'draft' || s === 'rejected';

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'flex items-start justify-between gap-3 rounded-lg px-4 py-3 ring-1',
          tone.bg,
        )}
      >
        <div className="min-w-0">
          <p className={cn('text-xs font-bold uppercase tracking-wider', tone.text)}>
            Trạng thái KYC
          </p>
          <p className={cn('mt-0.5 text-base font-bold', tone.text)}>
            {KYC_STATUS_LABEL[s]}
            {status.kycBypass && (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                MIỄN XÁC MINH
              </span>
            )}
          </p>
          {s === 'rejected' && status.submission?.rejectedReason && (
            <p className="mt-2 text-sm text-rose-700">
              Lý do: {status.submission.rejectedReason}
            </p>
          )}
        </div>
        <span className="text-2xl shrink-0">{tone.icon}</span>
      </div>

      {!isApproved && (
        <div className="rounded-xl border border-dashed border-ink-200 bg-white p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-navy-900 text-2xl text-white">
              📱
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg font-semibold tracking-tight text-navy-900">
                {needsAction
                  ? 'Tải app Halong24h để hoàn tất KYC'
                  : 'KYC đang được xử lý trên app Halong24h'}
              </h3>
              <p className="mt-1 text-sm text-ink-700">
                Việc upload 3 ảnh CCCD + selfie và submit hồ sơ chỉ thực hiện
                được trên ứng dụng mobile (cần camera + face match). Web là nơi
                quản lý vận hành — không phải nơi nộp KYC.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white">
                  📱 iOS App Store
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white">
                  🤖 Google Play
                </span>
                <span className="text-xs text-ink-500 self-center">
                  (Sắp ra mắt — link sẽ cập nhật sau)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isApproved && (
        <p className="text-sm text-ink-700">
          KYC đã duyệt — bạn có thể tạo cơ sở và nhận khách bình thường.
        </p>
      )}
    </div>
  );
}
