import Link from 'next/link';
import { CheckCircle2, Clock, Wrench, AlertCircle, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/host/page-header';
import { FilterChips } from '@/components/ui/filter-chips';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { Badge } from '@/components/ui/badge';
import { relativeTime, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { HkTaskStatus, HkIssueSeverity } from '@/lib/legacy-types';

interface HkTaskRow {
  id: string;
  room_name: string;
  property_name: string;
  type: 'clean' | 'inspect' | 'restock';
  status: HkTaskStatus;
  assigned_name: string | null;
  due_at: string | null;
  done_at: string | null;
  notes: string | null;
}

interface HkIssueRow {
  id: string;
  room_name: string;
  reported_by: string;
  category: string;
  severity: HkIssueSeverity;
  description: string;
  status: 'open' | 'fixing' | 'closed';
  created_at: string;
}

const STATUS_LABEL: Record<HkTaskStatus, string> = {
  pending: 'Chờ dọn',
  in_progress: 'Đang dọn',
  done: 'Đã sạch',
  rejected: 'Bị từ chối',
};

const SEVERITY_LABEL: Record<HkIssueSeverity, string> = {
  minor: 'Nhỏ',
  medium: 'Trung bình',
  urgent: 'Khẩn',
};
const SEVERITY_VARIANT: Record<HkIssueSeverity, Parameters<typeof Badge>[0]['variant']> = {
  minor: 'default',
  medium: 'warning',
  urgent: 'danger',
};

const DEMO_TASKS: HkTaskRow[] = [
  {
    id: 't-1',
    room_name: 'Studio Premium View Vịnh',
    property_name: 'À La Carte',
    type: 'clean',
    status: 'pending',
    assigned_name: 'Trần Văn Bình',
    due_at: new Date(Date.now() + 2 * 3600_000).toISOString(),
    done_at: null,
    notes: 'Khách check-in 14h hôm nay. Phòng 203.',
  },
  {
    id: 't-2',
    room_name: '2PN Family Suite',
    property_name: 'À La Carte',
    type: 'clean',
    status: 'in_progress',
    assigned_name: 'Lê Mai Anh',
    due_at: new Date(Date.now() + 1 * 3600_000).toISOString(),
    done_at: null,
    notes: 'Đang dọn. Đã ảnh trước.',
  },
  {
    id: 't-3',
    room_name: 'Studio',
    property_name: 'Sun Grand Feria',
    type: 'inspect',
    status: 'pending',
    assigned_name: null,
    due_at: new Date(Date.now() + 5 * 3600_000).toISOString(),
    done_at: null,
    notes: null,
  },
  {
    id: 't-4',
    room_name: 'Penthouse 3PN Sky Suite',
    property_name: 'À La Carte',
    type: 'clean',
    status: 'done',
    assigned_name: 'Trần Văn Bình',
    due_at: null,
    done_at: new Date(Date.now() - 30 * 60_000).toISOString(),
    notes: 'Đã ảnh sau khi dọn. Sẵn sàng cho khách.',
  },
  {
    id: 't-5',
    room_name: 'Studio Premium View Vịnh',
    property_name: 'À La Carte',
    type: 'restock',
    status: 'done',
    assigned_name: 'Lê Mai Anh',
    due_at: null,
    done_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
    notes: 'Đã bổ sung minibar + amenity kit.',
  },
];

const DEMO_ISSUES: HkIssueRow[] = [
  {
    id: 'i-1',
    room_name: 'Studio Premium View Vịnh',
    reported_by: 'Lê Mai Anh',
    category: 'Điều hòa',
    severity: 'urgent',
    description: 'Điều hòa không lạnh, có tiếng kêu lạ. Cần thợ tới ngay.',
    status: 'open',
    created_at: new Date(Date.now() - 25 * 60_000).toISOString(),
  },
  {
    id: 'i-2',
    room_name: '2PN Family Suite',
    reported_by: 'Trần Văn Bình',
    category: 'Vòi nước',
    severity: 'medium',
    description: 'Vòi sen tắm rỉ giọt. Có thể fix tạm bằng băng dính nhưng cần thay sớm.',
    status: 'fixing',
    created_at: new Date(Date.now() - 4 * 3600_000).toISOString(),
  },
  {
    id: 'i-3',
    room_name: 'Studio',
    reported_by: 'Lê Mai Anh',
    category: 'TV',
    severity: 'minor',
    description: 'Remote TV hết pin.',
    status: 'closed',
    created_at: new Date(Date.now() - 26 * 3600_000).toISOString(),
  },
];

async function getTasks(): Promise<HkTaskRow[]> {
  return DEMO_TASKS;
}

async function getIssues(): Promise<HkIssueRow[]> {
  return DEMO_ISSUES;
}

export default async function HousekeepingPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await props.searchParams;
  const tasks = await getTasks();
  const issues = await getIssues();

  const counts = {
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    open_issues: issues.filter((i) => i.status === 'open').length,
  };

  const filtered = sp.status ? tasks.filter((t) => t.status === sp.status) : tasks;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Dọn phòng"
        description="Theo dõi nhân viên dọn phòng. Đồng bộ thời gian thực với app mobile."
      />

      {/* Quick stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Clock className="h-5 w-5" />} label="Chờ dọn" value={counts.pending} color="amber" />
        <Stat icon={<Sparkles className="h-5 w-5" />} label="Đang dọn" value={counts.in_progress} color="blue" />
        <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Đã sạch" value={counts.done} color="emerald" />
        <Stat icon={<AlertCircle className="h-5 w-5" />} label="Sự cố mở" value={counts.open_issues} color="rose" />
      </div>

      {/* Filter chips */}
      <div className="mb-4">
        <FilterChips
          active={sp.status ?? 'all'}
          items={[
            { key: 'all', label: 'Tất cả', href: '/host/hk', count: tasks.length },
            { key: 'pending', label: 'Chờ dọn', href: '/host/hk?status=pending', count: counts.pending },
            { key: 'in_progress', label: 'Đang dọn', href: '/host/hk?status=in_progress', count: counts.in_progress },
            { key: 'done', label: 'Đã sạch', href: '/host/hk?status=done', count: counts.done },
          ]}
        />
      </div>

      {/* Tasks list */}
      <section className="space-y-3 mb-10">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-sm text-ink-500">
            Không có task phù hợp
          </div>
        ) : (
          filtered.map((t) => (
            <article
              key={t.id}
              className={cn(
                'rounded-2xl bg-white p-4 ring-1 transition',
                t.status === 'done' ? 'ring-emerald-200 opacity-80' : 'ring-ink-200 hover:ring-navy-300',
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-full',
                    t.status === 'done'
                      ? 'bg-emerald-100 text-emerald-700'
                      : t.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700',
                  )}
                >
                  {t.type === 'clean' ? (
                    <Sparkles className="h-5 w-5" />
                  ) : t.type === 'inspect' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Wrench className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-ink-900">{t.room_name}</h3>
                      <p className="text-xs text-ink-500">
                        {t.property_name} ·{' '}
                        {t.type === 'clean' ? 'Dọn phòng' : t.type === 'inspect' ? 'Kiểm tra' : 'Bổ sung đồ'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        t.status === 'done'
                          ? 'success'
                          : t.status === 'in_progress'
                            ? 'info'
                            : t.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                      }
                    >
                      {STATUS_LABEL[t.status]}
                    </Badge>
                  </div>
                  {t.notes && <p className="mt-2 text-sm text-ink-700">{t.notes}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                    {t.assigned_name ? (
                      <span className="inline-flex items-center gap-1.5">
                        <GradientAvatar name={t.assigned_name} size="sm" />
                        {t.assigned_name}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">⚠️ Chưa giao</span>
                    )}
                    {t.due_at && t.status !== 'done' && (
                      <span>
                        <Clock className="inline h-3 w-3 mr-0.5" />
                        Hạn {relativeTime(t.due_at)}
                      </span>
                    )}
                    {t.done_at && (
                      <span className="text-emerald-700">
                        ✓ Xong {relativeTime(t.done_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Issues */}
      {issues.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Sự cố ({counts.open_issues} mở)
            </h2>
            <Link href="/host/hk/issues" className="text-sm font-semibold text-navy-700 hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-3">
            {issues.slice(0, 5).map((iss) => (
              <article
                key={iss.id}
                className={cn(
                  'rounded-xl bg-white p-4 ring-1',
                  iss.status === 'closed' ? 'ring-ink-100 opacity-70' : 'ring-ink-200',
                  iss.severity === 'urgent' && iss.status !== 'closed' && 'ring-2 ring-rose-300 bg-rose-50/40',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-ink-900">{iss.room_name}</h4>
                      <Badge variant={SEVERITY_VARIANT[iss.severity]}>
                        {iss.severity === 'urgent' && '⚡ '}
                        {SEVERITY_LABEL[iss.severity]}
                      </Badge>
                      {iss.status === 'fixing' && <Badge variant="info">Đang sửa</Badge>}
                      {iss.status === 'closed' && <Badge variant="success">Đã xong</Badge>}
                    </div>
                    <p className="text-xs text-ink-500 mt-0.5">
                      {iss.category} · báo bởi {iss.reported_by}
                    </p>
                    <p className="mt-2 text-sm text-ink-700">{iss.description}</p>
                  </div>
                  <span className="text-xs text-ink-500 shrink-0">
                    {formatDateTime(iss.created_at)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Mobile note */}
      <div className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
        <p className="font-semibold">📱 App mobile cho nhân viên dọn phòng</p>
        <p className="mt-1">
          Nhân viên HK dùng app mobile (đang phát triển) để cập nhật trạng thái + upload ảnh.
          Web này dành cho chủ nhà giám sát + giao việc.
        </p>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'amber' | 'blue' | 'emerald' | 'rose';
}) {
  const colorClass = {
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  }[color];

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-ink-200/60 shadow-card">
      <div className={`inline-grid h-10 w-10 place-items-center rounded-lg ring-1 ${colorClass}`}>
        {icon}
      </div>
      <p className="mt-3 overline muted no-dash text-[10px]">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink-900">{value}</p>
    </div>
  );
}
