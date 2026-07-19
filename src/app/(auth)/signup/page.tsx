'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signupAction, type ActionResult } from '@/app/actions/auth';
import { Input, Label } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { SubmitButton } from '@/components/auth/submit-button';
import { cn } from '@/lib/utils';

export default function SignupPage() {
  const [state, formAction] = useActionState<ActionResult, FormData>(signupAction, {});
  const v = state.values;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink-900">Đăng ký chủ nhà</h1>
      <p className="mt-2 text-sm text-ink-500">
        Tạo tài khoản để quản lý cơ sở lưu trú trên Halong24h.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <input type="hidden" name="role" value="owner" />

        <div>
          <Label htmlFor="full_name" required>
            Họ tên
          </Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            defaultValue={v?.full_name ?? ''}
            placeholder="Nguyễn Văn A"
            key={`name-${v?.full_name ?? ''}`}
          />
          {state.fieldErrors?.full_name && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.full_name}</p>
          )}
        </div>

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
            defaultValue={v?.email ?? ''}
            placeholder="email@example.com"
            key={`email-${v?.email ?? ''}`}
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" required>
            Số điện thoại
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            defaultValue={v?.phone ?? ''}
            placeholder="0912 345 678"
            key={`phone-${v?.phone ?? ''}`}
          />
          {state.fieldErrors?.phone && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.phone}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" required>
            Mật khẩu
          </Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
          />
          {state.fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password}</p>
          )}
        </div>

        {state.error && (
          <div
            className={cn(
              'rounded-lg px-4 py-3 text-sm ring-1',
              state.ok
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                : 'bg-red-50 text-red-700 ring-red-100',
            )}
          >
            {state.error}
          </div>
        )}

        <SubmitButton pending="Đang tạo tài khoản..." variant="gold">
          Đăng ký chủ nhà
        </SubmitButton>

        <p className="text-center text-xs text-ink-500">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <Link href="/legal/terms" className="text-ink-900 hover:underline">
            Điều khoản
          </Link>{' '}
          và{' '}
          <Link href="/legal/privacy" className="text-ink-900 hover:underline">
            Quyền riêng tư
          </Link>{' '}
          của Halong24h.
        </p>

        <p className="text-center text-sm text-ink-700">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-semibold text-navy-700 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
