'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';

interface InitialState {
  iosPublished: string;
  androidPublished: string;
  publishedAt: string;
  iosMin: string;
  androidMin: string;
  forceUpdate: boolean;
  message: string;
}

const SEMVER = /^\d+\.\d+\.\d+$/;

export function AppVersionForm({ initial }: { initial: InitialState }) {
  const [iosMin, setIosMin] = useState(initial.iosMin);
  const [androidMin, setAndroidMin] = useState(initial.androidMin);
  const [forceUpdate, setForceUpdate] = useState(initial.forceUpdate);
  const [message, setMessage] = useState(initial.message);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dirty = useMemo(
    () =>
      iosMin !== initial.iosMin ||
      androidMin !== initial.androidMin ||
      forceUpdate !== initial.forceUpdate ||
      message !== initial.message,
    [iosMin, androidMin, forceUpdate, message, initial],
  );

  const iosMinInvalid = iosMin !== '' && !SEMVER.test(iosMin);
  const androidMinInvalid = androidMin !== '' && !SEMVER.test(androidMin);
  const hasVersionError = iosMinInvalid || androidMinInvalid;

  function handlePublish() {
    setConfirmOpen(false);
    toast.success(
      'Đã publish. App sẽ thấy cấu hình mới trong vòng 5 phút.',
    );
  }

  return (
    <div className="space-y-6">
      {/* Force update threshold */}
      <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          Ngưỡng buộc cập nhật
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Nếu phiên bản app của user thấp hơn ngưỡng này, app sẽ chặn vào tới
          khi cập nhật. Dùng để fix lỗi nghiêm trọng hoặc breaking API.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="overline muted no-dash text-[10px]">
              Phiên bản tối thiểu (iOS)
            </span>
            <Input
              value={iosMin}
              onChange={(e) => setIosMin(e.target.value)}
              placeholder="vd: 1.4.0"
              inputMode="text"
              className="mt-1.5 font-mono"
              aria-invalid={iosMinInvalid}
            />
            {iosMinInvalid && (
              <p className="mt-1 text-[11px] text-rose-600">
                Định dạng phải là X.Y.Z (vd: 1.4.0)
              </p>
            )}
          </label>
          <label className="block">
            <span className="overline muted no-dash text-[10px]">
              Phiên bản tối thiểu (Android)
            </span>
            <Input
              value={androidMin}
              onChange={(e) => setAndroidMin(e.target.value)}
              placeholder="vd: 1.4.0"
              inputMode="text"
              className="mt-1.5 font-mono"
              aria-invalid={androidMinInvalid}
            />
            {androidMinInvalid && (
              <p className="mt-1 text-[11px] text-rose-600">
                Định dạng phải là X.Y.Z (vd: 1.4.0)
              </p>
            )}
          </label>
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
          <input
            type="checkbox"
            checked={forceUpdate}
            onChange={(e) => setForceUpdate(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 accent-amber-600"
          />
          <div>
            <p className="text-sm font-semibold text-ink-900">
              Bật buộc cập nhật
            </p>
            <p className="text-xs text-ink-700 leading-snug">
              Khi bật, app sẽ chặn user vào tới khi cập nhật. Dùng cẩn thận.
            </p>
          </div>
        </label>
      </section>

      {/* Update message */}
      <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          Nội dung thông báo
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Hiển thị trên app khi user mở (Tiếng Việt).
        </p>
        <label className="mt-4 block">
          <span className="overline muted no-dash text-[10px]">
            Nội dung thông báo hiển thị trên app
          </span>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="mt-1.5"
            maxLength={500}
          />
          <p className="mt-1 text-[11px] text-ink-500">
            {message.length}/500 ký tự
          </p>
        </label>
      </section>

      {/* Publish */}
      <section className="rounded-2xl border-2 border-amber-200 bg-amber-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
              Phát hành thay đổi
            </h2>
            <p className="mt-1 text-sm text-ink-700">
              Áp dụng ngay lập tức cho toàn bộ user mobile. Có thể rollback từ
              trang này.
            </p>
          </div>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button
                variant="gold"
                size="lg"
                disabled={!dirty || hasVersionError}
                onClick={() => setConfirmOpen(true)}
              >
                Phát hành thay đổi
              </Button>
            </DialogTrigger>
            <DialogContent open={confirmOpen}>
              <h3 className="font-display text-xl font-semibold text-navy-900">
                Bạn chắc chắn?
              </h3>
              <p className="mt-2 text-sm text-ink-700">
                Cấu hình mới sẽ áp dụng cho toàn bộ user app trong vòng 5
                phút.{' '}
                {forceUpdate && (
                  <strong className="text-rose-600">
                    Buộc cập nhật đang BẬT — user dùng phiên bản cũ sẽ bị chặn.
                  </strong>
                )}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setConfirmOpen(false)}
                >
                  Huỷ
                </Button>
                <Button variant="gold" size="md" onClick={handlePublish}>
                  Phát hành ngay
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {!dirty && (
          <p className="mt-3 text-xs text-ink-500">
            Chưa có thay đổi nào so với cấu hình hiện tại.
          </p>
        )}
        {hasVersionError && (
          <p className="mt-3 text-xs text-rose-600">
            Phiên bản tối thiểu không hợp lệ — sửa định dạng X.Y.Z trước khi
            phát hành.
          </p>
        )}
      </section>
    </div>
  );
}
