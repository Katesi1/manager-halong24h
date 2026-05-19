'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { signupAction, type ActionResult } from '@/app/actions/auth';
import { Input, Label } from '@/components/ui/input';
import { SubmitButton } from '@/components/auth/submit-button';
import { cn } from '@/lib/utils';

export default function SignupPage() {
  const [state, formAction] = useActionState<ActionResult, FormData>(signupAction, {});
  const [role, setRole] = useState<'customer' | 'owner'>('customer');

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink-900">Đăng ký</h1>
      <p className="mt-2 text-sm text-ink-500">Tạo tài khoản miễn phí để bắt đầu.</p>

      <form action={formAction} className="mt-8 space-y-4">
        {/* Role selection */}
        <div>
          <Label>Bạn muốn đăng ký làm</Label>
          <div className="grid grid-cols-2 gap-2">
            <RoleButton
              value="customer"
              active={role === 'customer'}
              onClick={() => setRole('customer')}
              title="Khách"
              desc="Đặt phòng cho chuyến đi"
              icon="🧳"
            />
            <RoleButton
              value="owner"
              active={role === 'owner'}
              onClick={() => setRole('owner')}
              title="Chủ nhà"
              desc="Cho thuê villa, KS, homestay"
              icon="🏡"
            />
          </div>
          <input type="hidden" name="role" value={role} />
        </div>

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
            placeholder="Nguyễn Văn A"
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
            placeholder="ban@email.com"
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="0123 456 789"
          />
        </div>

        <div>
          <Label htmlFor="password" required>
            Mật khẩu
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Tối thiểu 8 ký tự"
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

        <SubmitButton pending="Đang tạo tài khoản..." variant={role === 'owner' ? 'gold' : 'primary'}>
          {role === 'owner' ? 'Đăng ký chủ nhà' : 'Đăng ký khách'}
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

function RoleButton({
  value: _value,
  active,
  onClick,
  title,
  desc,
  icon,
}: {
  value: string;
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start rounded-xl border-2 p-3 text-left transition-all',
        active ? 'border-navy-900 bg-navy-50' : 'border-ink-200 hover:border-ink-300',
      )}
    >
      <div className="text-2xl">{icon}</div>
      <div className="mt-1 text-sm font-semibold text-ink-900">{title}</div>
      <div className="text-xs text-ink-500">{desc}</div>
    </button>
  );
}
