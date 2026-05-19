import Link from 'next/link';

import { Button } from '@/components/ui/button';

/**
 * Block UI khi host chưa đủ điều kiện để thực hiện action quan trọng (tạo cơ sở,
 * tạo booking…).
 */
interface GuardBannerProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function GuardBanner({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  secondaryHref,
  secondaryLabel,
}: GuardBannerProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center max-w-2xl mx-auto">
      <p className="text-4xl">{icon}</p>
      <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-amber-900">
        {title}
      </h2>
      <p className="mt-2 text-sm text-amber-900 leading-relaxed">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href={ctaHref}>
          <Button>{ctaLabel}</Button>
        </Link>
        {secondaryHref && secondaryLabel && (
          <Link href={secondaryHref}>
            <Button variant="outline">{secondaryLabel}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
