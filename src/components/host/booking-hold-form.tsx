'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { holdBookingAction } from '@/app/actions/bookings';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';

export interface BookingHoldFormPropertyOption {
  id: string;
  name: string;
  standardGuests: number | null;
  maxGuests: number | null;
}

interface BookingHoldFormProps {
  properties: BookingHoldFormPropertyOption[];
  defaults: {
    propertyId?: string;
    checkInAt?: string;
    checkOutAt?: string;
  };
}

export function BookingHoldForm({ properties, defaults }: BookingHoldFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [data, setData] = useState({
    propertyId: defaults.propertyId ?? properties[0]?.id ?? '',
    guestName: '',
    guestPhone: '',
    checkInAt: defaults.checkInAt ?? '',
    checkOutAt: defaults.checkOutAt ?? '',
    guestCount: 2,
    depositAmount: 0,
    notes: '',
  });

  function update<K extends keyof typeof data>(k: K, v: (typeof data)[K]) {
    setData((prev) => ({ ...prev, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await holdBookingAction(data);
      if (!result.ok) {
        setError(result.error);
        if (result.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.fieldErrors))
            if (v[0]) flat[k] = v[0];
          setFieldErrors(flat);
        }
        return;
      }
      router.push(`/host/bookings/${result.data.id}?created=1`);
    });
  }

  const selectedProperty = properties.find((p) => p.id === data.propertyId);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      )}

      <Section title="Cơ sở">
        <div>
          <Label htmlFor="propertyId" required>
            Chọn cơ sở
          </Label>
          <select
            id="propertyId"
            value={data.propertyId}
            onChange={(e) => update('propertyId', e.target.value)}
            className="h-11 w-full rounded-[10px] border border-ink-300 bg-white px-4 text-sm"
            required
          >
            <option value="">— Chọn cơ sở —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {fieldErrors.propertyId && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.propertyId}</p>
          )}
          {selectedProperty && (
            <p className="mt-1.5 text-xs text-ink-500">
              Sức chứa: {selectedProperty.standardGuests ?? '?'} tiêu chuẩn,{' '}
              tối đa {selectedProperty.maxGuests ?? '?'} khách
            </p>
          )}
        </div>
      </Section>

      <Section title="Thông tin khách">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="guestName" required>
              Họ tên
            </Label>
            <Input
              id="guestName"
              value={data.guestName}
              onChange={(e) => update('guestName', e.target.value)}
              placeholder="Nguyễn Văn A"
              required
            />
            {fieldErrors.guestName && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.guestName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="guestPhone" required>
              SĐT
            </Label>
            <Input
              id="guestPhone"
              type="tel"
              value={data.guestPhone}
              onChange={(e) => update('guestPhone', e.target.value)}
              placeholder="0901234567"
              required
            />
            {fieldErrors.guestPhone && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.guestPhone}</p>
            )}
          </div>
        </div>
      </Section>

      <Section title="Lưu trú">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="checkInAt" required>
              Nhận phòng
            </Label>
            <Input
              id="checkInAt"
              type="date"
              value={data.checkInAt}
              onChange={(e) => update('checkInAt', e.target.value)}
              required
            />
            {fieldErrors.checkInAt && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.checkInAt}</p>
            )}
          </div>
          <div>
            <Label htmlFor="checkOutAt" required>
              Trả phòng
            </Label>
            <Input
              id="checkOutAt"
              type="date"
              value={data.checkOutAt}
              onChange={(e) => update('checkOutAt', e.target.value)}
              required
            />
            {fieldErrors.checkOutAt && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.checkOutAt}</p>
            )}
          </div>
          <div>
            <Label htmlFor="guestCount" required>
              Số khách
            </Label>
            <Input
              id="guestCount"
              type="number"
              min={1}
              max={50}
              value={data.guestCount}
              onChange={(e) => update('guestCount', Number(e.target.value))}
              required
            />
            {fieldErrors.guestCount && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.guestCount}</p>
            )}
          </div>
        </div>
      </Section>

      <Section title="Cọc + ghi chú (không bắt buộc)">
        <div className="space-y-4">
          <div>
            <Label htmlFor="depositAmount">Tiền cọc (VNĐ)</Label>
            <Input
              id="depositAmount"
              type="number"
              min={0}
              step={100000}
              value={data.depositAmount || ''}
              onChange={(e) => update('depositAmount', Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              rows={3}
              value={data.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="VD: Khách yêu cầu BBQ buổi tối đầu tiên..."
            />
          </div>
        </div>
      </Section>

      <div className="flex items-center justify-between gap-3 border-t border-ink-200 pt-6">
        <p className="text-xs text-ink-500">
          ⏳ Đặt phòng sẽ ở trạng thái <strong>Giữ chỗ 30 phút</strong> — vào trang
          chi tiết để Xác nhận.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? 'Đang tạo...' : 'Tạo đặt phòng giữ chỗ'}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
      <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
