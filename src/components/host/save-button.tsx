'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

interface Props {
  label: string;
  successMessage?: string;
}

export function SaveButton({ label, successMessage = '✓ Đã lưu' }: Props) {
  const { show } = useToast();
  const [pending, setPending] = useState(false);

  function handleSave() {
    setPending(true);
    setTimeout(() => {
      show(successMessage, 'success');
      setPending(false);
    }, 500);
  }

  return (
    <Button type="button" disabled={pending} onClick={handleSave}>
      {pending ? 'Đang lưu...' : label}
    </Button>
  );
}
