'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

import {
  createYachtAction,
  updateYachtAction,
  updateYachtPricesAction,
} from '@/app/actions/yachts';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { refetchApiResources } from '@/lib/use-api-resource';
import type { Yacht, YachtItineraryStep } from '@/core/entities/yacht';
import {
  CancellationPolicy,
  cancellationPolicyLabel,
} from '@/core/value-objects/property-type';

interface YachtFormProps {
  yacht?: Yacht | null;
}

interface FormState {
  name: string;
  code: string;
  description: string;
  shipType: string;
  departurePoint: string;
  durationText: string;
  cabins: string;
  maxGuests: string;
  lengthMeters: string;
  rules: string;
  cancellationPolicy: string;
  checkInTime: string;
  checkOutTime: string;
  weekdayPrice: string;
  weekendPrice: string;
  holidayPrice: string;
  weekdayChildPrice: string;
  weekendChildPrice: string;
  holidayChildPrice: string;
}

const SHIP_TYPES = ['Steel', 'Composite', 'Gỗ', 'Du thuyền ngủ đêm', 'Tàu tham quan'];

function num(v: string): number | undefined {
  const n = Number(v);
  return v.trim() === '' || !Number.isFinite(n) ? undefined : n;
}

function priceNum(v: string): number {
  const n = Number(v);
  return v.trim() === '' || !Number.isFinite(n) ? 0 : Math.max(0, Math.round(n));
}

function toInitial(y?: Yacht | null): FormState {
  return {
    name: y?.name ?? '',
    code: y?.code ?? '',
    description: y?.description ?? '',
    shipType: y?.shipType ?? '',
    departurePoint: y?.departurePoint ?? '',
    durationText: y?.durationText ?? '',
    cabins: y?.cabins != null ? String(y.cabins) : '',
    maxGuests: y?.maxGuests != null ? String(y.maxGuests) : '',
    lengthMeters: y?.lengthMeters != null ? String(y.lengthMeters) : '',
    rules: y?.rules ?? '',
    cancellationPolicy: y?.cancellationPolicy != null ? String(y.cancellationPolicy) : '0',
    checkInTime: y?.checkInTime ?? '08:00',
    checkOutTime: y?.checkOutTime ?? '16:00',
    weekdayPrice: y?.weekdayPrice != null ? String(y.weekdayPrice) : '',
    weekendPrice: y?.weekendPrice != null ? String(y.weekendPrice) : '',
    holidayPrice: y?.holidayPrice != null ? String(y.holidayPrice) : '',
    weekdayChildPrice: y?.weekdayChildPrice != null ? String(y.weekdayChildPrice) : '',
    weekendChildPrice: y?.weekendChildPrice != null ? String(y.weekendChildPrice) : '',
    holidayChildPrice: y?.holidayChildPrice != null ? String(y.holidayChildPrice) : '',
  };
}

