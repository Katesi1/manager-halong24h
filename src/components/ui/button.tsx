import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'bg-navy-900 hover:bg-navy-800 text-white shadow-sm',
  secondary: 'bg-white hover:bg-cream-100 text-ink-900 ring-1 ring-ink-100',
  outline: 'border border-ink-300 hover:border-ink-900 hover:bg-cream-100 text-ink-900',
  ghost: 'hover:bg-cream-200 text-ink-900',
  gold: 'bg-gold-500 hover:bg-gold-600 text-white shadow-sm',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  dark: 'bg-ink-900 hover:bg-black text-white',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
  xl: 'h-14 px-7 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-all disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
