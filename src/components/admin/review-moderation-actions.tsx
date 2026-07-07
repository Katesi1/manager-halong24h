'use client';

import { refetchApiResources } from '@/lib/use-api-resource';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  hideReviewAction,
  restoreReviewAction,
} from '@/app/actions/reviews';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';

interface Props {
  reviewId: string;
  status: 'published' | 'hidden' | 'deleted';
}

export function ReviewModerationActions({ reviewId, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showHide, setShowHide] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onHide() {
    if (reason.trim().length < 5) {
      setError('Lý do ẩn tối thiểu 5 ký tự');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await hideReviewAction(reviewId, reason.trim());
      if (!r.ok) setError(r.error);
      else {
        setShowHide(false);
        setReason('');
        router.refresh();
        refetchApiResources();
      }
    });
  }

  function onRestore() {
    setError(null);
    startTransition(async () => {
      const r = await restoreReviewAction(reviewId);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  if (status === 'deleted') {
    return (
      <p className="text-xs text-ink-500 italic">
        Khách đã tự xoá review, không thể khôi phục.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}

      {status === 'hidden' && (
        <Button
          variant="outline"
          onClick={onRestore}
          disabled={pending}
          className="w-full"
        >
          {pending ? 'Đang khôi phục…' : '↩️ Khôi phục review'}
        </Button>
      )}

      {status === 'published' && !showHide && (
        <Button
          variant="danger"
          onClick={() => setShowHide(true)}
          disabled={pending}
          className="w-full"
        >
          🙈 Ẩn review này
        </Button>
      )}

      {status === 'published' && showHide && (
        <div className="space-y-2 rounded-lg bg-rose-50 p-3 ring-1 ring-rose-200">
          <p className="text-xs text-rose-900">
            Lý do ẩn (lưu vào audit log + thông báo cho khách):
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="VD: Vi phạm chính sách ngôn ngữ; chứa thông tin cá nhân"
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={onHide}
              disabled={pending}
              className="flex-1"
            >
              {pending ? 'Đang ẩn…' : 'Xác nhận ẩn'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowHide(false);
                setReason('');
                setError(null);
              }}
              disabled={pending}
            >
              Quay lại
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
