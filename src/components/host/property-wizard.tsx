'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  createPropertyAction,
  updatePropertyAction,
} from '@/app/actions/properties';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import {
  SUBSCRIPTION_SETTINGS_PATH,
  isFeatureLockedError,
} from '@/lib/entitlement';
import type {
  CreatePropertyInput,
  Property,
} from '@/core/entities/property';
import {
  CancellationPolicy,
  PropertyType,
  PropertyView,
  cancellationPolicyLabel,
  propertyTypeLabel,
} from '@/core/value-objects/property-type';
import { cn } from '@/lib/utils';

type WizardData = Partial<CreatePropertyInput> & {
  weekdayPrice?: number;
  weekendPrice?: number;
  holidayPrice?: number;
  adultSurcharge?: number;
  childSurcharge?: number;
};

interface PropertyWizardProps {
  property?: Property | null;
}

const AMENITIES = [
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'pool', label: 'Hồ bơi' },
  { key: 'parking', label: 'Bãi đỗ' },
  { key: 'ac', label: 'Điều hòa' },
  { key: 'kitchen', label: 'Bếp đầy đủ' },
  { key: 'kitchenette', label: 'Bếp nhỏ' },
  { key: 'bbq', label: 'BBQ' },
  { key: 'balcony', label: 'Ban công' },
  { key: 'breakfast', label: 'Bữa sáng' },
  { key: 'gym', label: 'Gym' },
  { key: 'spa', label: 'Spa' },
  { key: 'tv', label: 'TV' },
  { key: 'washer', label: 'Máy giặt' },
  { key: 'workspace', label: 'Bàn làm việc' },
];

const SERVICES = [
  { key: 'airport_transfer', label: 'Đưa đón sân bay' },
  { key: 'tour', label: 'Tour Vịnh Hạ Long' },
  { key: 'cleaning', label: 'Dọn phòng hàng ngày' },
  { key: 'laundry', label: 'Giặt là' },
  { key: 'cooking', label: 'Đầu bếp riêng' },
  { key: 'bbq_setup', label: 'Set-up BBQ' },
];

const STEPS = [
  { title: 'Cơ bản', desc: 'Tên, loại, mô tả' },
  { title: 'Vị trí & sức chứa', desc: 'Địa chỉ + số phòng/khách' },
  { title: 'Tiện nghi & quy định', desc: 'Amenities, dịch vụ, chính sách' },
  { title: 'Giá phòng', desc: 'Giá theo ngày + phụ thu' },
] as const;

function propertyToWizard(p: Property): WizardData {
  return {
    name: p.name,
    type: p.type,
    code: p.code,
    view: p.view ?? undefined,
    address: p.address ?? undefined,
    mapLink: p.mapLink ?? undefined,
    bedrooms: p.bedrooms ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    standardGuests: p.standardGuests ?? undefined,
    maxGuests: p.maxGuests ?? undefined,
    amenities: p.amenities,
    services: p.services,
    description: p.description ?? undefined,
    rules: p.rules ?? undefined,
    cancellationPolicy: p.cancellationPolicy ?? undefined,
    checkInTime: p.checkInTime ?? undefined,
    checkOutTime: p.checkOutTime ?? undefined,
    childrenPolicy: p.childrenPolicy ?? undefined,
    petPolicy: p.petPolicy ?? undefined,
    smokingPolicy: p.smokingPolicy ?? undefined,
    partyPolicy: p.partyPolicy ?? undefined,
    quietHoursStart: p.quietHoursStart ?? undefined,
    quietHoursEnd: p.quietHoursEnd ?? undefined,
    weekdayPrice: (p.weekdayPrice ?? undefined) as number | undefined,
    weekendPrice: (p.weekendPrice ?? undefined) as number | undefined,
    holidayPrice: (p.holidayPrice ?? undefined) as number | undefined,
    adultSurcharge: (p.adultSurcharge ?? undefined) as number | undefined,
    childSurcharge: (p.childSurcharge ?? undefined) as number | undefined,
  };
}

const POLICY_DEFAULTS = {
  checkInTime: '14:00',
  checkOutTime: '12:00',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
} as const;

const CHILDREN_POLICY_OPTIONS = [
  { value: 'allowed', label: 'Cho phép trẻ em' },
  { value: 'with_conditions', label: 'Cho phép kèm điều kiện' },
  { value: 'not_allowed', label: 'Không cho phép' },
] as const;

