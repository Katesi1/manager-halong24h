'use client';

import { LeadCard, type LeadCardData } from '@/components/host/lead-card';
import { ClientPagination } from '@/components/ui/client-pagination';
import { FilterChips } from '@/components/ui/filter-chips';
import type { Lead, LeadStatus } from '@/core/entities/lead';
import { useApiResource } from '@/lib/use-api-resource';
import { useState } from 'react';

const PAGE_SIZE = 10;

function toCardData(lead: Lead): LeadCardData {
  return {
    id: lead.id,
    guest_name: lead.guestName,
    guest_phone: lead.guestPhone,
    guest_email: lead.guestEmail,
    check_in: lead.checkIn,
    check_out: lead.checkOut,
    num_guests: lead.numGuests,
    message: lead.message,
    status: lead.status,
    created_at: lead.createdAt,
    property_name: lead.propertyName ?? '—',
    room_name: null,
  };
}

/**
 * Danh sách yêu cầu (lead) fetch từ `/api/leads` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Filter theo `status` (URL) + đếm + phân trang in-memory.
 */
export function LeadsListClient({ status }: { status?: LeadStatus }) {
  const { loading, error, data } = useApiResource<Lead[]>('/api/leads');
  const [page, setPage] = useState(1);

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error) {
    return (
      <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
        Không tải được yêu cầu: {error}
      </div>
    );
  }

  const allLeads = (data ?? []).map(toCardData);
  const counts: Record<LeadStatus, number> = {
    new: allLeads.filter((l) => l.status === 'new').length,
    contacted: allLeads.filter((l) => l.status === 'contacted').length,
    converted: allLeads.filter((l) => l.status === 'converted').length,
    rejected: allLeads.filter((l) => l.status === 'rejected').length,
    expired: allLeads.filter((l) => l.status === 'expired').length,
  };
  const filtered = status ? allLeads.filter((l) => l.status === status) : allLeads;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="mb-5">
        <FilterChips
          active={status ?? 'all'}
          items={[
            { key: 'all', label: 'Tất cả', href: '/host/leads', count: allLeads.length },
            { key: 'new', label: 'Mới', href: '/host/leads?status=new', count: counts.new },
            { key: 'contacted', label: 'Đã liên hệ', href: '/host/leads?status=contacted', count: counts.contacted },
            { key: 'converted', label: 'Đã chốt', href: '/host/leads?status=converted', count: counts.converted },
            { key: 'rejected', label: 'Từ chối', href: '/host/leads?status=rejected', count: counts.rejected },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <p className="text-2xl">📥</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-navy-900">
            Chưa có yêu cầu nào
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Khách gửi yêu cầu sẽ hiện ở đây. Đảm bảo cơ sở đã được duyệt và
            publish.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {pageItems.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
          <ClientPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </>
  );
}
