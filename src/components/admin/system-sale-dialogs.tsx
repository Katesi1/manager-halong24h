'use client';

import { refetchApiResources } from '@/lib/use-api-resource';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Eye, EyeOff, Pencil, UserPlus } from 'lucide-react';

import {
  createSystemSaleAction,
  updateSystemSaleAction,
} from '@/app/actions/system-staff';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-rose-600">{errors[0]}</p>;
}

/** Ô mật khẩu có nút con mắt bật/tắt hiển thị. */
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-11"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-900"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/** Tạo trực tiếp System SALE (spec §26.4) — admin đặt mật khẩu ngay. */
export function SystemSaleCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function reset() {
    setForm({ name: '', email: '', phone: '', password: '' });
    setFieldErrors({});
  }

  function close() {
    if (pending) return;
    setOpen(false);
    reset();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setFieldErrors({});
      const res = await createSystemSaleAction({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      if (!res.ok) {
        setFieldErrors(res.fieldErrors ?? {});
        toast.error(res.error || 'Không tạo được tài khoản');
        return;
      }
      toast.success(`Đã tạo tài khoản Sale hệ thống ${res.data.email}`);
      setOpen(false);
      reset();
      router.refresh();
      refetchApiResources();
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="mr-1.5 h-4 w-4" />
        Tạo tài khoản
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent open={open}>
          <form onSubmit={submit} className="space-y-3">
              <h3 className="font-display text-lg font-semibold text-ink-900">
                Tạo tài khoản Sale hệ thống
              </h3>
              <p className="text-xs text-ink-500">
                Tài khoản đăng nhập ngay bằng email + mật khẩu bên dưới.
              </p>
              <div>
                <Label htmlFor="ss_name" required>Họ tên</Label>
                <Input
                  id="ss_name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nguyễn Văn A"
                />
                <FieldError errors={fieldErrors.name} />
              </div>
              <div>
                <Label htmlFor="ss_email" required>Email</Label>
                <Input
                  id="ss_email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="ops@halong24h.com"
                />
                <FieldError errors={fieldErrors.email} />
              </div>
              <div>
                <Label htmlFor="ss_phone">Số điện thoại</Label>
                <Input
                  id="ss_phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="0900000000"
                />
                <FieldError errors={fieldErrors.phone} />
              </div>
              <div>
                <Label htmlFor="ss_password" required>Mật khẩu tạm</Label>
                <PasswordInput
                  id="ss_password"
                  required
                  value={form.password}
                  onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                  placeholder="Tối thiểu 8 ký tự, có chữ và số"
                />
                <FieldError errors={fieldErrors.password} />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={close} disabled={pending}>
                  Huỷ
                </Button>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? 'Đang tạo...' : 'Tạo tài khoản'}
                </Button>
              </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Sửa thông tin System SALE — form giống form tạo, mật khẩu để trống nếu
 * không đổi (`PUT /users/:id` + `POST /users/:id/reset-password`).
 */
export function SystemSaleEditDialog({
  sale,
}: {
  sale: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: sale.name,
    email: sale.email,
    phone: sale.phone ?? '',
    status: sale.isActive ? 'active' : 'locked',
    newPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function close() {
    if (pending) return;
    setOpen(false);
    // Reset về giá trị hiện tại của row (bỏ thay đổi dở dang).
    setForm({
      name: sale.name,
      email: sale.email,
      phone: sale.phone ?? '',
      status: sale.isActive ? 'active' : 'locked',
      newPassword: '',
    });
    setFieldErrors({});
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setFieldErrors({});
      const res = await updateSystemSaleAction({
        userId: sale.id,
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        isActive: form.status === 'active',
        newPassword: form.newPassword || undefined,
      });
      if (!res.ok) {
        setFieldErrors(res.fieldErrors ?? {});
        toast.error(res.error || 'Không cập nhật được tài khoản');
        return;
      }
      toast.success(`Đã cập nhật tài khoản ${form.name}`);
      setOpen(false);
      router.refresh();
      refetchApiResources();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-sm font-medium text-navy-700 hover:underline"
      >
        <Pencil className="h-3.5 w-3.5" />
        Sửa
      </button>

      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent open={open}>
          <form onSubmit={submit} className="space-y-3">
            <h3 className="font-display text-lg font-semibold text-ink-900">
              Sửa tài khoản Sale hệ thống
            </h3>
            <div>
              <Label htmlFor="sse_name" required>Họ tên</Label>
              <Input
                id="sse_name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <FieldError errors={fieldErrors.name} />
            </div>
            <div>
              <Label htmlFor="sse_email" required>Email</Label>
              <Input
                id="sse_email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <FieldError errors={fieldErrors.email} />
            </div>
            <div>
              <Label htmlFor="sse_phone">Số điện thoại</Label>
              <Input
                id="sse_phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="0900000000"
              />
              <FieldError errors={fieldErrors.phone} />
            </div>
            <div>
              <Label htmlFor="sse_status">Trạng thái</Label>
              <select
                id="sse_status"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
                className="h-11 w-full rounded-[10px] border border-ink-300 bg-white px-4 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-100"
              >
                <option value="active">Hoạt động</option>
                <option value="locked">Tạm khóa</option>
              </select>
            </div>
            <div>
              <Label htmlFor="sse_password">Mật khẩu mới</Label>
              <PasswordInput
                id="sse_password"
                value={form.newPassword}
                onChange={(v) => setForm((f) => ({ ...f, newPassword: v }))}
                placeholder="Để trống nếu không đổi"
              />
              <FieldError errors={fieldErrors.newPassword} />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={close} disabled={pending}>
                Huỷ
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

