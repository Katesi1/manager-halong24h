import {
  KYC_STATUS_LABEL,
  type KycStatusResponse,
} from '@/core/entities/kyc';
import { cn } from '@/lib/utils';

interface KycStatusCardProps {
  status: KycStatusResponse;
}

// Key bằng `string` để dung nạp cả vocab submission (draft/kyc_submitted/…) lẫn
// vocab User profile (`none|pending|approved|rejected`) BE có thể trả ở /kyc/status.
const STATUS_TONE: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  none: { bg: 'bg-amber-50 ring-amber-200', text: 'text-amber-900', icon: '⚠️' },
  pending: {
    bg: 'bg-blue-50 ring-blue-200',
    text: 'text-blue-900',
    icon: '⏳',
  },
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

const FALLBACK_TONE = STATUS_TONE.none;

export function KycStatusCard({ status }: KycStatusCardProps) {
  const s = status.kycStatus;
  // BE có thể trả trạng thái ngoài 9 giá trị FE map (vd tài khoản admin pass KYC)
  // → fallback để không sập trang; log dev để bổ sung map khi gặp giá trị mới.
  const tone = STATUS_TONE[s] ?? FALLBACK_TONE;
  const label = KYC_STATUS_LABEL[s] ?? 'Đang cập nhật';
  if (!STATUS_TONE[s] && process.env.NODE_ENV !== 'production') {
    console.warn('[KycStatusCard] kycStatus chưa được map:', s);
  }
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
            {label}
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
                <a
                  href="https://apps.apple.com/ae/app/halong24h/id6769460183"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-ink-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                  </svg>
                  iOS App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.halong24h.app&hl=vi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-ink-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  Google Play
                </a>
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
