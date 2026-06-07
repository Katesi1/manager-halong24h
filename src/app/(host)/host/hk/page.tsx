import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  Sparkles,
  Smartphone,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import { FilterChips } from '@/components/ui/filter-chips';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { Badge } from '@/components/ui/badge';
import { relativeTime, formatDateTime, minutesAgo } from '@/lib/format';
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

const TYPE_LABEL = {
  clean: 'Dọn phòng',
  inspect: 'Kiểm tra',
  restock: 'Bổ sung đồ',
} as const;

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

  const totalActive = counts.pending + counts.in_progress + counts.done;
  const completionPct = totalActive === 0 ? 0 : Math.round((counts.done / totalActive) * 100);
  const unassigned = tasks.filter((t) => !t.assigned_name && t.status !== 'done').length;

  const filtered = sp.status ? tasks.filter((t) => t.status === sp.status) : tasks;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50/50 via-white to-cream-50/30 p-4 sm:p-6 lg:p-8">
      {/* Editorial header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-600">
              Vận hành · Buồng phòng
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-[1.05] tracking-tight text-navy-900 sm:text-5xl">
              Dọn phòng
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500 sm:text-base">
              Theo dõi nhân viên buồng phòng theo thời gian thực. Lọc theo trạng thái để giao việc, xử lý sự cố trước khi khách check-in.
            </p>
          </div>
        </div>
      </div>

      {/* Bento stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <BentoBig
          label="Hoàn thành hôm nay"
          subLabel={`${counts.done} / ${totalActive} task`}
          value={`${completionPct}%`}
          bar={completionPct}
        />
        <BentoStat
          icon={<Clock className="h-4 w-4" />}
          label="Chờ dọn"
          value={counts.pending}
          tone="amber"
        />
        <BentoStat
          icon={<Sparkles className="h-4 w-4" />}
          label="Đang dọn"
          value={counts.in_progress}
          tone="blue"
        />
        <BentoStat
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Đã sạch"
          value={counts.done}
          tone="emerald"
        />
        <BentoStat
          icon={<UserPlus className="h-4 w-4" />}
          label="Chưa giao"
          value={unassigned}
          tone="navy"
        />
        <BentoStat
          icon={<AlertCircle className="h-4 w-4" />}
          label="Sự cố mở"
          value={counts.open_issues}
          tone="rose"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Tasks column */}
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
              Danh sách công việc
            </h2>
            <span className="text-xs text-ink-500 tabular-nums">
              {filtered.length} / {tasks.length} task
            </span>
          </div>

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

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-12 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cream-100 to-cream-200 text-ink-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm text-ink-500">Không có task phù hợp với bộ lọc</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          )}
        </section>

        {/* Issues sidebar */}
        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-ink-200/60 shadow-sm">
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">
                Sự cố
                {counts.open_issues > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                    {counts.open_issues} mở
                  </span>
                )}
              </h2>
              <Link
                href="/host/hk/issues"
                className="text-xs font-semibold text-navy-700 hover:underline"
              >
                Tất cả →
              </Link>
            </div>
            {issues.length === 0 ? (
              <p className="text-sm text-ink-500">Không có sự cố nào</p>
            ) : (
              <div className="space-y-3">
                {issues.slice(0, 5).map((iss) => (
                  <IssueCard key={iss.id} issue={iss} />
                ))}
              </div>
            )}
          </div>

          {/* Mobile note — restyled */}
          <div className="rounded-3xl bg-gradient-to-br from-navy-900 to-navy-800 p-5 text-white ring-1 ring-navy-700 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">
                <Smartphone className="h-4 w-4 text-gold-400" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">App mobile cho nhân viên</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-white/70">
                  Nhân viên HK dùng app mobile để cập nhật trạng thái và upload ảnh. Web này dành cho chủ nhà giám sát và giao việc.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TaskCard({ task: t }: { task: HkTaskRow }) {
  const isDone = t.status === 'done';
  const isProgress = t.status === 'in_progress';
  const dueMinutes = t.due_at ? Math.floor((new Date(t.due_at).getTime() - Date.now()) / 60_000) : null;
  const isUrgent = dueMinutes !== null && dueMinutes <= 60 && !isDone;
  const isOverdue = dueMinutes !== null && dueMinutes < 0 && !isDone;

  const typeIcon =
    t.type === 'clean' ? <Sparkles className="h-4 w-4" /> :
    t.type === 'inspect' ? <CheckCircle2 className="h-4 w-4" /> :
    <Wrench className="h-4 w-4" />;

  const accentStripe =
    isOverdue ? 'before:bg-rose-500' :
    isUrgent ? 'before:bg-amber-500' :
    isProgress ? 'before:bg-blue-500' :
    isDone ? 'before:bg-emerald-500' :
    'before:bg-ink-200';

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white p-4 pl-5 ring-1 transition',
        'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1',
        accentStripe,
        isDone ? 'ring-emerald-100 bg-emerald-50/30' : 'ring-ink-200/60 hover:ring-navy-300 hover:shadow-sm',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1',
            isDone ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' :
            isProgress ? 'bg-blue-50 text-blue-700 ring-blue-100' :
            'bg-amber-50 text-amber-700 ring-amber-100',
          )}
        >
          {typeIcon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={cn(
                'font-semibold leading-tight truncate',
                isDone ? 'text-ink-700' : 'text-ink-900',
              )}>
                {t.room_name}
              </h3>
              <p className="mt-0.5 text-[11px] text-ink-500">
                <span className="font-medium text-ink-700">{t.property_name}</span>
                <span className="mx-1.5 text-ink-300">·</span>
                {TYPE_LABEL[t.type]}
              </p>
            </div>
            <Badge
              variant={
                isDone ? 'success' :
                isProgress ? 'info' :
                t.status === 'rejected' ? 'danger' :
                'warning'
              }
            >
              {STATUS_LABEL[t.status]}
            </Badge>
          </div>

          {t.notes && (
            <p className={cn(
              'mt-2 text-sm leading-relaxed',
              isDone ? 'text-ink-500' : 'text-ink-700',
            )}>
              {t.notes}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            {t.assigned_name ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 pl-1 pr-2.5 py-0.5 text-ink-700">
                <GradientAvatar name={t.assigned_name} size="sm" />
                <span className="font-medium">{t.assigned_name}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                Chưa giao
              </span>
            )}

            {t.due_at && !isDone && (
              <DuePill minutes={dueMinutes ?? 0} due={t.due_at} />
            )}

            {t.done_at && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Xong {relativeTime(t.done_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function DuePill({ minutes, due }: { minutes: number; due: string }) {
  const overdue = minutes < 0;
  const urgent = !overdue && minutes <= 60;

  const label = overdue
    ? `Quá hạn ${Math.abs(minutes)}p`
    : minutes < 60
      ? `Còn ${minutes}p`
      : `Hạn ${relativeTime(due)}`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium tabular-nums',
        overdue ? 'bg-rose-100 text-rose-700' :
        urgent ? 'bg-amber-100 text-amber-800' :
        'bg-ink-100 text-ink-700',
      )}
    >
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}

function IssueCard({ issue: iss }: { issue: HkIssueRow }) {
  const isUrgent = iss.severity === 'urgent' && iss.status !== 'closed';
  const isClosed = iss.status === 'closed';

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl bg-white p-3 pl-4 ring-1 transition',
        'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1',
        iss.severity === 'urgent' ? 'before:bg-rose-500' :
        iss.severity === 'medium' ? 'before:bg-amber-500' :
        'before:bg-ink-300',
        isUrgent ? 'ring-rose-200 bg-rose-50/40' :
        isClosed ? 'ring-ink-100 opacity-70' :
        'ring-ink-200/60',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-ink-900 leading-tight truncate">
          {iss.room_name}
        </h4>
        <span className="text-[10px] text-ink-400 shrink-0 tabular-nums">
          {minutesAgo(iss.created_at) < 1440
            ? relativeTime(iss.created_at)
            : formatDateTime(iss.created_at).slice(0, 5)}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <Badge variant={SEVERITY_VARIANT[iss.severity]}>
          {iss.severity === 'urgent' && '⚡ '}
          {SEVERITY_LABEL[iss.severity]}
        </Badge>
        <span className="text-[11px] text-ink-500">{iss.category}</span>
        {iss.status === 'fixing' && <Badge variant="info">Đang sửa</Badge>}
        {isClosed && <Badge variant="success">Đã xong</Badge>}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-700 line-clamp-2">
        {iss.description}
      </p>
      <p className="mt-2 text-[10px] text-ink-400">Báo bởi {iss.reported_by}</p>
    </article>
  );
}

function BentoBig({
  label,
  subLabel,
  value,
  bar,
}: {
  label: string;
  subLabel: string;
  value: string;
  bar: number;
}) {
  return (
    <div className="col-span-2 row-span-1 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-4 text-white ring-1 ring-navy-700 shadow-sm">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
          {label}
        </p>
        <p className="mt-2 font-display text-4xl font-bold leading-none tabular-nums">
          {value}
        </p>
        <p className="mt-1 text-[11px] text-white/50">{subLabel}</p>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500 transition-all"
          style={{ width: `${Math.min(100, bar)}%` }}
        />
      </div>
    </div>
  );
}

function BentoStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'amber' | 'blue' | 'emerald' | 'rose' | 'navy';
}) {
  const valueCls: Record<typeof tone, string> = {
    amber: 'text-amber-700',
    blue: 'text-blue-700',
    emerald: 'text-emerald-700',
    rose: 'text-rose-600',
    navy: 'text-navy-900',
  };
  const iconCls: Record<typeof tone, string> = {
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    rose: 'bg-rose-50 text-rose-600 ring-rose-100',
    navy: 'bg-navy-50 text-navy-700 ring-navy-100',
  };
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-ink-200/60 shadow-sm">
      <div className={cn('inline-grid h-7 w-7 place-items-center rounded-lg ring-1', iconCls[tone])}>
        {icon}
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
        {label}
      </p>
      <p className={cn('mt-1 font-display text-3xl font-bold leading-none tabular-nums', valueCls[tone])}>
        {value}
      </p>
    </div>
  );
}
