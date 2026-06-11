'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';

import { createStaffInviteAction } from '@/app/actions/staff';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  SUBSCRIPTION_SETTINGS_PATH,
  isFeatureLockedError,
} from '@/lib/entitlement';

export function InviteStaffForm() {
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [pending, startTransition] = useTransition();
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [lockedError, setLockedError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) {
      show('Email không hợp lệ', 'error');
      return;
    }

    startTransition(async () => {
      setLockedError(null);
      const result = await createStaffInviteAction({ email });
      if (!result.ok) {
        // v1.12 — hết trial / chưa đủ quyền: hiển thị notice kèm CTA gói cước,
        // không chỉ toast (toast không chứa được link).
        if (isFeatureLockedError(result.error)) {
          setLockedError(result.error);
        } else {
          show(result.error || 'Gửi lời mời thất bại', 'error');
        }
        return;
      }
      show(`✓ Đã gửi lời mời tới ${email}`, 'success');
      setEmail('');
      setLastInviteLink(result.data.inviteLink ?? null);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="invite_email" required>
          Email SALE
        </Label>
        <Input
          id="invite_email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="staff@example.com"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Đang gửi...' : 'Gửi lời mời'}
      </Button>
      <p className="text-xs text-ink-500">
        Email chứa link + shortCode HL-XXXXXX. SALE accept sẽ tạo tài khoản role
        SALE và tự gán vào Owner. Link hết hạn sau 7 ngày.
      </p>

      {lockedError && (
        <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-900 ring-1 ring-rose-100">
          <p>{lockedError}</p>
          <Link
            href={SUBSCRIPTION_SETTINGS_PATH}
            className="mt-1 inline-block font-semibold underline"
          >
            Đăng ký / gia hạn gói để thêm nhân viên
          </Link>
        </div>
      )}

      {lastInviteLink && (
        <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-100">
          <p className="font-semibold">Link mời (share thủ công nếu cần):</p>
          <code className="mt-1 block break-all font-mono text-[11px]">
            {lastInviteLink}
          </code>
        </div>
      )}
    </form>
  );
}
