'use client';

import { Suspense, useActionState, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { resetPasswordAction, type ActionResult } from '@/app/actions/auth';
import { Label } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { SubmitButton } from '@/components/auth/submit-button';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const sp = useSearchParams();
  const token = sp.get('token') ?? '';
  const [state, formAction] = useActionState<ActionResult, FormData>(
    resetPasswordAction,
    {},
  );
  const [confirmError, setConfirmError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get('password') ?? '');
    const confirm = String(fd.get('confirm') ?? '');
    if (password !== confirm) {
      e.preventDefault();
      setConfirmError('Mật khẩu xác nhận không khớp');
      return;
    }
    setConfirmError(null);
  }

  if (!token) {
    return (
      <div>
        <h1 className="font-display text-3xl font-bold text-ink-900">
          Đặt lại mật khẩu
        </h1>
        <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          Link đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực. Vui lòng
          dùng link trong email, hoặc yêu cầu gửi lại.
        </div>
        <p className="mt-6 text-center text-sm text-ink-700">
          <Link
            href="/forgot-password"
            className="font-semibold text-navy-700 hover:underline"
          >
            Gửi lại email đặt lại mật khẩu
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink-900">
        Đặt lại mật khẩu
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Nhập mật khẩu mới cho tài khoản của bạn.
      </p>

      <form action={formAction} onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <Label htmlFor="password" required>
            Mật khẩu mới
          </Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Tối thiểu 6 ký tự"
          />
          {state.fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirm" required>
            Xác nhận mật khẩu mới
          </Label>
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Nhập lại mật khẩu mới"
          />
          {(confirmError ?? state.fieldErrors?.confirm) && (
            <p className="mt-1 text-xs text-red-600">
              {confirmError ?? state.fieldErrors?.confirm}
            </p>
          )}
        </div>

        {state.fieldErrors?.token && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {state.fieldErrors.token}
          </div>
        )}
        {state.error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {state.error}
          </div>
        )}

        <SubmitButton pending="Đang đặt lại...">Đặt lại mật khẩu</SubmitButton>

        <p className="text-center text-sm text-ink-700">
          Đã nhớ mật khẩu?{' '}
          <Link
            href="/login"
            className="font-semibold text-navy-700 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
