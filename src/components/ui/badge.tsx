import { cn } from '@/lib/utils';

type Variant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gold'
  | 'navy'
  | 'dark';

const variants: Record<Variant, string> = {
  default: 'bg-cream-200 text-ink-700',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-navy-100 text-navy-800',
  gold: 'bg-gold-100 text-gold-800',
  navy: 'bg-navy-900 text-cream-50',
  dark: 'bg-ink-900 text-cream-50',
};

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
