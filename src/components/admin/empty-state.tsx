import Link from 'next/link';
import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Generic empty state for list pages — replaces inline plain-text cards.
 * Use after an error banner check so it never duplicates with errors.
 */
export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: Props) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink-200 bg-cream-50 p-12 text-center">
      {icon && <div className="mb-3 text-4xl">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-navy-900">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-ink-500">{description}</p>
      )}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-4 inline-flex h-9 items-center rounded-md bg-navy-900 px-4 text-sm font-medium text-white hover:bg-navy-800"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
