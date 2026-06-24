import Link from 'next/link';
import { Users, Search, AlertCircle } from 'lucide-react';

import { PageHeader } from '@/components/host/page-header';
import { FilterChips } from '@/components/ui/filter-chips';
import { Pagination } from '@/components/ui/pagination';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { GuestLabelBadge } from '@/components/host/guest-label-badge';
import { listGuestsAction } from '@/app/actions/guests';
import {
  GUEST_LABEL_LABEL,
  type GuestLabel,
  type GuestListItem,
} from '@/core/entities/guest';
import { displayName, formatRelativeOrDate } from '@/lib/format';
import { buildPageHref, parsePage } from '@/lib/pagination';

const PAGE_SIZE = 20;

const LABEL_KEYS: GuestLabel[] = ['vip', 'regular', 'new', 'restricted'];

function isGuestLabel(value: string | undefined): value is GuestLabel {
  return value === 'vip' || value === 'regular' || value === 'new' || value === 'restricted';
}

interface SearchParams {
  q?: string;
  label?: string;
  page?: string;
}

export default async function HostGuestsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await props.searchParams;
  const q = sp.q?.trim() || undefined;
  const label = isGuestLabel(sp.label) ? sp.label : undefined;
  const page = parsePage(sp.page);

  const res = await listGuestsAction({ q, label, page, limit: PAGE_SIZE });

  const errorMsg = res.ok ? null : res.error;
  const items: GuestListItem[] = res.ok ? res.data.items : [];
  const total = res.ok ? res.data.total : 0;
  const totalPages = res.ok ? res.data.totalPages : 1;
  const currentPage = res.ok ? res.data.page : page;

  function hrefWith(params: Partial<SearchParams>) {
    return buildPageHref('/host/guests', {
      q,
      label,
      page: undefined,
      ...params,
    });
  }

  function pageHref(p: number) {
    return buildPageHref('/host/guests', {
      q,
      label,
      page: p > 1 ? String(p) : undefined,
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Khách hàng"
        description="Hồ sơ khách + lịch sử đặt phòng + nhãn nội bộ (VIP, Khách quen, Hạn chế)."
      />

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Không tải được danh sách khách: {errorMsg}
        </div>
      )}

      {/* Search */}
      <form action="/host/guests" method="get" className="mb-4">
        {label && <input type="hidden" name="label" value={label} />}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Tìm theo tên, số điện thoại hoặc email…"
            maxLength={100}
            className="h-11 w-full rounded-xl border border-ink-200 bg-white pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-ink-400 focus:border-navy-400 focus:ring-2 focus:ring-navy-100"
          />
        </div>
      </form>

      {/* Label filter */}
      <div className="mb-5">
        <FilterChips
          active={label ?? 'all'}
          items={[
            { key: 'all', label: 'Tất cả', href: hrefWith({ label: undefined }) },
            ...LABEL_KEYS.map((k) => ({
              key: k,
              label: GUEST_LABEL_LABEL[k],
              href: hrefWith({ label: k }),
            })),
          ]}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <Users className="h-7 w-7 text-ink-400" />
          </div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
            {q || label ? 'Không tìm thấy khách phù hợp' : 'Chưa có hồ sơ khách hàng'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            {q || label
              ? 'Thử bỏ bộ lọc hoặc đổi từ khoá tìm kiếm.'
              : 'Khi có đặt phòng đầu tiên, hệ thống sẽ tự tạo hồ sơ khách cùng lịch sử đặt phòng và nhãn nội bộ.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-3 font-semibold">Khách</th>
                  <th className="px-4 py-3 font-semibold">Nhãn</th>
                  <th className="px-4 py-3 text-center font-semibold">Tổng đặt</th>
                  <th className="px-4 py-3 text-center font-semibold">Hoàn tất</th>
                  <th className="px-4 py-3 text-center font-semibold">Đã huỷ</th>
                  <th className="px-4 py-3 font-semibold">Đặt gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {items.map((g) => (
                  <GuestRow key={g.id} guest={g} />
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            buildHref={pageHref}
          />
        </>
      )}
    </div>
  );
}

function GuestRow({ guest }: { guest: GuestListItem }) {
  const name = displayName(guest.name, guest.email);
  return (
    <tr className="transition-colors hover:bg-cream-50">
      <td className="px-4 py-3">
        <Link href={`/host/guests/${guest.id}`} className="flex items-center gap-3">
          <GradientAvatar name={name} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-navy-900 hover:underline">{name}</p>
            <p className="truncate text-xs text-ink-500">
              {guest.phone ?? guest.email ?? '—'}
            </p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3">
        <GuestLabelBadge label={guest.label} />
      </td>
      <td className="px-4 py-3 text-center font-semibold text-ink-900">
        {guest.stats.totalBookings}
      </td>
      <td className="px-4 py-3 text-center text-emerald-700">
        {guest.stats.completedBookings}
      </td>
      <td className="px-4 py-3 text-center text-rose-600">
        {guest.stats.cancelledBookings}
      </td>
      <td className="px-4 py-3 text-ink-600">
        {guest.lastBookingAt ? formatRelativeOrDate(guest.lastBookingAt) : '—'}
      </td>
    </tr>
  );
}
