'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { openDisputeAction } from '@/app/actions/disputes';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  DISPUTE_TYPE_ICON,
  DISPUTE_TYPE_LABEL,
  type DisputeType,
} from '@/core/entities/dispute';
import { cn } from '@/lib/utils';

interface Props {
  bookingId: string;
}

const TYPES: DisputeType[] = [
  'behavior',
  'no_show',
  'fraud',
  'quality',
  'refund',
  'other',
];

export function OpenDisputeButton({ bookingId }: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const [type, setType] = useState<DisputeType>('behavior');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSubmit() {
    if (subject.trim().length < 5) {
      setError('Tiêu đề tối thiểu 5 ký tự');
      return;
    }
    if (description.trim().length < 20) {
      setError('Mô tả tối thiểu 20 ký tự');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await openDisputeAction({
        bookingId,
        type,
        subject: subject.trim(),
        description: description.trim(),
        amount: amount ? Number(amount) : undefined,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      show('✓ Đã mở khiếu nại. Đội Halong24h sẽ liên hệ sớm.', 'success');
      setOpen(false);
      setSubject('');
      setDescription('');
      setAmount('');
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full"
      >
        ⚠️ Mở khiếu nại
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg bg-rose-50 p-3 ring-1 ring-rose-200">
      {error && (
        <p className="rounded-md bg-red-100 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div>
        <Label>Loại khiếu nại</Label>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all flex items-center gap-1.5',
                type === t
                  ? 'border-rose-700 bg-rose-100 text-rose-900'
                  : 'border-ink-200 bg-white hover:border-rose-400',
              )}
            >
              <span>{DISPUTE_TYPE_ICON[t]}</span>
              <span>{DISPUTE_TYPE_LABEL[t]}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="subject" required>
          Tiêu đề
        </Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="VD: Khách phá phòng, không trả tiền"
          maxLength={200}
        />
      </div>

      <div>
        <Label htmlFor="description" required>
          Mô tả chi tiết
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Mô tả tình huống, dẫn chứng. Admin sẽ đọc lại chat + bill trong hệ thống để ra phán quyết. Tối thiểu 20 ký tự."
        />
        <p className="mt-1 text-[11px] text-ink-500">
          {description.length}/5000 ký tự
        </p>
      </div>

      <div>
        <Label htmlFor="amount">Số tiền liên quan (VNĐ) — không bắt buộc</Label>
        <Input
          id="amount"
          type="number"
          min={0}
          step={100000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="VD: 1500000"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          variant="danger"
          onClick={onSubmit}
          disabled={pending}
          className="flex-1"
        >
          {pending ? 'Đang gửi…' : 'Gửi khiếu nại'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={pending}
        >
          Huỷ
        </Button>
      </div>
    </div>
  );
}
