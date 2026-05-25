'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB

const BANK_OPTIONS = [
  'Vietcombank',
  'BIDV',
  'Techcombank',
  'MB Bank',
  'ACB',
  'VPBank',
  'TPBank',
  'Sacombank',
  'VIB',
  'Agribank',
] as const;

type PropertyDocType =
  | 'land_certificate'
  | 'rental_contract'
  | 'utility_bill';

const PROPERTY_DOC_OPTIONS: ReadonlyArray<{
  value: PropertyDocType;
  label: string;
}> = [
  {
    value: 'land_certificate',
    label: 'Sổ đỏ / sổ hồng (Giấy chứng nhận quyền sử dụng đất)',
  },
  { value: 'rental_contract', label: 'Hợp đồng thuê nhà (có công chứng)' },
  {
    value: 'utility_bill',
    label: 'Hóa đơn điện/nước có địa chỉ khớp listing',
  },
];

interface KycFormState {
  cccdFront: File | null;
  cccdBack: File | null;
  selfie: File | null;
  bankAccount: string;
  bankName: string;
  bankAccountHolder: string;
  propertyDocType: PropertyDocType | '';
  propertyDocFile: File | null;
  consentTruthful: boolean;
  consentDataProcessing: boolean;
}

const INITIAL_STATE: KycFormState = {
  cccdFront: null,
  cccdBack: null,
  selfie: null,
  bankAccount: '',
  bankName: '',
  bankAccountHolder: '',
  propertyDocType: '',
  propertyDocFile: null,
  consentTruthful: false,
  consentDataProcessing: false,
};

