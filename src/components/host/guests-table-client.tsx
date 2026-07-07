'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';

import { GuestLabelBadge } from '@/components/host/guest-label-badge';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { Pagination } from '@/components/ui/pagination';
import type {
  GuestLabel,
  GuestListItem,
  PaginatedGuests,
} from '@/core/entities/guest';
import { displayName, formatRelativeOrDate } from '@/lib/format';
import { buildPageHref } from '@/lib/pagination';
import { useApiResource } from '@/lib/use-api-resource';

const PAGE_SIZE = 20;

interface Props {
  q?: string;
  label?: GuestLabel;
  page: number;
}

/**
 * Bảng khách fetch từ `/api/guests` PHÍA CLIENT → endpoint hiện trong F12
 * Network. Phân trang + filter server-side (đổi q/label/page → url đổi → refetch).
 */
export function GuestsTableClient({ q, label, page }: Props) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (label) params.set('label', label);
  if (page > 1) params.set('page', String(page));
  params.set('limit', String(PAGE_SIZE));
  const { loading, error, data } = useApiResource<PaginatedGuests>(
    `/api/guests?${params.toString()}`,
  );

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error) {
    return (
      <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
        Không tải được danh sách khách: {error}
      </div>
    );
  }

  const items: GuestListItem[] = data?.items ?? [];

  if (items.length === 0) {
    return (
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
    );
  }

  return (
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
        currentPage={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalItems={data?.total ?? items.length}
        pageSize={PAGE_SIZE}
        buildHref={(p) =>
          buildPageHref('/host/guests', {
            q,
            label,
            page: p > 1 ? String(p) : undefined,
          })
        }
      />
    </>
  );
}

function GuestRow({ guest }: { guest: GuestListItem }) {
  const name = displayName(guest.name, guest.email);
  return (
    <tr className="transition-colors hover:bg-cream-50">
      <td className="px-4 py-3">
        <Link
          href={`/host/guests/${guest.id}`}
          className="flex items-center gap-3"
        >
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
