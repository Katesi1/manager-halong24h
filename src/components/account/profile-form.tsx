'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, User } from 'lucide-react';

import { updateProfileAction, type ActionResult } from '@/app/actions/auth';
import { uploadFileAction } from '@/app/actions/uploads';
import { Input, Label } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { UPLOAD_MAX_SIZE_BYTES, isImageMime } from '@/core/entities/upload';
import { refetchApiResources } from '@/lib/use-api-resource';

interface ProfileFormProps {
  defaults: {
    full_name: string;
    email: string;
    phone: string;
    avatar: string | null;
  };
}

const initialState: ActionResult = {};

/**
 * Hồ sơ cá nhân — `PATCH /auth/profile` (spec §25.2 + v1.22 avatar). Ảnh đại
 * diện upload qua `POST /uploads` (Cloudinary) → URL https gửi vào `avatar`
 * cùng form. Lỗi trùng email/SĐT (409) hiển thị qua toast.
 */
export function ProfileForm({ defaults }: ProfileFormProps) {
  const { show } = useToast();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(defaults.avatar ?? '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok) {
      show('Đã lưu thông tin.', 'success');
      refetchApiResources();
      router.refresh();
    } else if (state.error) {
      show(state.error, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleFilePicked(file: File) {
    setUploadError(null);
    if (!isImageMime(file.type)) {
      setUploadError('Chỉ chấp nhận ảnh (JPG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > UPLOAD_MAX_SIZE_BYTES) {
      setUploadError(
        `Ảnh quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa 10MB.`,
      );
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file, file.name);
      const result = await uploadFileAction(fd);
      if (result.ok) {
        setAvatarUrl(result.data.url);
      } else {
        setUploadError(result.error || 'Tải ảnh lên thất bại. Thử lại sau.');
      }
    } finally {
      setUploading(false);
    }
  }

  const avatarChanged = avatarUrl !== (defaults.avatar ?? '');

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2">
      {/* ── Ảnh đại diện ── */}
      <div className="sm:col-span-2 flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-cream-100 ring-1 ring-ink-200/60">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Ảnh đại diện"
              fill
              sizes="64px"
              unoptimized
              className="object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-ink-400">
              <User className="h-7 w-7" />
            </span>
          )}
        </div>
        <div className="min-w-0">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFilePicked(f);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải ảnh…
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" /> Đổi ảnh đại diện
              </>
            )}
          </Button>
          <p className="mt-1 text-xs text-ink-500">
            JPG, PNG, WebP hoặc GIF — tối đa 10MB.
            {avatarChanged && !uploading && (
              <span className="ml-1 font-medium text-amber-700">
                Bấm “Lưu thông tin” để áp dụng ảnh mới.
              </span>
            )}
          </p>
          {uploadError && (
            <p className="mt-1 text-xs text-red-600">{uploadError}</p>
          )}
        </div>
      </div>
      <input type="hidden" name="avatar" value={avatarUrl} />
      {state.fieldErrors?.avatar && (
        <p className="sm:col-span-2 -mt-3 text-xs text-red-600">
          {state.fieldErrors.avatar}
        </p>
      )}

      <div className="sm:col-span-2">
        <Label htmlFor="full_name" required>
          Họ và tên
        </Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={defaults.full_name}
          required
          minLength={2}
          maxLength={120}
        />
        {state.fieldErrors?.fullName && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.fullName}</p>
        )}
      </div>
      <div>
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaults.email}
          required
        />
        {state.fieldErrors?.email && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
        )}
      </div>
      <div>
        <Label htmlFor="phone">Số điện thoại</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaults.phone}
          placeholder="0901234567"
        />
        {state.fieldErrors?.phone && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.phone}</p>
        )}
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={pending || uploading}>
          {pending ? 'Đang lưu…' : 'Lưu thông tin'}
        </Button>
      </div>
    </form>
  );
}
