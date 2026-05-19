import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%]',
        'shimmer',
        className,
      )}
      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
    />
  );
}
