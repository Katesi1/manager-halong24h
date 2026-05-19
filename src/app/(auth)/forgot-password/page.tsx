'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { forgotPasswordAction, type ActionResult } from '@/app/actions/auth';
import { Input, Label } from '@/components/ui/input';
import { SubmitButton } from '@/components/auth/submit-button';

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState<ActionResult, FormData>(forgotPasswordAction, {});

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink-900">Quên mật khẩu?</h1>
      <p className="mt-2 text-sm text-ink-500">
        Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="ban@email.com"
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>

        {state.ok && (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
            ✓ Đã gửi email đặt lại mật khẩu. Kiểm tra hộp thư.
          </div>
        )}
        {state.error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {state.error}
          </div>
        )}

        <SubmitButton pending="Đang gửi...">Gửi link đặt lại</SubmitButton>

        <p className="text-center text-sm text-ink-700">
          Đã nhớ mật khẩu?{' '}
          <Link href="/login" className="font-semibold text-navy-700 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
