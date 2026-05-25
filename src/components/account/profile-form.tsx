'use client';

import { useState } from 'react';

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

/**
 * Mock profile form — BE chưa có endpoint `PATCH /auth/profile` cho cập nhật
 * thông tin cá nhân. Khi có sẽ thêm `updateProfileAction` và call ở submit.
 */
export function ProfileForm({ defaults }: ProfileFormProps) {
  const { show } = useToast();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setTimeout(() => {
      setPending(false);
      show(
        'Đã lưu thông tin.',
        'success',
      );
    }, 400);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
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
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Đang lưu…' : 'Lưu thông tin'}
        </Button>
      </div>
    </form>
  );
}
