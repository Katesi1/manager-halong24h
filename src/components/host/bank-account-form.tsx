'use client';

import { useActionState, useEffect, useState } from 'react';
import { CheckCircle2, Clock, Landmark, XCircle } from 'lucide-react';

import { submitMyBankAction } from '@/app/actions/bank-accounts';
import type { ActionResult } from '@/app/actions/auth';
import { BankSelect } from '@/components/common/bank-select';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import type { BankAccountState, BankDetails } from '@/core/entities/bank-account';

interface Props {
  state: BankAccountState;
}

const initialState: ActionResult = {};

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-xs text-ink-500">{label}</span>
      <span className="text-sm font-medium text-ink-900">{value || '—'}</span>
    </div>
  );
}

function DetailsBox({ d, title }: { d: BankDetails; title: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-cream-50/60 p-4">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        {title}
      </p>
      <DetailRow label="Ngân hàng" value={d.bankName} />
      <DetailRow label="Số tài khoản" value={d.bankAccountNumber} />
      <DetailRow label="Chủ tài khoản" value={d.bankAccountName} />
      <DetailRow label="Mã ngân hàng (BIN)" value={d.bankBin} />
    </div>
  );
}

/**
 * Màn "Tài khoản nhận tiền" của OWNER (spec §3.3.1). Render theo 4 trạng thái;
 * submit qua `PUT /users/me/bank` → ghi pending, chờ ADMIN duyệt (KHÔNG kích hoạt
 * ngay). VietQR trả cọc dùng STK đã duyệt (`current`).
 */
export function BankAccountForm({ state }: Props) {
  const { show } = useToast();
  const [formState, formAction, pending] = useActionState(
    submitMyBankAction,
    initialState,
  );
  // none → luôn hiện form. approved/rejected → mặc định xem, bấm để sửa.
  const [editing, setEditing] = useState(state.status === 'none');

  useEffect(() => {
    if (formState.ok) {
      show('Đã gửi thông tin, chờ quản trị viên duyệt.', 'success');
      setEditing(false);
    } else if (formState.error) {
      show(formState.error, 'error');
    }
  }, [formState, show]);

  const prefill = formState.values ?? state.current;
  const showForm = editing || state.status === 'none';

  return (
    <div className="space-y-4">
      {state.status === 'pending' && (
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Đang chờ quản trị viên duyệt</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Số tài khoản mới sẽ được dùng nhận cọc sau khi được duyệt. Bạn có
              thể gửi lại để chỉnh sửa thông tin.
            </p>
          </div>
        </div>
      )}

      {state.status === 'approved' && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            Tài khoản nhận tiền đã được duyệt và đang dùng để tạo mã VietQR cho
            khách trả cọc.
          </span>
        </div>
      )}

      {state.status === 'rejected' && (
        <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Yêu cầu bị từ chối</p>
            {state.rejectReason && (
              <p className="mt-0.5 text-xs text-rose-800">{state.rejectReason}</p>
            )}
            <p className="mt-0.5 text-xs text-rose-800">
              Vui lòng kiểm tra lại và gửi lại thông tin.
            </p>
          </div>
        </div>
      )}

      {/* Xem STK đang chờ duyệt / đang dùng */}
      {!showForm && (
        <>
          {state.status === 'pending' && state.pending && (
            <DetailsBox d={state.pending} title="Đang chờ duyệt" />
          )}
          <DetailsBox d={state.current} title="Đang sử dụng" />
          <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
            {state.status === 'rejected' ? 'Gửi lại thông tin' : 'Sửa tài khoản'}
          </Button>
        </>
      )}

      {showForm && (
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-center gap-2 text-sm text-ink-500">
            <Landmark className="h-4 w-4" />
            Nhập chính xác thông tin STK chính chủ (khớp tên đã xác minh KYC).
          </div>

          <BankSelect
            defaultBin={prefill.bankBin}
            defaultName={prefill.bankName}
            error={formState.fieldErrors?.bankBin}
            required
          />

          <div>
            <Label htmlFor="bankAccountNumber" required>
              Số tài khoản
            </Label>
            <Input
              id="bankAccountNumber"
              name="bankAccountNumber"
              inputMode="numeric"
              maxLength={20}
              defaultValue={prefill.bankAccountNumber ?? ''}
              placeholder="0123456789"
              required
            />
            {formState.fieldErrors?.bankAccountNumber && (
              <p className="mt-1 text-xs text-red-600">
                {formState.fieldErrors.bankAccountNumber}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="bankAccountName" required>
              Chủ tài khoản
            </Label>
            <Input
              id="bankAccountName"
              name="bankAccountName"
              defaultValue={prefill.bankAccountName ?? ''}
              placeholder="NGUYEN VAN A"
              required
            />
            {formState.fieldErrors?.bankAccountName && (
              <p className="mt-1 text-xs text-red-600">
                {formState.fieldErrors.bankAccountName}
              </p>
            )}
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2">
            {state.status !== 'none' && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={pending}
              >
                Huỷ
              </Button>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? 'Đang gửi…' : 'Gửi để duyệt'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
