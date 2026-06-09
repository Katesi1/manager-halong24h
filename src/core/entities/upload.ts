/**
 * Upload — spec v1.5 §23 (POST /uploads).
 *
 * Generic file upload trả HTTPS URL. Reuse cho chat attachment, dispute
 * evidence, v.v. BE check magic bytes + strip EXIF + sanitize filename.
 */

export interface UploadResult {
  id: string;
  url: string;
  type: string;
  name: string;
  size: number;
  /** Null nếu URL không expire (Cloudinary public). */
  expiresAt: string | null;
}

/** Whitelist BE accept (sync với spec §23). */
export const UPLOAD_ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;

export type UploadMime = (typeof UPLOAD_ALLOWED_MIME)[number];

/** 10MB per spec. */
export const UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** Spec §17.5 — chat attachment validation. */
export const CHAT_ATTACHMENT_MAX_COUNT = 5;

export function isAllowedMime(mime: string): mime is UploadMime {
  return (UPLOAD_ALLOWED_MIME as readonly string[]).includes(mime);
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}