const PET_POLICY_OPTIONS = [
  { value: 'allowed', label: 'Cho phép thú cưng' },
  { value: 'with_fee', label: 'Có phụ phí thú cưng' },
  { value: 'not_allowed', label: 'Không cho phép' },
] as const;

const SMOKING_POLICY_OPTIONS = [
  { value: 'allowed', label: 'Cho phép trong khuôn viên' },
  { value: 'outdoor_only', label: 'Chỉ ngoài trời / ban công' },
  { value: 'not_allowed', label: 'Cấm tuyệt đối' },
] as const;

const PARTY_POLICY_OPTIONS = [
  { value: 'allowed', label: 'Cho phép' },
  { value: 'small_only', label: 'Nhóm nhỏ ≤ N người (chủ duyệt trước)' },
  { value: 'not_allowed', label: 'Không cho phép' },
] as const;

const DRAFT_STORAGE_KEY = 'hl_wizard_draft';
const DRAFT_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

interface DraftEnvelope {
  ts: number;
  data: WizardData;
  step: number;
}

export function PropertyWizard({ property }: PropertyWizardProps) {
  const router = useRouter();
  const isEdit = !!property;
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(
    property ? propertyToWizard(property) : { type: PropertyType.VILLA },
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const restoredRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft from sessionStorage on mount (create mode only)
  useEffect(() => {
    if (isEdit || restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw =
        typeof window !== 'undefined'
          ? window.sessionStorage.getItem(DRAFT_STORAGE_KEY)
          : null;
      if (!raw) return;
      const env = JSON.parse(raw) as DraftEnvelope;
      if (!env || typeof env.ts !== 'number') return;
      if (Date.now() - env.ts > DRAFT_MAX_AGE_MS) {
        window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        return;
      }
      if (env.data && typeof env.data === 'object') {
        setData(env.data);
        if (typeof env.step === 'number' && env.step >= 0 && env.step < STEPS.length) {
          setStep(env.step);
        }
        toast.success('Đã khôi phục bản nháp');
      }
    } catch {
      // ignore corrupted draft
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft (debounced)
  useEffect(() => {
    if (isEdit) return;
    if (typeof window === 'undefined') return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const env: DraftEnvelope = { ts: Date.now(), data, step };
        window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(env));
      } catch {
        // ignore quota errors
      }
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [data, step, isEdit]);

  function clearDraft() {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }

  function discardDraft() {
    clearDraft();
    setData({ type: PropertyType.VILLA });
    setStep(0);
    setError(null);
    setFieldErrors({});
    toast.success('Đã xóa bản nháp');
  }

  function update<K extends keyof WizardData>(k: K, v: WizardData[K]) {
    setData((prev) => ({ ...prev, [k]: v }));
  }

  function toggleArray(key: 'amenities' | 'services', val: string) {
    setData((prev) => {
      const arr = prev[key] ?? [];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });
  }

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!data.name?.trim()) return 'Vui lòng nhập tên cơ sở';
      if (!data.code?.trim()) return 'Vui lòng nhập mã cơ sở (code unique)';
      if (data.type === undefined) return 'Chọn loại cơ sở';
      if (data.description && data.description.length > 5000) {
        return 'Mô tả tối đa 5000 ký tự';
      }
    }
    if (s === 1) {
      if (data.mapLink) {
        try {
          new URL(data.mapLink);
        } catch {
          return 'Link bản đồ không hợp lệ';
        }
      }
      if (!data.maxGuests || data.maxGuests <= 0) {
        return 'Số khách tối đa phải ≥ 1';
      }
      if (!data.standardGuests || data.standardGuests <= 0) {
        return 'Số khách tiêu chuẩn phải ≥ 1';
      }
      if (data.maxGuests < data.standardGuests) {
        return 'Số khách tối đa phải ≥ số khách tiêu chuẩn';
      }
      if (data.bedrooms !== undefined && data.bedrooms < 0) {
        return 'Số phòng ngủ không hợp lệ';
      }
      if (data.bathrooms !== undefined && data.bathrooms < 0) {
        return 'Số phòng tắm không hợp lệ';
      }
    }
    if (s === 2) {
      if (
        data.quietHoursStart &&
        data.quietHoursEnd &&
        data.quietHoursStart === data.quietHoursEnd
      ) {
        return 'Giờ yên tĩnh: bắt đầu và kết thúc không được trùng';
      }
      if (
        data.checkInTime &&
        data.checkOutTime &&
        data.checkInTime === data.checkOutTime
      ) {
        return 'Giờ check-in và check-out không được trùng';
      }
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prev() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    startTransition(async () => {
      const payload = stripEmpty(data);
      const result = isEdit
        ? await updatePropertyAction(property!.id, payload)
        : await createPropertyAction(payload);

      if (!result.ok) {
        setError(result.error);
        if (result.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.fieldErrors)) {
            if (v[0]) flat[k] = v[0];
          }
          setFieldErrors(flat);
        }
        return;
      }

      if (!isEdit) {
        clearDraft();
        router.push(`/host/properties/${result.data.id}?created=1`);
      } else {
        setSuccess(true);
      }
    });
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="space-y-6">
      <Stepper current={step} onJump={isEdit ? setStep : undefined} />

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {error}
          {isFeatureLockedError(error) && (
            <Link
              href={SUBSCRIPTION_SETTINGS_PATH}
              className="ml-1 font-semibold underline"
            >
              Đăng ký / gia hạn gói
            </Link>
          )}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
          ✓ Đã lưu thay đổi.
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card lg:p-8">
        {step === 0 && (
          <Step0 data={data} update={update} fieldErrors={fieldErrors} />
        )}
        {step === 1 && (
          <Step1 data={data} update={update} fieldErrors={fieldErrors} />
        )}
        {step === 2 && (
          <Step2
            data={data}
            update={update}
            toggleArray={toggleArray}
            fieldErrors={fieldErrors}
          />
        )}
        {step === 3 && (
          <Step3 data={data} update={update} fieldErrors={fieldErrors} />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-ink-200 pt-6">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={prev}
            disabled={step === 0 || pending}
          >
            ← Quay lại
          </Button>
          {!isEdit && (
            <Button
              type="button"
              variant="ghost"
              onClick={discardDraft}
              disabled={pending}
              className="text-xs text-ink-500"
            >
              Xóa bản nháp
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-500">
            Bước {step + 1} / {STEPS.length}
          </span>
          {isLast ? (
            <Button type="button" onClick={submit} disabled={pending}>
              {pending
                ? isEdit
                  ? 'Đang lưu...'
                  : 'Đang tạo...'
                : isEdit
                  ? 'Lưu thay đổi'
                  : 'Tạo cơ sở'}
            </Button>
          ) : (
            <Button type="button" onClick={next} disabled={pending}>
              Tiếp tục →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({
  current,
  onJump,
}: {
  current: number;
  onJump?: (i: number) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = !!onJump;
        return (
          <li key={s.title} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => clickable && onJump(i)}
              disabled={!clickable}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                active && 'bg-ink-900 text-white',
                done && 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
                !active && !done && 'bg-ink-100 text-ink-500',
                clickable && !active && 'cursor-pointer',
              )}
            >
              <span
                className={cn(
                  'grid h-5 w-5 place-items-center rounded-full text-[10px]',
                  active && 'bg-white text-ink-900',
                  done && 'bg-emerald-600 text-white',
                  !active && !done && 'bg-white text-ink-500',
                )}
              >
                {done ? '✓' : i + 1}
              </span>
              {s.title}
            </button>
            {i < STEPS.length - 1 && (
              <span className="h-px w-6 bg-ink-200 sm:w-10" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface StepProps {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
  fieldErrors: Record<string, string>;
}

function Step0({ data, update, fieldErrors }: StepProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
        {STEPS[0].title}
      </h2>
      <div>
        <Label required>Loại cơ sở</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {[PropertyType.VILLA, PropertyType.HOMESTAY, PropertyType.HOTEL].map(
            (t) => (
              <label
                key={t}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 transition-all',
                  data.type === t
                    ? 'border-navy-900 bg-navy-50'
                    : 'border-ink-200 hover:border-ink-400',
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={data.type === t}
                  onChange={() => update('type', t)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold text-ink-900">
                  {propertyTypeLabel(t)}
                </span>
              </label>
            ),
          )}
        </div>
        {fieldErrors.type && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.type}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name" required>
            Tên cơ sở
          </Label>
          <Input
            id="name"
            value={data.name ?? ''}
            onChange={(e) => update('name', e.target.value)}
            placeholder="VD: À La Carte Hạ Long Bay"
            maxLength={200}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
          )}
        </div>
        <div>
          <Label htmlFor="code" required>
            Mã cơ sở (code, unique)
          </Label>
          <Input
            id="code"
            value={data.code ?? ''}
            onChange={(e) =>
              update(
                'code',
                e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
              )
            }
            placeholder="VD: ALC-001"
            className="font-mono uppercase"
            maxLength={64}
          />
          {fieldErrors.code && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.code}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          rows={5}
          value={data.description ?? ''}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Mô tả cơ sở: vị trí, không gian, điểm nổi bật..."
          maxLength={5000}
        />
        <p className="mt-1 text-[11px] text-ink-500">
          {(data.description ?? '').length}/5000 ký tự
        </p>
      </div>
    </div>
  );
}

function Step1({ data, update, fieldErrors }: StepProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
        {STEPS[1].title}
      </h2>

      <div>
        <Label htmlFor="address">Địa chỉ</Label>
        <Input
          id="address"
          value={data.address ?? ''}
          onChange={(e) => update('address', e.target.value)}
          placeholder="Số nhà, đường, phường, quận, Hạ Long, Quảng Ninh"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="mapLink">Link Google Maps</Label>
          <Input
            id="mapLink"
            type="url"
            value={data.mapLink ?? ''}
            onChange={(e) => update('mapLink', e.target.value)}
            placeholder="https://maps.google.com/..."
          />
          {fieldErrors.mapLink && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.mapLink}</p>
          )}
        </div>
        <div>
          <Label>Hướng nhìn</Label>
          <div className="flex gap-2">
            {([undefined, ...PropertyView] as Array<PropertyView | undefined>).map(
              (v) => {
                const id = v ?? 'none';
                return (
                  <label
                    key={id}
                    className={cn(
                      'flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm transition-all',
                      data.view === v
                        ? 'border-navy-900 bg-navy-50 font-semibold'
                        : 'border-ink-200 hover:border-ink-400',
                    )}
                  >
                    <input
                      type="radio"
                      name="view"
                      value={id}
                      checked={data.view === v}
                      onChange={() => update('view', v)}
                      className="sr-only"
                    />
                    {v === 'sea' ? '🌊 View biển' : v === 'city' ? '🏙️ View phố' : 'Không có'}
                  </label>
                );
              },
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField
          label="Số phòng ngủ"
          value={data.bedrooms}
          onChange={(v) => update('bedrooms', v)}
          min={0}
          max={100}
        />
        <NumberField
          label="Số phòng tắm"
          value={data.bathrooms}
          onChange={(v) => update('bathrooms', v)}
          min={0}
          max={100}
        />
        <NumberField
          label="Khách tiêu chuẩn"
          value={data.standardGuests}
          onChange={(v) => update('standardGuests', v)}
          min={1}
          max={500}
        />
        <NumberField
          label="Khách tối đa"
          value={data.maxGuests}
          onChange={(v) => update('maxGuests', v)}
          min={1}
          max={500}
        />
      </div>
    </div>
  );
}

function Step2({
  data,
  update,
  toggleArray,
  fieldErrors,
}: StepProps & {
  toggleArray: (key: 'amenities' | 'services', val: string) => void;
}) {
  const allAmenities = (data.amenities ?? []).length === AMENITIES.length;
  const allServices = (data.services ?? []).length === SERVICES.length;

  function toggleAll(key: 'amenities' | 'services') {
    const isAll = key === 'amenities' ? allAmenities : allServices;
    const keys = isAll
      ? []
      : (key === 'amenities' ? AMENITIES : SERVICES).map((x) => x.key);
    update(key, keys);
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
        {STEPS[2].title}
      </h2>

      <div>
        <div className="flex items-center justify-between">
          <Label>Tiện nghi</Label>
          <button
            type="button"
            onClick={() => toggleAll('amenities')}
            className="mb-1.5 text-xs font-medium text-navy-700 hover:underline"
          >
            {allAmenities ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {AMENITIES.map((a) => {
            const checked = (data.amenities ?? []).includes(a.key);
            return (
              <label
                key={a.key}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all',
                  checked
                    ? 'border-navy-900 bg-navy-50'
                    : 'border-ink-200 hover:border-ink-400',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleArray('amenities', a.key)}
                />
                <span>{a.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Dịch vụ thêm</Label>
          <button
            type="button"
            onClick={() => toggleAll('services')}
            className="mb-1.5 text-xs font-medium text-navy-700 hover:underline"
          >
            {allServices ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {SERVICES.map((s) => {
            const checked = (data.services ?? []).includes(s.key);
            return (
              <label
                key={s.key}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all',
                  checked
                    ? 'border-navy-900 bg-navy-50'
                    : 'border-ink-200 hover:border-ink-400',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleArray('services', s.key)}
                />
                <span>{s.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Chính sách hủy</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            CancellationPolicy.FLEXIBLE,
            CancellationPolicy.MODERATE,
            CancellationPolicy.STRICT,
          ].map((p) => (
            <label
              key={p}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 transition-all',
                data.cancellationPolicy === p
                  ? 'border-navy-900 bg-navy-50'
                  : 'border-ink-200 hover:border-ink-400',
              )}
            >
              <input
                type="radio"
                name="cancellationPolicy"
                checked={data.cancellationPolicy === p}
                onChange={() => update('cancellationPolicy', p)}
              />
              <span className="text-sm font-semibold text-ink-900">
                {cancellationPolicyLabel(p)}
              </span>
            </label>
          ))}
        </div>
        {fieldErrors.cancellationPolicy && (
          <p className="mt-1 text-xs text-red-600">
            {fieldErrors.cancellationPolicy}
          </p>
        )}
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold tracking-tight text-navy-900">
          Nội quy & giờ giấc
        </h3>
        <p className="mt-0.5 text-xs text-ink-500">
          Khách sẽ thấy rõ trước khi đặt phòng.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <PolicySelect
            id="childrenPolicy"
            label="Trẻ em"
            value={data.childrenPolicy ?? ''}
            onChange={(v) =>
              update('childrenPolicy', v as WizardData['childrenPolicy'])
            }
            options={CHILDREN_POLICY_OPTIONS}
          />
          <PolicySelect
            id="petPolicy"
            label="Thú cưng"
            value={data.petPolicy ?? ''}
            onChange={(v) => update('petPolicy', v as WizardData['petPolicy'])}
            options={PET_POLICY_OPTIONS}
          />
          <PolicySelect
            id="smokingPolicy"
            label="Hút thuốc"
            value={data.smokingPolicy ?? ''}
            onChange={(v) =>
              update('smokingPolicy', v as WizardData['smokingPolicy'])
            }
            options={SMOKING_POLICY_OPTIONS}
          />
          <PolicySelect
            id="partyPolicy"
            label="Tổ chức tiệc"
            value={data.partyPolicy ?? ''}
            onChange={(v) =>
              update('partyPolicy', v as WizardData['partyPolicy'])
            }
            options={PARTY_POLICY_OPTIONS}
          />

          <div>
            <Label>Giờ check-in / check-out</Label>
            <div className="flex items-center gap-2">
              <TimeSelect24
                ariaLabel="Giờ check-in"
                value={data.checkInTime ?? POLICY_DEFAULTS.checkInTime}
                onChange={(v) => update('checkInTime', v)}
              />
              <span className="text-xs text-ink-500">đến</span>
              <TimeSelect24
                ariaLabel="Giờ check-out"
                value={data.checkOutTime ?? POLICY_DEFAULTS.checkOutTime}
                onChange={(v) => update('checkOutTime', v)}
              />
            </div>
          </div>

          <div>
            <Label>Giờ yên tĩnh</Label>
            <div className="flex items-center gap-2">
              <TimeSelect24
                ariaLabel="Giờ yên tĩnh bắt đầu"
                value={data.quietHoursStart ?? POLICY_DEFAULTS.quietHoursStart}
                onChange={(v) => update('quietHoursStart', v)}
              />
              <span className="text-xs text-ink-500">đến</span>
              <TimeSelect24
                ariaLabel="Giờ yên tĩnh kết thúc"
                value={data.quietHoursEnd ?? POLICY_DEFAULTS.quietHoursEnd}
                onChange={(v) => update('quietHoursEnd', v)}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="rules">Quy định nội bộ (bổ sung)</Label>
        <Textarea
          id="rules"
          rows={3}
          value={data.rules ?? ''}
          onChange={(e) => update('rules', e.target.value)}
          placeholder="Quy định bổ sung ngoài 6 nội quy trên (tùy chọn)..."
        />
      </div>
    </div>
  );
}

/** 2 dropdown giờ (0–23) + phút riêng biệt, hiển thị 24h — thay input type="time" vì trình duyệt hiện AM/PM theo locale hệ điều hành. */
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0'),
);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, '0'),
);

function TimeSelect24({
  value,
  onChange,
  ariaLabel,
}: {
  value: string; // "HH:mm"
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  const [hour = '00', minute = '00'] = value.split(':');
  // Phút lẻ (VD "17" từ bản nháp cũ) vẫn hiển thị được, không bị mất.
  const minuteOptions = MINUTE_OPTIONS.includes(minute)
    ? MINUTE_OPTIONS
    : [minute, ...MINUTE_OPTIONS];
  const selectClass = cn(
    'h-11 rounded-[10px] border border-ink-300 bg-white px-2.5 text-sm',
    'focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-100',
  );
  return (
    <div className="flex items-center gap-1">
      <select
        aria-label={`${ariaLabel} — giờ`}
        value={hour}
        onChange={(e) => onChange(`${e.target.value}:${minute}`)}
        className={selectClass}
      >
        {HOUR_OPTIONS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-xs text-ink-500">giờ</span>
      <select
        aria-label={`${ariaLabel} — phút`}
        value={minute}
        onChange={(e) => onChange(`${hour}:${e.target.value}`)}
        className={selectClass}
      >
        {minuteOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <span className="text-xs text-ink-500">phút</span>
    </div>
  );
}

function PolicySelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-11 w-full rounded-[10px] border border-ink-300 bg-white px-4 text-sm',
          'focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-100',
        )}
      >
        <option value="">— Chưa chọn —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Step3({ data, update, fieldErrors }: StepProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
        {STEPS[3].title}
      </h2>
      <p className="text-sm text-ink-500">
        Giá đơn vị VNĐ / đêm. Có thể bỏ trống ở bước này — Quản lý giá chi tiết
        ở mục riêng sau khi tạo.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PriceField
          label="Giá ngày thường"
          hint="Thứ 2 - Thứ 5"
          value={data.weekdayPrice}
          onChange={(v) => update('weekdayPrice', v)}
        />
        <PriceField
          label="Giá cuối tuần"
          hint="Thứ 6, 7, CN"
          value={data.weekendPrice}
          onChange={(v) => update('weekendPrice', v)}
        />
        <PriceField
          label="Giá lễ tết"
          hint="Áp dụng ngày đặc biệt"
          value={data.holidayPrice}
          onChange={(v) => update('holidayPrice', v)}
        />
        <PriceField
          label="Phụ thu mỗi khách lớn"
          hint="Vượt số khách tiêu chuẩn"
          value={data.adultSurcharge}
          onChange={(v) => update('adultSurcharge', v)}
        />
        <PriceField
          label="Phụ thu mỗi khách trẻ"
          hint="Trẻ em vượt giới hạn"
          value={data.childSurcharge}
          onChange={(v) => update('childSurcharge', v)}
        />
      </div>

      {fieldErrors.weekdayPrice && (
        <p className="text-xs text-red-600">{fieldErrors.weekdayPrice}</p>
      )}
      {data.weekdayPrice !== undefined &&
        data.weekendPrice !== undefined &&
        data.weekdayPrice > data.weekendPrice && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
            Lưu ý: giá ngày thường cao hơn cuối tuần — bất thường? Bạn vẫn có
            thể tiếp tục.
          </p>
        )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange(undefined);
            return;
          }
          const num = Number(raw);
          if (!Number.isFinite(num)) return;
          let clamped = num;
          if (min !== undefined) clamped = Math.max(min, clamped);
          if (max !== undefined) clamped = Math.min(max, clamped);
          onChange(clamped);
        }}
      />
    </div>
  );
}

const PRICE_MAX = 100_000_000;

/** "1500000" → "1.500.000" (dấu chấm ngăn cách hàng nghìn kiểu VN). */
function formatThousands(n: number): string {
  return n.toLocaleString('vi-VN');
}

function PriceField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          value={value !== undefined ? formatThousands(value) : ''}
          onChange={(e) => {
            // Bỏ mọi ký tự không phải số (dấu chấm format, chữ dán nhầm…)
            const digits = e.target.value.replace(/\D/g, '');
            if (digits === '') {
              onChange(undefined);
              return;
            }
            const num = Number(digits);
            if (!Number.isFinite(num)) return;
            onChange(Math.min(PRICE_MAX, num));
          }}
          className="pr-12"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-500">
          VNĐ
        </span>
      </div>
      {hint && <p className="mt-1 text-[11px] text-ink-500">{hint}</p>}
    </div>
  );
}

function stripEmpty(d: WizardData): WizardData {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) {
    if (v === undefined || v === '' || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as WizardData;
}
