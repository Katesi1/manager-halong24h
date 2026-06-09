'use server';

import {
  UPLOAD_ALLOWED_MIME,
  UPLOAD_MAX_SIZE_BYTES,
  type UploadResult,
} from '@/core/entities/upload';
import { apiClient } from '@/infrastructure/http/api-client';
import { requireAuthenticated } from '@/lib/auth-guard';

import { toResult } from './_helpers';

/**
 * Spec v1.5 §23 — POST /uploads multipart.
 *
 * Client gọi từ component (multipart FormData → Server Action). FE validate
 * trước (size + mime) để fail-fast; BE vẫn double-check (authoritative).
 */
export async function uploadFileAction(formData: FormData) {
  return toResult<UploadResult>(async () => {
    await requireAuthenticated();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      throw new Error('Không tìm thấy file để tải lên');
    }
    if (file.size > UPLOAD_MAX_SIZE_BYTES) {
      throw new Error(
        `File quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa 10MB.`,
      );
    }
    if (
      file.type &&
      !(UPLOAD_ALLOWED_MIME as readonly string[]).includes(file.type)
    ) {
      throw new Error(
        `Định dạng ${file.type} không được hỗ trợ. Chấp nhận: JPG, PNG, WebP, GIF, PDF.`,
      );
    }
    const upstream = new FormData();
    upstream.append('file', file, file.name);
    return apiClient.post<UploadResult>('/uploads', upstream);
  });
}

/** Spec v1.5 §23 — DELETE /uploads/:id (owner only, chỉ orphan). */
export async function deleteUploadAction(uploadId: string) {
  return toResult<void>(async () => {
    await requireAuthenticated();
    await apiClient.delete(`/uploads/${uploadId}`);
  });
}
