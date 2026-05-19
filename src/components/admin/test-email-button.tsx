'use client';

import { useState, useTransition } from 'react';

import { sendTestEmailAction } from '@/app/actions/admin-emails';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

interface Props {
  template: string;
  /** Pre-fill từ current admin email (lấy ở server) */
  defaultTo?: string;
}

export function TestEmailButton({ template, defaultTo }: Props) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState(defaultTo ?? '');
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setOpen(false);
    setResult(null);
    setError(null);
  }

  function onSend() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const r = await sendTestEmailAction({ template, to });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      const live = r.data.mode === 'live';
      setResult(
        live
          ? `✓ Đã gửi tới ${r.data.to}. Kiểm tra hộp thư (kèm Spam) trong 1-2 phút.`
          : `✓ [MOCK] Đã ghi nhận gửi tới ${r.data.to}. BE chưa wire — bật NEXT_PUBLIC_EMAIL_LIVE=true khi sẵn sàng.`,
      );
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        📧 Gửi test cho tôi
      </Button>
    );
  }

  return (
    <div className="mt-3 w-full rounded-xl bg-cream-100 p-4 ring-1 ring-ink-200/60">
      {error && (
        <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}
      {result && (
        <p className="mb-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800 ring-1 ring-emerald-200">
          {result}
        </p>
      )}

      <Label htmlFor="test-to">Gửi tới email</Label>
      <Input
        id="test-to"
        type="email"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="ban@halong24h.com"
        disabled={pending}
      />
      <p className="mt-1 text-[11px] text-ink-500">
        BE chưa wire endpoint. Hiện tại chỉ log ra console + giả lập gửi để
        verify template không bị lỗi rendering.
      </p>

      <div className="mt-3 flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onSend}
          disabled={pending || !to}
        >
          {pending ? 'Đang gửi…' : 'Gửi'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={pending}
        >
          Đóng
        </Button>
      </div>
    </div>
  );
}
