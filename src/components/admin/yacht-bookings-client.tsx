'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ship } from 'lucide-react';

import { StatCard } from '@/components/host/page-header';
import { ClientPagination } from '@/components/ui/client-pagination';
import type { YachtBooking, YachtBookingStatus } from '@/core/entities/yacht-booking';
import { formatVND } from '@/core/value-objects/vnd';
import { formatDate } from '@/lib/format';
import {
  YACHT_BOOKING_STATUS_LABEL,
  YACHT_BOOKING_STATUS_VARIANT,
} from '@/lib/yacht-display';
import { useApiResource } from '@/lib/use-api-resource';

const PAGE_SIZE = 10;

type Tab = YachtBookingStatus | 'all';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: YACHT_BOOKING_STATUS_LABEL.pending },
  { key: 'confirmed', label: YACHT_BOOKING_STATUS_LABEL.confirmed },
  { key: 'paid', label: YACHT_BOOKING_STATUS_LABEL.paid },
  { key: 'completed', label: YACHT_BOOKING_STATUS_LABEL.completed },
  { key: 'cancelled', label: YACHT_BOOKING_STATUS_LABEL.cancelled },
];

export function YachtBookingsClient({ status }: { status?: YachtBookingStatus }) {
  const { loading, error, data } = useApiResource<YachtBooking[]>('/api/admin/yacht-bookings');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status]);

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <span className="font-semibold">Không tải được đơn du thuyền: </span>
        {error}
      </div>
    );
  }

  const all = data ?? [];
  const activeTab: Tab = status ?? 'all';
  const rows = activeTab === 'all' ? all : all.filter((b) => b.status === activeTab);
  const countOf = (k: Tab) => (k === 'all' ? all.length : all.filter((b) => b.status === k).length);
  const revenue = all
    .filter((b) => b.status === 'paid' || b.status === 'completed')
    .reduce((s, b) => s + (b.paidAmount ?? b.totalAmount ?? 0), 0);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageItems = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng đơn" value={String(all.length)} hint="du thuyền" />
        <StatCard label="Chờ xác nhận" value={String(countOf('pending'))} hint="cần xử lý" />
        <StatCard label="Chờ thanh toán" value={String(countOf('confirmed'))} hint="đã gửi VietQR" />
        <StatCard label="Doanh thu đã thu" value={formatVND(revenue)} hint="đơn đã thanh toán" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const href = tab.key === 'all' ? '/admin/yacht-bookings' : `/admin/yacht-bookings?status=${tab.key}`;
          return (
            <Link
              key={tab.key}
              href={href}
              className={
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ' +
                (isActive ? 'bg-navy-900 text-cream-50' : 'bg-white text-ink-700 ring-1 ring-ink-200/70 hover:bg-cream-100')
              }
            >
              {tab.label}
              <span className={isActive ? 'text-cream-50/80' : 'text-ink-400'}>{countOf(tab.key)}</span>
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <Ship className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-3 font-medium text-ink-900">Chưa có đơn đặt du thuyền nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-ink-200/60">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-ink-200 bg-cream-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Khách</th>
                <th className="px-4 py-3">Tour</th>
                <th className="px-4 py-3">Ngày đi tour</th>
                <th className="px-4 py-3">Khách</th>
                <th className="px-4 py-3 text-right">Tổng tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/70">
              {pageItems.map((b) => (
                <tr key={b.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/yacht-bookings/${b.id}`} className="font-semibold text-navy-900 hover:underline">
                      {b.customerName || '—'}
                    </Link>
                    <p className="text-xs text-ink-500">{b.customerPhone ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{b.yachtName || '—'}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {formatDate(b.checkInAt)}
                    {b.checkOutAt && b.checkOutAt.slice(0, 10) !== b.checkInAt.slice(0, 10)
                      ? ` → ${formatDate(b.checkOutAt)}`
                      : ''}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{b.guestCount}</td>
                  <td className="px-4 py-3 text-right font-medium text-navy-900">{formatVND(b.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={'rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ' + YACHT_BOOKING_STATUS_VARIANT[b.status]}>
                      {YACHT_BOOKING_STATUS_LABEL[b.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <ClientPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={rows.length}
          pageSize={PAGE_SIZE}
        />
      )}
    </>
  );
}
