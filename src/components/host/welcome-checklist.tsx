import Link from 'next/link';

import type { UserProfile } from '@/core/entities/user';
import { cn } from '@/lib/utils';

interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  done: boolean;
  ctaLabel: string;
  ctaHref: string;
}

interface Props {
  profile: Pick<UserProfile, 'kycStatus' | 'kycBypass'>;
  propertyCount: number;
  bookingCount: number;
}

/**
 * Welcome checklist cho chủ nhà mới — hiển thị khi chưa hoàn tất bước cơ bản.
 * Tự ẩn khi đã có ≥1 booking (coi như onboarded).
 */
export function WelcomeChecklist({
  profile,
  propertyCount,
  bookingCount,
}: Props) {
  // Onboarded → ẩn
  if (bookingCount > 0) return null;

  const kycDone = profile.kycStatus === 'approved' || profile.kycBypass;
  const hasProperty = propertyCount > 0;

  const steps: ChecklistStep[] = [
    {
      id: 'kyc',
      label: 'Hoàn tất KYC trên app mobile',
      description:
        '7 yếu tố: GPKD/HKD + CCCD + selfie + STK + VNeID + SĐT + Gmail',
      done: kycDone,
      ctaLabel: kycDone ? '✓ Đã xong' : 'Mở cài đặt KYC',
      ctaHref: '/host/settings',
    },
    {
      id: 'property',
      label: 'Tạo cơ sở đầu tiên',
      description: 'Villa, homestay, hoặc khách sạn — đầy đủ ảnh + giá',
      done: hasProperty,
      ctaLabel: hasProperty ? '✓ Đã có cơ sở' : 'Thêm cơ sở',
      ctaHref: kycDone ? '/host/properties/new' : '/host/settings',
    },
    {
      id: 'ready',
      label: 'Sẵn sàng nhận đặt phòng',
      description:
        'Khách sẽ tìm thấy cơ sở của bạn trên halong24h.com và chat trực tiếp',
      done: hasProperty && kycDone,
      ctaLabel: 'Xem trang khách',
      ctaHref: '/',
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  // Đã hoàn thành 3/3 mà chưa có booking → ẩn (chờ booking đầu)
  if (completedCount === steps.length) return null;

  return (
    <section className="mb-6 rounded-2xl border border-gold-200 bg-gold-50 p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="overline gold no-dash text-[10px]">Bắt đầu Halong24h</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-gold-900">
            Hoàn tất 3 bước để bắt đầu nhận khách
          </h2>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-semibold text-gold-700">
            {completedCount}
            <span className="text-lg text-gold-600">/{steps.length}</span>
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={cn(
              'flex items-start gap-4 rounded-xl border p-4',
              step.done
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-gold-300 bg-white',
            )}
          >
            <div
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold',
                step.done
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gold-100 text-gold-900',
              )}
            >
              {step.done ? '✓' : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'font-semibold',
                  step.done ? 'text-emerald-900' : 'text-ink-900',
                )}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-ink-700 leading-relaxed">
                {step.description}
              </p>
            </div>
            <Link
              href={step.ctaHref}
              className={cn(
                'shrink-0 self-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                step.done
                  ? 'text-emerald-700 hover:underline'
                  : 'bg-navy-900 text-white hover:bg-navy-800',
              )}
            >
              {step.ctaLabel}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
