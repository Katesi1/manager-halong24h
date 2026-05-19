'use client';

import { Suspense, useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginAction, type ActionResult } from '@/app/actions/auth';
import { Input, Label } from '@/components/ui/input';
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
  const [state, formAction] = useActionState<ActionResult, FormData>(loginAction, {});

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink-900">Đăng nhập</h1>
      <p className="mt-2 text-sm text-ink-500">Chào mừng trở lại Halong24h.</p>

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
            placeholder="ban@email.com"
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password" required>
              Mật khẩu
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-navy-700 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Tối thiểu 6 ký tự"
          />
          {state.fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password}</p>
          )}
        </div>

        {state.error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {state.error}
          </div>
        )}

        <SubmitButton pending="Đang đăng nhập...">Đăng nhập</SubmitButton>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-ink-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-ink-500">hoặc</span>
          </div>
        </div>

        <p className="text-center text-sm text-ink-700">
          Chưa có tài khoản?{' '}
          <Link href="/signup" className="font-semibold text-navy-700 hover:underline">
            Đăng ký
          </Link>
        </p>
      </form>
    </div>
  );
}
