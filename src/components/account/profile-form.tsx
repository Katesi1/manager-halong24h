'use client';

import { useActionState, useEffect, useRef } from 'react';

import { updateProfileAction, type ActionResult } from '@/app/actions/auth';
import { Input, Label } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

interface ProfileFormProps {
  defaults: {
    full_name: string;
    email: string;
    phone: string;
  };
}

const initialState: ActionResult = {};

/**
 * Hồ sơ cá nhân — `PATCH /auth/profile` (spec §25.2). Whitelist họ tên / email /
 * SĐT. Lỗi trùng email/SĐT (409) hiển thị qua toast.
 */
export function ProfileForm({ defaults }: ProfileFormProps) {
  const { show } = useToast();
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      show('Đã lưu thông tin.', 'success');
    } else if (state.error) {
      show(state.error, 'error');
    }
  }, [state, show]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="full_name" required>
          Họ và tên
        </Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={defaults.full_name}
          required
          minLength={2}
          maxLength={120}
        />
        {state.fieldErrors?.fullName && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.fullName}</p>
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
          defaultValue={defaults.email}
          required
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
          defaultValue={defaults.phone}
          placeholder="0901234567"
        />
        {state.fieldErrors?.phone && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.phone}</p>
        )}
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Đang lưu…' : 'Lưu thông tin'}
        </Button>
      </div>
    </form>
  );
}
