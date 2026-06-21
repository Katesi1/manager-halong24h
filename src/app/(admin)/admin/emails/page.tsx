import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentProfile } from '@/app/actions/auth';
import { getEmailServiceStatusAction } from '@/app/actions/admin-emails';
import { TestEmailButton } from '@/components/admin/test-email-button';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Mẫu email' };

export default async function AdminEmailsPage(props: {
  searchParams: Promise<{ template?: string }>;
}) {
  const sp = await props.searchParams;
  const [profile, statusResult] = await Promise.all([
    getCurrentProfile(),
    getEmailServiceStatusAction(),
  ]);

  const status = statusResult.ok ? statusResult.data : null;
  const templates = status?.templates ?? [];
  const smtpEnabled = status?.smtpEnabled;

  // BE là source of truth: chọn template theo key có thật trong danh sách BE.
  const current =
    templates.find((t) => t.key === sp.template) ?? templates[0] ?? null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        backHref="/admin"
        backLabel="Quay lại Tổng quan"
        eyebrow="Cấu hình"
        title="Mẫu email"
        description="Các email hệ thống tự gửi từ noreply@halong24h.com. Danh sách lấy trực tiếp từ máy chủ. Bấm “Gửi test” để nhận email thật vào hộp thư và kiểm tra hiển thị."
        breadcrumbs={[
          { label: 'Tổng quan', href: '/admin' },
          { label: 'Mẫu email' },
        ]}
      />

      {/* Lỗi tải danh sách */}
      {!statusResult.ok && (
        <div className="rounded-2xl bg-rose-50 p-5 ring-1 ring-rose-200">
          <p className="text-sm font-semibold text-rose-800">
            Không tải được danh sách mẫu email
          </p>
          <p className="mt-1 text-sm text-rose-700">{statusResult.error}</p>
        </div>
      )}

      {/* Tải được nhưng rỗng */}
      {statusResult.ok && templates.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-ink-200/60 shadow-card">
          <p className="text-sm font-medium text-ink-700">
            Máy chủ chưa khai báo mẫu email nào.
          </p>
        </div>
      )}

      {statusResult.ok && current && (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Template list */}
          <aside className="space-y-1">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="overline muted no-dash text-[10px]">
                Chọn mẫu ({templates.length})
              </p>
              {smtpEnabled === true && (
                <Badge variant="success">SMTP bật</Badge>
              )}
              {smtpEnabled === false && (
                <Badge variant="danger">SMTP tắt</Badge>
              )}
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

          {/* Detail pane */}
          <section className="space-y-4">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                    {current.label}
                  </h2>
                  {current.description && (
                    <p className="mt-1 text-sm text-ink-700">
                      {current.description}
                    </p>
                  )}
                </div>
                <Badge variant="default">{current.key}</Badge>
              </div>

              <dl className="mt-4 grid gap-2 text-sm">
                <div className="flex gap-2">
                  <dt className="w-20 text-ink-500 shrink-0">Từ:</dt>
                  <dd className="font-mono text-ink-900">
                    noreply@halong24h.com
                  </dd>
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
                  defaultTo={profile?.email}
                  smtpEnabled={smtpEnabled}
                />
              </div>
            </div>

            <div className="rounded-xl bg-cream-100 p-4 text-xs leading-relaxed text-ink-700">
              <p className="font-semibold mb-1">Xem nội dung email thế nào?</p>
              <p>
                Nội dung email do máy chủ dựng và gửi. Để xem chính xác email
                khách/chủ nhà nhận được, bấm{' '}
                <strong>“Gửi test cho tôi”</strong> — email thật sẽ tới hộp thư
                trong 1–2 phút (kiểm tra cả mục Spam).
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
