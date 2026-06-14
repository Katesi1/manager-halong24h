'use server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/auth-guard';

import { toResult } from './_helpers';

/**
 * 1 template email do BE quản lý (spec §16). BE là source of truth cho danh
 * sách key — FE KHÔNG hardcode. `label`/`description`/`sampleSubject` là optional
 * (BE có thể chưa extend) → FE fallback về `key` để vẫn hiển thị được.
 */
export interface EmailTemplate {
  key: string;
  label: string;
  description: string;
  sampleSubject: string | null;
}

export interface EmailServiceStatus {
  /** SMTP đã cấu hình & bật ở BE chưa — quyết định có gửi thật được không. */
  smtpEnabled: boolean;
  /** Danh sách template BE hỗ trợ (spec §16). Render trực tiếp, không map. */
  templates: EmailTemplate[];
}

interface RawTemplate {
  key: string;
  label?: string | null;
  description?: string | null;
  sampleSubject?: string | null;
}

/**
 * Lấy trạng thái dịch vụ email + danh sách template từ BE —
 * spec §16 `GET /admin/emails/templates` → `{ smtpEnabled, templates: [{ key, ... }] }`.
 *
 * Dùng để render UI hoàn toàn động (không hardcode key phía FE) + hiển thị
 * trạng thái SMTP. Khi BE lỗi/chưa expose → trả lỗi, UI coi như "không xác định".
 */
export async function getEmailServiceStatusAction() {
  return toResult<EmailServiceStatus>(async () => {
    await requireAdmin();
    const { apiClient } = await import('@/infrastructure/http/api-client');
    const data = await apiClient.get<{
      smtpEnabled?: boolean;
      templates?: RawTemplate[];
    }>('/admin/emails/templates');

    const templates: EmailTemplate[] = Array.isArray(data.templates)
      ? data.templates
          .filter((t) => !!t?.key)
          .map((t) => ({
            key: t.key,
            label: t.label?.trim() || t.key,
            description: t.description?.trim() || '',
            sampleSubject: t.sampleSubject?.trim() || null,
          }))
      : [];

    return {
      smtpEnabled: data.smtpEnabled === true,
      templates,
    };
  });
}

export interface SendTestResult {
  template: string;
  to: string;
  mode: 'mock' | 'live';
  sentAt: string;
}

const Schema = z.object({
  // BE validate key ∈ EMAIL_TEMPLATE_KEYS và trả "Unknown template" nếu sai.
  // FE chỉ cần đảm bảo không rỗng — không lặp lại danh sách (BE source of truth).
  template: z.string().min(1, 'Thiếu template'),
  to: z.string().email('Email không hợp lệ'),
});

/**
 * Gửi email test cho admin để verify template trông đúng trên Gmail/Outlook.
 * Spec §16 — `POST /admin/emails/test { template, to }` → `{ sent: boolean }`.
 *
 * Mặc định = live. Mock chỉ khi `NEXT_PUBLIC_EMAIL_LIVE=false`.
 */
export async function sendTestEmailAction(input: {
  template: string;
  to: string;
}) {
  return toResult<SendTestResult>(async () => {
    const profile = await requireAdmin();
    const parsed = Schema.parse(input);

    const mode: 'mock' | 'live' =
      process.env.NEXT_PUBLIC_EMAIL_LIVE === 'false' ? 'mock' : 'live';

    if (mode === 'live') {
      const { apiClient } = await import('@/infrastructure/http/api-client');
      await apiClient.post<{ sent: boolean }>('/admin/emails/test', {
        template: parsed.template,
        to: parsed.to,
      });
    } else {
      console.info('[admin-emails] mock send test', {
        requestedBy: profile.id,
        template: parsed.template,
        to: process.env.NODE_ENV === 'development' ? parsed.to : '[REDACTED]',
      });
    }

    return {
      template: parsed.template,
      to: parsed.to,
      mode,
      sentAt: new Date().toISOString(),
    };
  });
}
