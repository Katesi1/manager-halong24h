import type { Metadata } from 'next';
import Link from 'next/link';
import { Landmark } from 'lucide-react';

import { listBankAccountsAction } from '@/app/actions/bank-accounts';
import { BankAccountRowActions } from '@/components/admin/bank-account-row-actions';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import {
  BANK_STATUS_LABEL,
  type BankAccountQueueResult,
  type BankDetails,
  type BankQueueFilter,
  type BankStatus,
} from '@/core/entities/bank-account';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Duyệt tài khoản nhận tiền' };

const PAGE_SIZE = 20;

const TABS: { key: BankQueueFilter; label: string }[] = [
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Đã từ chối' },
  { key: 'all', label: 'Tất cả' },
];

function parseFilter(raw: string | undefined): BankQueueFilter {
  if (raw === 'approved' || raw === 'rejected' || raw === 'all') return raw;
  return 'pending';
}

const STATUS_VARIANT: Record<
  BankStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  none: 'default',
  pending: 'gold',
  approved: 'success',
  rejected: 'danger',
};

function buildHref(base: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

const EMPTY_RESULT: BankAccountQueueResult = {
  filter: 'pending',
  pendingCount: 0,
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  items: [],
};

/** Ô hiển thị 1 bộ STK (3 dòng: ngân hàng · số TK · chủ TK). */
function BankCell({ d, muted }: { d: BankDetails | null; muted?: boolean }) {
  if (!d || (!d.bankAccountNumber && !d.bankAccountName)) {
    return <span className="text-xs text-ink-400">—</span>;
  }
  return (
    <div className={muted ? 'text-ink-500' : 'text-ink-800'}>
      <p className="text-sm font-medium">{d.bankName ?? 'Ngân hàng'}</p>
      <p className="font-mono text-[13px]">{d.bankAccountNumber ?? '—'}</p>
      <p className="text-xs uppercase text-ink-500">{d.bankAccountName ?? ''}</p>
    </div>
  );
}

export default async function AdminBankAccountsPage(props: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const filter = parseFilter(sp.status);
  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const result = await listBankAccountsAction({
    filter,
    page: currentPage,
    limit: PAGE_SIZE,
  });
  const queue: BankAccountQueueResult = result.ok ? result.data : EMPTY_RESULT;
  const apiError = !result.ok ? result.error : null;

  const totalPages = Math.max(1, Math.ceil(queue.total / PAGE_SIZE));

  function pageHref(page: number) {
    return buildHref('/admin/bank-accounts', {
      status: filter === 'pending' ? undefined : filter,
      page: page > 1 ? String(page) : undefined,
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Tài chính & hỗ trợ"
        title="Duyệt tài khoản nhận tiền"
        description="Chủ nhà gửi số tài khoản ngân hàng để nhận tiền cọc từ khách. Duyệt để STK được dùng sinh mã VietQR; từ chối kèm lý do nếu thông tin không hợp lệ."
      />

      {apiError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">Không tải được danh sách: </span>
          {apiError}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const active = filter === t.key;
          return (
            <Link
              key={t.key}
              href={buildHref('/admin/bank-accounts', {
                status: t.key === 'pending' ? undefined : t.key,
              })}
              className={
                'rounded-lg px-3.5 py-2 text-sm font-medium transition-all ' +
                (active
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900')
              }
            >
              {t.label}
              {t.key === 'pending' && queue.pendingCount > 0 && (
                <span
                  className={
                    'ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ' +
                    (active
                      ? 'bg-white text-navy-900'
                      : 'bg-rose-100 text-rose-700')
                  }
                >
                  {queue.pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {queue.total === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <Landmark className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-sm font-medium text-ink-700">
            {filter === 'pending'
              ? 'Không có yêu cầu nào đang chờ duyệt.'
              : 'Không có tài khoản phù hợp.'}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Chủ nhà cấu hình STK trong app / web sẽ xuất hiện tại đây để duyệt.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-cream-50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Chủ nhà
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    STK chờ duyệt
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    STK đang dùng
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Gửi lúc
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {queue.items.map((it) => (
                  <tr key={it.id} className="transition-colors hover:bg-cream-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-200 text-xs font-bold uppercase text-navy-800">
                          {(it.name || '?').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-900">
                            {it.name || 'Chủ nhà'}
                          </p>
                          <p className="truncate text-xs text-ink-500">
                            {it.email}
                          </p>
                          {it.phone && (
                            <p className="text-xs text-ink-400">{it.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <BankCell d={it.pending} />
                    </td>
                    <td className="px-5 py-4 align-top">
                      <BankCell d={it.current} muted />
                    </td>
                    <td className="px-5 py-4 align-top">
                      <Badge variant={STATUS_VARIANT[it.status]}>
                        {BANK_STATUS_LABEL[it.status]}
                      </Badge>
                      {it.status === 'rejected' && it.rejectReason && (
                        <p className="mt-1.5 max-w-[220px] text-[11px] text-rose-600 line-clamp-3">
                          {it.rejectReason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top whitespace-nowrap text-ink-500">
                      {it.submittedAt ? formatDateTime(it.submittedAt) : '—'}
                    </td>
                    <td className="px-5 py-4 align-top text-right">
                      <BankAccountRowActions
                        userId={it.id}
                        ownerName={it.name || 'chủ nhà'}
                        status={it.status}
                        pending={it.pending}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={queue.total}
            pageSize={PAGE_SIZE}
            buildHref={pageHref}
          />
        </>
      )}
    </div>
  );
}
