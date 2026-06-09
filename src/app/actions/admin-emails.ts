'use server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/auth-guard';
import {
  EMAIL_TEMPLATE_META,
  type EmailTemplateKey,
} from '@/lib/emails/types';

import { toResult } from './_helpers';

const VALID_KEYS: EmailTemplateKey[] = [
  'booking_confirmation',
  'payment_received',
  'kyc_approved',
  'kyc_rejected',
  'property_approved',
  'property_rejected',
  'subscription_overdue',
  'booking_request_guest',
  'booking_request_host',
  'booking_hold_timeout_guest',
  'booking_hold_timeout_host',
  'booking_deposit_timeout_guest',
  'booking_deposit_timeout_host',
  'booking_completed_guest_review',
  'booking_completed_host_review',
];

const Schema = z.object({
  template: z.string().refine((v) => VALID_KEYS.includes(v as EmailTemplateKey), {
    message: 'Template không hợp lệ',
  }),
  to: z.string().email('Email không hợp lệ'),
});

export interface SendTestResult {
  template: EmailTemplateKey;
  to: string;
  subject: string;
  mode: 'mock' | 'live';
  sentAt: string;
}

/**
 * Gửi email test cho admin để verify template trông đúng trên Gmail/Outlook/etc.
 *
 * Hiện tại BE chưa expose endpoint /admin/emails/test → chạy MOCK mode:
 *  - validate input
 *  - log ra console với template + recipient
 *  - trả về thành công như đã gửi
 *
 * Khi BE ready: thay block log bằng POST /admin/emails/test { template, to }.
 * UI không cần đổi (cùng Server Action).
 */
export async function sendTestEmailAction(input: {
  template: string;
  to: string;
}) {
  return toResult<SendTestResult>(async () => {
    const profile = await requireAdmin();
    const parsed = Schema.parse(input);
    const key = parsed.template as EmailTemplateKey;
    const meta = EMAIL_TEMPLATE_META[key];

    // Default = live (spec đã có endpoint). Mock chỉ khi env bật rõ ràng.
    const mode: 'mock' | 'live' =
      process.env.NEXT_PUBLIC_EMAIL_LIVE === 'false' ? 'mock' : 'live';

    if (mode === 'live') {
      // Spec §16 — POST /admin/emails/test { template, to } → { sent: boolean }
      const { apiClient } = await import('@/infrastructure/http/api-client');
      await apiClient.post<{ sent: boolean }>('/admin/emails/test', {
        template: key,
        to: parsed.to,
      });
    } else {
      console.info('[admin-emails] mock send test', {
        requestedBy: profile.id,
        template: key,
        to:
          process.env.NODE_ENV === 'development' ? parsed.to : '[REDACTED]',
        subject: meta.subject,
      });
    }

    return {
      template: key,
      to: parsed.to,
      subject: meta.subject,
      mode,
      sentAt: new Date().toISOString(),
    };
  });
}
