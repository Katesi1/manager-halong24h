'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, Pencil } from 'lucide-react';

import type { ActionResult } from '@/app/actions/auth';
import { updateReceivingBankAction } from '@/app/actions/platform-bank';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import type { ReceivingBankAccount } from '@/core/entities/platform-bank';
import { formatDateTime } from '@/lib/format';

interface Props {
  bank: ReceivingBankAccount;
  /** Lỗi tải STK (BE fail) — hiển thị nhẹ, không chặn. */
  error?: string;
}

const initialState: ActionResult = {};

/**
 * Banner STK nền tảng nhận tiền mua gói (spec §10.7) + dialog sửa cho ADMIN.
 * Áp dụng ngay khi lưu (không có luồng duyệt). Dùng sinh VietQR khi OWNER
 * mua/gia hạn gói cước.
 */
export function ReceivingBankPanel({ bank, error }: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateReceivingBankAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      show('Đã cập nhật tài khoản nhận tiền mua gói.', 'success');
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      show(state.error, 'error');
    }
  }, [state, show, router]);

  const prefill = state.values ?? bank;
  const isDb = bank.source === 'db';

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-amber-50 to-orange-50 p-5 ring-1 ring-amber-200/80">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
          <Banknote className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Tài khoản nhận tiền mua gói
            </p>
            <span
              className={
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ' +
                (isDb
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-ink-100 text-ink-600')
              }
              title={
                isDb
                  ? 'Do quản trị viên cấu hình'
                  : 'Đang dùng giá trị mặc định — chưa cấu hình'
              }
            >
              {isDb ? 'Đã cấu hình' : 'Mặc định'}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-amber-950">
              {bank.bankAccountNumber ?? '—'}
            </span>
            <span className="text-sm font-medium text-amber-900">
              {bank.bankName ?? 'Ngân hàng'}
            </span>
            <span className="text-sm text-amber-800">·</span>
            <span className="text-sm font-medium text-amber-900">
              {bank.bankAccountName ?? '—'}
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-800">
            Nội dung CK của user theo định dạng:{' '}
            <code className="rounded bg-white/60 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200">
              HALONG24H &lt;sessionId&gt;
            </code>{' '}
            · Dùng để sinh mã VietQR khi chủ nhà mua / gia hạn gói cước.
            {isDb && bank.updatedAt && (
              <> · Cập nhật {formatDateTime(bank.updatedAt)}.</>
            )}
          </p>
          {error && (
            <p className="mt-2 text-xs text-rose-700">
              Không tải được STK hiện hành: {error}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
          className="shrink-0"
        >
          <Pencil className="h-3.5 w-3.5" />
          Sửa STK
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o && !pending) setOpen(false);
        }}
      >
        <DialogContent open={open}>
          <h3 className="font-display text-lg font-semibold text-ink-900">
            Tài khoản nhận tiền mua gói
          </h3>
          <p className="mt-1 text-sm text-ink-600">
            STK của công ty để chủ nhà chuyển khoản mua / gia hạn gói cước. Lưu là
            áp dụng ngay cho các phiên mua gói tạo sau đó.
          </p>

          <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="rb-bankBin" required>
                Mã ngân hàng (BIN)
              </Label>
              <Input
                id="rb-bankBin"
                name="bankBin"
                inputMode="numeric"
                maxLength={6}
                defaultValue={prefill.bankBin ?? ''}
                placeholder="970416"
                required
              />
              {state.fieldErrors?.bankBin && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.bankBin}
                </p>
              )}
              <p className="mt-1 text-[11px] text-ink-400">
                Mã NAPAS 6 chữ số (VD: 970416 = ACB).
              </p>
            </div>

            <div>
              <Label htmlFor="rb-bankName">Tên ngân hàng</Label>
              <Input
                id="rb-bankName"
                name="bankName"
                maxLength={100}
                defaultValue={prefill.bankName ?? ''}
                placeholder="ACB"
              />
              {state.fieldErrors?.bankName && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.bankName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="rb-bankAccountNumber" required>
                Số tài khoản
              </Label>
              <Input
                id="rb-bankAccountNumber"
                name="bankAccountNumber"
                inputMode="numeric"
                maxLength={20}
                defaultValue={prefill.bankAccountNumber ?? ''}
                placeholder="21169431"
                required
              />
              {state.fieldErrors?.bankAccountNumber && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.bankAccountNumber}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="rb-bankAccountName" required>
                Chủ tài khoản
              </Label>
              <Input
                id="rb-bankAccountName"
                name="bankAccountName"
                maxLength={100}
                defaultValue={prefill.bankAccountName ?? ''}
                placeholder="NGUYEN VU NAM"
                required
              />
              {state.fieldErrors?.bankAccountName && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.bankAccountName}
                </p>
              )}
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Huỷ
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? 'Đang lưu…' : 'Lưu tài khoản'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
