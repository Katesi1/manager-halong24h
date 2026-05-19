import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentProfile } from '@/app/actions/auth';

export const metadata: Metadata = { title: 'Email templates' };
import { TestEmailButton } from '@/components/admin/test-email-button';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  EMAIL_TEMPLATE_META,
  type EmailTemplateKey,
} from '@/lib/emails/types';

interface TemplateGroup {
  id: string;
  label: string;
  description?: string;
  keys: EmailTemplateKey[];
}

const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    id: 'booking-core',
    label: 'Booking · Lõi',
    description:
      'Hai email gốc đã có từ trước (xác nhận đặt phòng + nhận cọc).',
    keys: ['booking_confirmation', 'payment_received'],
  },
  {
    id: 'booking-transitions',
    label: 'Booking · Chuyển trạng thái',
    description:
      'CONTRACTS §6 — 8 email phụ theo chuyển state booking, đủ cả 2 phía guest/host.',
    keys: [
      'booking_request_guest',
      'booking_request_host',
      'booking_hold_timeout_guest',
      'booking_hold_timeout_host',
      'booking_deposit_timeout_guest',
      'booking_deposit_timeout_host',
      'booking_completed_guest_review',
      'booking_completed_host_review',
    ],
  },
  {
    id: 'host-lifecycle',
    label: 'Chủ nhà · Lifecycle',
    description: 'KYC, cơ sở mới, gói cước.',
    keys: [
      'kyc_approved',
      'kyc_rejected',
      'property_approved',
      'property_rejected',
      'subscription_overdue',
    ],
  },
];

const ALL_KEYS: EmailTemplateKey[] = TEMPLATE_GROUPS.flatMap((g) => g.keys);

function isTemplate(k?: string): k is EmailTemplateKey {
  return !!k && (ALL_KEYS as string[]).includes(k);
}

export default async function AdminEmailsPage(props: {
  searchParams: Promise<{ template?: string }>;
}) {
  const sp = await props.searchParams;
  const profile = await getCurrentProfile();
  const current: EmailTemplateKey = isTemplate(sp.template)
    ? sp.template
    : 'booking_confirmation';
  const meta = EMAIL_TEMPLATE_META[current];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Cài đặt hệ thống"
        title="Mẫu email"
        description="Xem trước các email hệ thống tự gửi từ noreply@halong24h.com. Template là React component — BE re-render với dữ liệu thật khi gửi."
        breadcrumbs={[
          { label: 'Cài đặt hệ thống', href: '/admin/settings' },
          { label: 'Mẫu email' },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Template list */}
        <aside className="space-y-5">
          <p className="overline muted no-dash text-[10px] mb-2 px-2">
            Chọn mẫu ({ALL_KEYS.length})
          </p>
          {TEMPLATE_GROUPS.map((group) => (
            <div key={group.id} className="space-y-1">
              <div className="px-2 mb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  {group.label}
                </p>
                {group.description && (
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                    {group.description}
                  </p>
                )}
              </div>
              {group.keys.map((k) => {
                const m = EMAIL_TEMPLATE_META[k];
                const active = k === current;
                return (
                  <Link
                    key={k}
                    href={`/admin/settings/emails?template=${k}`}
                    className={
                      'block rounded-xl px-4 py-3 transition-colors ' +
                      (active
                        ? 'bg-navy-900 text-white'
                        : 'bg-white ring-1 ring-ink-200/60 hover:bg-cream-100 text-ink-900')
                    }
                  >
                    <p
                      className={
                        'text-sm font-semibold ' +
                        (active ? 'text-white' : 'text-ink-900')
                      }
                    >
                      {m.title}
                    </p>
                    <p
                      className={
                        'mt-1 text-[11px] leading-relaxed ' +
                        (active ? 'text-white/80' : 'text-ink-500')
                      }
                    >
                      {m.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="mt-6 rounded-xl bg-cream-100 p-4 text-xs text-ink-700">
            <p className="font-semibold mb-2">📦 Service email</p>
            <p className="leading-relaxed text-[11px]">
              Recommend <strong>Resend</strong> (resend.com): free 100 email/ngày,
              $20/m cho 50k email, support DKIM/DMARC, deliverability tốt cho
              .com.vn, React Email native.
            </p>
            <p className="mt-2 text-[11px]">
              Setup BE:
              <code className="ml-1 rounded bg-white px-1.5 py-0.5">
                RESEND_API_KEY
              </code>{' '}
              + domain verify SPF/DKIM cho{' '}
              <code className="ml-1 rounded bg-white px-1.5 py-0.5">
                halong24h.com
              </code>
              .
            </p>
          </div>
        </aside>

        {/* Preview pane */}
        <section className="space-y-4">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                  {meta.title}
                </h2>
                <p className="mt-1 text-sm text-ink-700">{meta.description}</p>
              </div>
              <Badge variant="gold">Preview với dữ liệu mẫu</Badge>
            </div>

            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-20 text-ink-500 shrink-0">Từ:</dt>
                <dd className="font-mono text-ink-900">
                  noreply@halong24h.com
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 text-ink-500 shrink-0">Tiêu đề:</dt>
                <dd className="font-mono text-ink-900 break-all">
                  {meta.subject}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Chức năng này sắp ra mắt"
              >
                ✏️ Sửa tiêu đề
                {process.env.NODE_ENV === 'development' && (
                  <span className="ml-1 text-[10px] opacity-60">
                    (BE chưa có endpoint)
                  </span>
                )}
              </Button>
              <TestEmailButton
                template={current}
                defaultTo={profile?.email}
              />
            </div>
          </div>

          {/* Email preview iframe */}
          <div className="rounded-2xl bg-white p-3 ring-1 ring-ink-200/60 shadow-card">
            <p className="overline muted no-dash text-[10px] px-2 pt-1 pb-2">
              Khung xem trước (600px — chuẩn email client)
            </p>
            <iframe
              src={`/api/admin/emails/preview/${current}`}
              title={`Preview ${meta.title}`}
              sandbox="allow-same-origin"
              className="block w-full rounded-lg border border-ink-200"
              style={{ height: '880px' }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