export function YachtForm({ yacht }: YachtFormProps) {
  const router = useRouter();
  const isEdit = Boolean(yacht);
  const [form, setForm] = useState<FormState>(() => toInitial(yacht));
  const [itinerary, setItinerary] = useState<YachtItineraryStep[]>(
    yacht?.itinerary?.length
      ? yacht.itinerary
      : [{ order: 1, title: '', time: '', description: '' }],
  );
  const [amenities, setAmenities] = useState<string[]>(yacht?.amenities ?? []);
  const [services, setServices] = useState<string[]>(yacht?.services ?? []);
  const [amenityDraft, setAmenityDraft] = useState('');
  const [serviceDraft, setServiceDraft] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (k: keyof FormState) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  function addTag(
    draft: string,
    list: string[],
    setList: (v: string[]) => void,
    setDraft: (v: string) => void,
  ) {
    const t = draft.trim();
    if (t && !list.includes(t)) setList([...list, t]);
    setDraft('');
  }

  function updateStep(i: number, patch: Partial<YachtItineraryStep>) {
    setItinerary((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  }

  function addStep() {
    setItinerary((prev) => [
      ...prev,
      { order: prev.length + 1, title: '', time: '', description: '' },
    ]);
  }

  function removeStep(i: number) {
    setItinerary((prev) =>
      prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })),
    );
  }

  function buildPayload() {
    return {
      name: form.name,
      code: form.code,
      description: form.description || undefined,
      shipType: form.shipType || undefined,
      departurePoint: form.departurePoint || undefined,
      durationText: form.durationText || undefined,
      cabins: num(form.cabins),
      maxGuests: num(form.maxGuests),
      lengthMeters: num(form.lengthMeters),
      rules: form.rules || undefined,
      cancellationPolicy: Number(form.cancellationPolicy) as 0 | 1 | 2,
      checkInTime: form.checkInTime || undefined,
      checkOutTime: form.checkOutTime || undefined,
      itinerary: itinerary
        .filter((s) => s.title.trim())
        .map((s, i) => ({
          order: i + 1,
          title: s.title.trim(),
          time: s.time?.trim() || undefined,
          description: s.description?.trim() || undefined,
        })),
      amenities,
      services,
    };
  }

  function prices() {
    // Giá người lớn bắt buộc (mặc định 0); giá trẻ em bỏ trống = miễn phí (omit).
    return {
      weekdayPrice: priceNum(form.weekdayPrice),
      weekendPrice: priceNum(form.weekendPrice),
      holidayPrice: priceNum(form.holidayPrice),
      weekdayChildPrice: form.weekdayChildPrice.trim()
        ? priceNum(form.weekdayChildPrice)
        : undefined,
      weekendChildPrice: form.weekendChildPrice.trim()
        ? priceNum(form.weekendChildPrice)
        : undefined,
      holidayChildPrice: form.holidayChildPrice.trim()
        ? priceNum(form.holidayChildPrice)
        : undefined,
    };
  }

  function submit() {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      if (isEdit && yacht) {
        const upd = await updateYachtAction(yacht.id, buildPayload());
        if (!upd.ok) {
          setError(upd.error);
          if (upd.fieldErrors) setFieldErrors(upd.fieldErrors);
          return;
        }
        const pr = await updateYachtPricesAction(yacht.id, prices());
        if (!pr.ok) {
          setError(pr.error);
          if (pr.fieldErrors) setFieldErrors(pr.fieldErrors);
          return;
        }
        toast.success('Đã lưu du thuyền');
        refetchApiResources();
        router.refresh();
      } else {
        const res = await createYachtAction({ ...buildPayload(), ...prices() });
        if (!res.ok) {
          setError(res.error);
          if (res.fieldErrors) setFieldErrors(res.fieldErrors);
          return;
        }
        toast.success('Đã tạo du thuyền');
        router.push(`/admin/yachts/${res.data.id}`);
      }
    });
  }

  const err = (k: string) => fieldErrors[k]?.[0];

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      )}

      <Section title="Thông tin cơ bản">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tên du thuyền" required error={err('name')}>
            <Input value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="Halong Paradise Elegance" />
          </Field>
          <Field
            label="Mã du thuyền"
            required
            error={err('code')}
            hint={isEdit ? 'Không đổi được sau khi tạo' : 'Duy nhất, gồm chữ/số/gạch'}
          >
            <Input
              value={form.code}
              onChange={(e) => set('code')(e.target.value)}
              placeholder="YACHT-001"
              disabled={isEdit}
            />
          </Field>
        </div>
        <Field label="Mô tả" error={err('description')}>
          <Textarea value={form.description} onChange={(e) => set('description')(e.target.value)} rows={4} placeholder="Giới thiệu du thuyền…" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Loại tàu" error={err('shipType')}>
            <Input
              list="yacht-ship-types"
              value={form.shipType}
              onChange={(e) => set('shipType')(e.target.value)}
              placeholder="Steel / Gỗ…"
            />
            <datalist id="yacht-ship-types">
              {SHIP_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Điểm khởi hành" error={err('departurePoint')}>
            <Input value={form.departurePoint} onChange={(e) => set('departurePoint')(e.target.value)} placeholder="Cảng Tuần Châu" />
          </Field>
          <Field
            label="Thời lượng tour"
            error={err('durationText')}
            hint="VD: Tour trong ngày · 6–8 giờ / Tour buổi tối · 3–4 giờ"
          >
            <Input value={form.durationText} onChange={(e) => set('durationText')(e.target.value)} placeholder="Tour trong ngày · 6–8 giờ" />
          </Field>
        </div>
      </Section>

      <Section title="Sức chứa & thông số">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Số cabin" error={err('cabins')}>
            <Input type="number" min={0} value={form.cabins} onChange={(e) => set('cabins')(e.target.value)} />
          </Field>
          <Field label="Sức chứa tối đa (khách/tour)" error={err('maxGuests')}>
            <Input type="number" min={0} value={form.maxGuests} onChange={(e) => set('maxGuests')(e.target.value)} />
          </Field>
          <Field label="Chiều dài (m)" error={err('lengthMeters')}>
            <Input type="number" min={0} step="0.1" value={form.lengthMeters} onChange={(e) => set('lengthMeters')(e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Hành trình trong ngày" subtitle="Các chặng theo giờ (đón khách → tham quan → trả khách).">
        <div className="space-y-3">
          {itinerary.map((step, i) => (
            <div key={i} className="rounded-xl border border-ink-200 bg-cream-50 p-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <Input
                  value={step.title}
                  onChange={(e) => updateStep(i, { title: e.target.value })}
                  placeholder="Tên chặng (VD: Đón khách tại cảng Tuần Châu)"
                  className="flex-1"
                />
                <Input
                  value={step.time ?? ''}
                  onChange={(e) => updateStep(i, { time: e.target.value })}
                  placeholder="08:00"
                  className="w-24"
                />
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Xoá chặng"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                value={step.description ?? ''}
                onChange={(e) => updateStep(i, { description: e.target.value })}
                rows={2}
                placeholder="Mô tả chi tiết chặng (tuỳ chọn)"
                className="mt-2 min-h-[60px]"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-ink-300 px-3 py-2 text-sm font-medium text-ink-700 hover:border-navy-700 hover:text-navy-900"
        >
          <Plus className="h-4 w-4" /> Thêm chặng
        </button>
      </Section>

      <Section title="Tiện nghi & dịch vụ">
        <div className="grid gap-6 sm:grid-cols-2">
          <TagInput
            label="Tiện nghi"
            tags={amenities}
            draft={amenityDraft}
            setDraft={setAmenityDraft}
            onAdd={() => addTag(amenityDraft, amenities, setAmenities, setAmenityDraft)}
            onRemove={(t) => setAmenities(amenities.filter((x) => x !== t))}
            placeholder="Wi-Fi, Bể sục, Bar…"
          />
          <TagInput
            label="Dịch vụ"
            tags={services}
            draft={serviceDraft}
            setDraft={setServiceDraft}
            onAdd={() => addTag(serviceDraft, services, setServices, setServiceDraft)}
            onRemove={(t) => setServices(services.filter((x) => x !== t))}
            placeholder="Đón tiễn, Chèo kayak, Câu mực…"
          />
        </div>
      </Section>

      <Section title="Quy định & chính sách">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Giờ đón khách" hint="Giờ bắt đầu tour">
            <Input type="time" value={form.checkInTime} onChange={(e) => set('checkInTime')(e.target.value)} />
          </Field>
          <Field label="Giờ trả khách" hint="Giờ kết thúc tour">
            <Input type="time" value={form.checkOutTime} onChange={(e) => set('checkOutTime')(e.target.value)} />
          </Field>
          <Field label="Chính sách huỷ">
            <select
              value={form.cancellationPolicy}
              onChange={(e) => set('cancellationPolicy')(e.target.value)}
              className="h-11 w-full rounded-[10px] border border-ink-300 bg-white px-4 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-100"
            >
              {[CancellationPolicy.FLEXIBLE, CancellationPolicy.MODERATE, CancellationPolicy.STRICT].map((p) => (
                <option key={p} value={p}>
                  {cancellationPolicyLabel(p)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Nội quy" error={err('rules')}>
          <Textarea value={form.rules} onChange={(e) => set('rules')(e.target.value)} rows={3} placeholder="Quy định trên tàu…" />
        </Field>
      </Section>

      <Section
        title="Bảng giá (theo đầu người / buổi tour)"
        subtitle="Giá VND/khách theo ngày đi (thường / cuối tuần T6–CN / lễ). Tổng = số người lớn × giá người lớn + số trẻ em × giá trẻ em. KHÔNG có phụ thu, không tính theo đêm."
      >
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Người lớn (₫/khách · bắt buộc)</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Ngày thường" error={err('weekdayPrice')}>
              <Input type="number" min={0} value={form.weekdayPrice} onChange={(e) => set('weekdayPrice')(e.target.value)} />
            </Field>
            <Field label="Cuối tuần (T6–CN)" error={err('weekendPrice')}>
              <Input type="number" min={0} value={form.weekendPrice} onChange={(e) => set('weekendPrice')(e.target.value)} />
            </Field>
            <Field label="Ngày lễ" error={err('holidayPrice')}>
              <Input type="number" min={0} value={form.holidayPrice} onChange={(e) => set('holidayPrice')(e.target.value)} />
            </Field>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Trẻ em (₫/khách · bỏ trống = miễn phí)</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Ngày thường" error={err('weekdayChildPrice')}>
              <Input type="number" min={0} value={form.weekdayChildPrice} onChange={(e) => set('weekdayChildPrice')(e.target.value)} placeholder="Miễn phí" />
            </Field>
            <Field label="Cuối tuần (T6–CN)" error={err('weekendChildPrice')}>
              <Input type="number" min={0} value={form.weekendChildPrice} onChange={(e) => set('weekendChildPrice')(e.target.value)} placeholder="Miễn phí" />
            </Field>
            <Field label="Ngày lễ" error={err('holidayChildPrice')}>
              <Input type="number" min={0} value={form.holidayChildPrice} onChange={(e) => set('holidayChildPrice')(e.target.value)} placeholder="Miễn phí" />
            </Field>
          </div>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={pending}>
          {pending ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Tạo du thuyền'}
        </Button>
        <Button variant="outline" onClick={() => router.back()} disabled={pending}>
          Huỷ
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60 sm:p-6">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-navy-900">{title}</h2>
        {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function TagInput({
  label,
  tags,
  draft,
  setDraft,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  tags: string[];
  draft: string;
  setDraft: (v: string) => void;
  onAdd: () => void;
  onRemove: (t: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={onAdd}>
          Thêm
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-3 py-1 text-sm text-ink-800 ring-1 ring-ink-200"
            >
              {t}
              <button type="button" onClick={() => onRemove(t)} className="text-ink-400 hover:text-red-600">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
