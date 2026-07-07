'use client';

import Link from 'next/link';

import { TestEmailButton } from '@/components/admin/test-email-button';
import { Badge } from '@/components/ui/badge';
import { useApiResource } from '@/lib/use-api-resource';

interface EmailTemplate {
  key: string;
  label: string;
  description?: string | null;
  sampleSubject?: string | null;
}

interface EmailData {
  profileEmail: string | null;
  smtpEnabled?: boolean;
  templates: EmailTemplate[];
}

/**
 * Mẫu email fetch từ `/api/admin/emails` PHÍA CLIENT → endpoint hiện trong F12
 * Network. Chọn mẫu theo URL `?template=`.
 */
export function AdminEmailsClient({ template }: { template?: string }) {
  const { loading, error, data } = useApiResource<EmailData>('/api/admin/emails');

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error || !data) {
    return (
      <div className="rounded-2xl bg-rose-50 p-5 ring-1 ring-rose-200">
        <p className="text-sm font-semibold text-rose-800">
          Không tải được danh sách mẫu email
        </p>
        <p className="mt-1 text-sm text-rose-700">{error ?? 'Lỗi'}</p>
      </div>
    );
  }

  const { templates, smtpEnabled, profileEmail } = data;
  if (templates.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-ink-200/60 shadow-card">
        <p className="text-sm font-medium text-ink-700">
          Máy chủ chưa khai báo mẫu email nào.
        </p>
      </div>
    );
  }

  const current =
    templates.find((t) => t.key === template) ?? templates[0] ?? null;
  if (!current) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-1">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="overline muted no-dash text-[10px]">
            Chọn mẫu ({templates.length})
          </p>
          {smtpEnabled === true && <Badge variant="success">SMTP bật</Badge>}
          {smtpEnabled === false && <Badge variant="danger">SMTP tắt</Badge>}
        </div>
        {templates.map((t) => {
          const active = t.key === current.key;
          return (
            <Link
              key={t.key}
              href={`/admin/emails?template=${t.key}`}
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
                {t.label}
              </p>
              {t.description && (
                <p
                  className={
                    'mt-1 text-[11px] leading-relaxed ' +
                    (active ? 'text-white/80' : 'text-ink-500')
                  }
                >
                  {t.description}
                </p>
              )}
            </Link>
          );
        })}
      </aside>

      <section className="space-y-4">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                {current.label}
              </h2>
              {current.description && (
                <p className="mt-1 text-sm text-ink-700">{current.description}</p>
              )}
            </div>
            <Badge variant="default">{current.key}</Badge>
          </div>

          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-20 text-ink-500 shrink-0">Từ:</dt>
              <dd className="font-mono text-ink-900">noreply@halong24h.com</dd>
            </div>
            {current.sampleSubject && (
              <div className="flex gap-2">
                <dt className="w-20 text-ink-500 shrink-0">Tiêu đề:</dt>
                <dd className="font-mono text-ink-900 break-all">
                  {current.sampleSubject}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-4">
            <TestEmailButton
              template={current.key}
              defaultTo={profileEmail ?? undefined}
              smtpEnabled={smtpEnabled}
            />
          </div>
        </div>

        <div className="rounded-xl bg-cream-100 p-4 text-xs leading-relaxed text-ink-700">
          <p className="font-semibold mb-1">Xem nội dung email thế nào?</p>
          <p>
            Nội dung email do máy chủ dựng và gửi. Để xem chính xác email
            khách/chủ nhà nhận được, bấm <strong>“Gửi test cho tôi”</strong> —
            email thật sẽ tới hộp thư trong 1–2 phút (kiểm tra cả mục Spam).
          </p>
        </div>
      </section>
    </div>
  );
}