export function KycForm() {
  const router = useRouter();
  const [state, setState] = useState<KycFormState>(INITIAL_STATE);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function setField<K extends keyof KycFormState>(k: K, v: KycFormState[K]) {
    setState((prev) => ({ ...prev, [k]: v }));
  }

  function setImageFile(
    key: 'cccdFront' | 'cccdBack' | 'selfie',
    file: File | null,
  ) {
    if (file && file.size > MAX_IMAGE_BYTES) {
      setFileErrors((p) => ({
        ...p,
        [key]: 'Ảnh vượt quá 5MB, vui lòng chọn ảnh nhỏ hơn.',
      }));
      return;
    }
    setFileErrors((p) => {
      const { [key]: _drop, ...rest } = p;
      return rest;
    });
    setField(key, file);
  }

  function setDocFile(file: File | null) {
    if (file && file.size > MAX_DOC_BYTES) {
      setFileErrors((p) => ({
        ...p,
        propertyDocFile: 'Tệp vượt quá 10MB, vui lòng chọn tệp nhỏ hơn.',
      }));
      return;
    }
    setFileErrors((p) => {
      const { propertyDocFile: _drop, ...rest } = p;
      return rest;
    });
    setField('propertyDocFile', file);
  }

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!state.cccdFront) m.push('Ảnh CCCD mặt trước');
    if (!state.cccdBack) m.push('Ảnh CCCD mặt sau');
    if (!state.selfie) m.push('Ảnh selfie cầm CCCD');
    if (!state.bankAccount.trim()) m.push('Số tài khoản ngân hàng');
    if (!state.bankName.trim()) m.push('Ngân hàng');
    if (!state.bankAccountHolder.trim()) m.push('Tên chủ tài khoản');
    if (!state.propertyDocType) m.push('Loại giấy tờ chứng minh');
    if (!state.propertyDocFile) m.push('Tải lên giấy tờ');
    if (!state.consentTruthful) m.push('Cam kết thông tin trung thực');
    if (!state.consentDataProcessing) m.push('Đồng ý xử lý dữ liệu cá nhân');
    return m;
  }, [state]);

  const canSubmit = missing.length === 0 && Object.keys(fileErrors).length === 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 400));
      toast.success(
        'Đã gửi hồ sơ KYC. Bạn sẽ nhận thông báo trong 2-3 ngày.',
      );
      setState(INITIAL_STATE);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CCCD section */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          1. Giấy tờ tùy thân (CCCD)
        </h2>
        <p className="mt-1 text-xs text-ink-500">
          Ảnh phải rõ nét, không che thông tin. Hệ thống tự động kiểm tra trùng
          khớp.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <FileUpload
            id="cccdFront"
            label="Ảnh CCCD mặt trước"
            required
            accept="image/*"
            file={state.cccdFront}
            onChange={(f) => setImageFile('cccdFront', f)}
            error={fileErrors.cccdFront}
          />
          <FileUpload
            id="cccdBack"
            label="Ảnh CCCD mặt sau"
            required
            accept="image/*"
            file={state.cccdBack}
            onChange={(f) => setImageFile('cccdBack', f)}
            error={fileErrors.cccdBack}
          />
          <FileUpload
            id="selfie"
            label="Ảnh selfie cầm CCCD"
            required
            accept="image/*"
            file={state.selfie}
            onChange={(f) => setImageFile('selfie', f)}
            error={fileErrors.selfie}
          />
        </div>
      </section>

      {/* Bank section */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          2. Tài khoản ngân hàng nhận thanh toán
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="bankAccount" required>
              Số tài khoản ngân hàng
            </Label>
            <Input
              id="bankAccount"
              inputMode="numeric"
              value={state.bankAccount}
              onChange={(e) =>
                setField('bankAccount', e.target.value.replace(/\D/g, ''))
              }
              placeholder="VD: 0123456789"
            />
          </div>
          <div>
            <Label htmlFor="bankName" required>
              Ngân hàng
            </Label>
            <select
              id="bankName"
              value={state.bankName}
              onChange={(e) => setField('bankName', e.target.value)}
              className={cn(
                'h-11 w-full rounded-[10px] border border-ink-300 bg-white px-4 text-sm',
                'focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-100',
              )}
            >
              <option value="">— Chọn ngân hàng —</option>
              {BANK_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="bankAccountHolder" required>
              Tên chủ tài khoản (in hoa, đúng CCCD)
            </Label>
            <Input
              id="bankAccountHolder"
              value={state.bankAccountHolder}
              onChange={(e) =>
                setField('bankAccountHolder', e.target.value.toUpperCase())
              }
              placeholder="VD: NGUYEN VAN A"
              className="uppercase"
            />
          </div>
        </div>
      </section>

      {/* Property document section */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          3. Giấy tờ chứng minh quyền sử dụng cơ sở
        </h2>
        <p className="mt-1 text-xs text-ink-500">
          Địa chỉ trên giấy tờ phải khớp với địa chỉ cơ sở bạn sẽ đăng. Admin sẽ
          kiểm tra trong 2-3 ngày làm việc.
        </p>

        <div className="mt-5 space-y-3">
          {PROPERTY_DOC_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-all',
                state.propertyDocType === opt.value
                  ? 'border-navy-900 bg-navy-50'
                  : 'border-ink-200 hover:border-ink-400',
              )}
            >
              <input
                type="radio"
                name="propertyDocType"
                value={opt.value}
                checked={state.propertyDocType === opt.value}
                onChange={() => setField('propertyDocType', opt.value)}
                className="mt-0.5 h-4 w-4"
              />
              <span className="text-sm font-medium text-ink-900">
                {opt.label}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-5">
          <FileUpload
            id="propertyDocFile"
            label="Tải lên giấy tờ (ảnh hoặc PDF)"
            required
            accept="image/*,application/pdf"
            file={state.propertyDocFile}
            onChange={(f) => setDocFile(f)}
            error={fileErrors.propertyDocFile}
            hint="Tối đa 10MB. Ảnh JPG/PNG hoặc PDF."
          />
        </div>
      </section>

      {/* Consent section */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          4. Cam kết & đồng ý
        </h2>
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-cream-100">
            <input
              type="checkbox"
              checked={state.consentTruthful}
              onChange={(e) => setField('consentTruthful', e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span className="text-sm text-ink-700">
              Tôi cam kết các thông tin và giấy tờ trên là thật và đầy đủ. Khai
              gian có thể bị xử lý theo pháp luật.
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-cream-100">
            <input
              type="checkbox"
              checked={state.consentDataProcessing}
              onChange={(e) =>
                setField('consentDataProcessing', e.target.checked)
              }
              className="mt-0.5 h-4 w-4"
            />
            <span className="text-sm text-ink-700">
              Tôi đồng ý cho Halong24h xử lý dữ liệu cá nhân theo Nghị định
              13/2023.
            </span>
          </label>
        </div>
      </section>

      {/* Submit */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
        {!canSubmit && missing.length > 0 && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            <p className="font-semibold">Vui lòng điền:</p>
            <ul className="mt-1 list-disc pl-5">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-500">
            Sau khi gửi, admin sẽ duyệt hồ sơ trong 2-3 ngày làm việc.
          </p>
          <Button type="submit" disabled={!canSubmit || pending}>
            {pending ? 'Đang gửi...' : 'Gửi hồ sơ KYC'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function FileUpload({
  id,
  label,
  required,
  accept,
  file,
  onChange,
  error,
  hint,
}: {
  id: string;
  label: string;
  required?: boolean;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <label
        htmlFor={id}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border-2 border-dashed p-4 text-center text-xs transition-all',
          file
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
            : 'border-ink-300 bg-cream-50 text-ink-500 hover:border-ink-400',
        )}
      >
        <span className="text-2xl">{file ? '✓' : '📎'}</span>
        <span className="font-medium">
          {file ? file.name : 'Bấm để chọn tệp'}
        </span>
        {file && (
          <span className="text-[10px] text-ink-500">
            {(file.size / 1024).toFixed(0)} KB
          </span>
        )}
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </label>
      {hint && !error && (
        <p className="mt-1 text-[11px] text-ink-500">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
