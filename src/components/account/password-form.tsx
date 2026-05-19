'use client';

import { useActionState, useEffect, useRef, useState } from 'react';

import { changePasswordAction, type ActionResult } from '@/app/actions/auth';
import { Input, Label } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

const initialState: ActionResult = {};

export function PasswordForm() {
  const { show } = useToast();
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      show('Đổi mật khẩu thành công', 'success');
      formRef.current?.reset();
    } else if (state.error) {
      show(state.error, 'error');
    }
  }, [state, show]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const newPassword = String(fd.get('newPassword') ?? '');
    const confirm = String(fd.get('confirm') ?? '');
    if (newPassword !== confirm) {
      e.preventDefault();
      setConfirmError('Mật khẩu xác nhận không khớp');
      return;
    }
    setConfirmError(null);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="grid gap-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <Label htmlFor="currentPassword" required>
          Mật khẩu hiện tại
        </Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
        />
        {state.fieldErrors?.currentPassword && (
          <p className="mt-1 text-xs text-red-600">
            {state.fieldErrors.currentPassword}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="newPassword" required>
          Mật khẩu mới
        </Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
        />
        {state.fieldErrors?.newPassword && (
          <p className="mt-1 text-xs text-red-600">
            {state.fieldErrors.newPassword}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="confirm" required>
          Xác nhận mật khẩu mới
        </Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
        />
        {confirmError && (
          <p className="mt-1 text-xs text-red-600">{confirmError}</p>
        )}
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Đang đổi mật khẩu…' : 'Đổi mật khẩu'}
        </Button>
      </div>
    </form>
  );
}
