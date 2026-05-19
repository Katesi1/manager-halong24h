import { cn } from '@/lib/utils';

const GRADIENTS = [
  'from-rose-500 to-amber-500',
  'from-blue-500 to-cyan-400',
  'from-emerald-500 to-blue-500',
  'from-amber-500 to-rose-500',
  'from-purple-500 to-pink-500',
  'from-cyan-400 to-emerald-500',
  'from-indigo-500 to-purple-500',
  'from-teal-500 to-cyan-400',
];

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Hiển thị green dot góc dưới-phải (online) */
  online?: boolean;
}

const sizes: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-14 w-14 text-lg',
};

const dotSizes: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5',
};

function pickGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export function GradientAvatar({ name, size = 'md', className, online }: Props) {
  const initial = (name || '?').trim().slice(0, 1).toUpperCase();
  const gradient = pickGradient(name);

  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'grid place-items-center rounded-full font-bold text-white shadow-sm bg-gradient-to-br',
          sizes[size],
          gradient,
        )}
      >
        {initial}
      </div>
      {online && (
        <span
          className={cn(
            'absolute right-0 bottom-0 rounded-full bg-emerald-500 ring-2 ring-white',
            dotSizes[size],
          )}
        />
      )}
    </div>
  );
}
