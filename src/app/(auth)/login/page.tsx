'use client';

import { Suspense, useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginAction, type ActionResult } from '@/app/actions/auth';
import { Input, Label } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { GoogleLoginSection } from '@/components/auth/google-login-section';
import { SubmitButton } from '@/components/auth/submit-button';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const sp = useSearchParams();
  const redirectTo = sp.get('redirect') ?? '/';
  const sessionEnded = sp.get('reason') === 'session-ended';
  const passwordReset = sp.get('reset') === '1';
  const [state, formAction] = useActionState<ActionResult, FormData>(loginAction, {});

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink-900">Đăng nhập</h1>
      <p className="mt-2 text-sm text-ink-500">Đăng nhập vào trang quản lý Halong24h.</p>

      {sessionEnded && (
        <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Tài khoản đã đăng nhập ở thiết bị khác. Vui lòng đăng nhập lại.
        </div>
      )}

      {passwordReset && (
        <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
          ✓ Đã đặt lại mật khẩu thành công. Đăng nhập bằng mật khẩu mới.
        </div>
      )}

      <form action={formAction} className="mt-8 space-y-4">
        <input type="hidden" name="redirect" value={redirectTo} />

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
            defaultValue={state.values?.email ?? ''}
            placeholder="email@example.com"
            key={`email-${state.values?.email ?? ''}`}
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" required>
            Mật khẩu
          </Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
          {state.fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password}</p>
          )}
          <div className="mt-1 text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-ink-500 hover:text-navy-700 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
        </div>

        {state.error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {state.error}
          </div>
        )}

        <SubmitButton pending="Đang đăng nhập...">Đăng nhập</SubmitButton>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-ink-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-ink-500">hoặc</span>
        </div>
      </div>

      <GoogleLoginSection />

      <p className="mt-6 text-center text-sm text-ink-700">
        Chưa có tài khoản?{' '}
        <Link href="/signup" className="font-semibold text-navy-700 hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
