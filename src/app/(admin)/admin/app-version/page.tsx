import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';

import { AppVersionForm } from './_app-version-form';

/**
 * Cấu hình version app mobile (iOS + Android).
 *
 * MOCK — chưa wire BE. Khi backend expose `PATCH /admin/app-version` thì:
 *   - thay `INITIAL` bằng fetch server-side
 *   - tạo Server Action publish trong `actions/admin-app-version.ts`
 */

const INITIAL = {
  iosPublished: '1.4.2',
  androidPublished: '1.4.2',
  publishedAt: '2026-05-12',
  iosMin: '1.4.0',
  androidMin: '1.4.0',
  forceUpdate: false,
  message:
    'Phiên bản 1.4 cải thiện tốc độ check-in QR và sửa lỗi notification trên Android 14. Cập nhật để có trải nghiệm tốt nhất.',
};

export default function AdminAppVersionPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Phiên bản app"
        description="Cấu hình version tối thiểu cho app mobile Halong24h (iOS + Android) và buộc cập nhật khi cần."
        breadcrumbs={[
          { label: 'Quản trị' },
          { label: 'Phiên bản app' },
        ]}
      />

      {/* Current published version */}
      <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
              Phiên bản đang phát hành
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Đọc-only — cập nhật qua App Store Connect / Google Play Console.
            </p>
          </div>
          <Badge variant="success">Đang hoạt động</Badge>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-ink-100 p-4">
            <p className="overline muted no-dash text-[10px]">iOS</p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-navy-900">
              {INITIAL.iosPublished}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              Phát hành {INITIAL.publishedAt}
            </p>
          </div>
          <div className="rounded-xl border border-ink-100 p-4">
            <p className="overline muted no-dash text-[10px]">Android</p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-navy-900">
              {INITIAL.androidPublished}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              Phát hành {INITIAL.publishedAt}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <AppVersionForm initial={INITIAL} />
      </div>
    </div>
  );
}
