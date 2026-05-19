'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

interface SubmitButtonProps {
  children: React.ReactNode;
  pending?: string;
  variant?: 'primary' | 'gold' | 'dark';
}

export function SubmitButton({ children, pending = 'Đang xử lý...', variant = 'primary' }: SubmitButtonProps) {
  const { pending: isPending } = useFormStatus();
  return (
    <Button type="submit" size="lg" variant={variant} className="w-full" disabled={isPending}>
      {isPending ? pending : children}
    </Button>
  );
}
