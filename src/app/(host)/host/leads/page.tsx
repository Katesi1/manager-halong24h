import Link from 'next/link';
import { PageHeader } from '@/components/host/page-header';
import { FilterChips } from '@/components/ui/filter-chips';
import { LeadCard, type LeadCardData } from '@/components/host/lead-card';
import { Pagination } from '@/components/ui/pagination';
import { Lightbulb } from 'lucide-react';
import { listLeadsAction } from '@/app/actions/leads';
import type { Lead, LeadStatus } from '@/core/entities/lead';
import { buildPageHref, pageCount, paginate, parsePage } from '@/lib/pagination';

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

type LeadsState =
  | { leads: LeadCardData[]; mode: 'ok' }
  | { leads: LeadCardData[]; mode: 'error'; error: string };

async function getLeads(): Promise<LeadsState> {
  const res = await listLeadsAction();
  if (!res.ok) {
    // BE lỗi (403/500/network) — hiển thị lỗi rõ ràng, không dùng dữ liệu giả.
    return { leads: [], mode: 'error', error: res.error };
  }
  return { leads: res.data.map(toCardData), mode: 'ok' };
}

export default async function LeadsListPage(props: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const state = await getLeads();
  const allLeads = state.leads;
  const errorMsg = state.mode === 'error' ? state.error : null;

  const counts: Record<LeadStatus, number> = {
    new: allLeads.filter((l) => l.status === 'new').length,
    contacted: allLeads.filter((l) => l.status === 'contacted').length,
    converted: allLeads.filter((l) => l.status === 'converted').length,
    rejected: allLeads.filter((l) => l.status === 'rejected').length,
    expired: allLeads.filter((l) => l.status === 'expired').length,
  };

  const filtered = sp.status ? allLeads.filter((l) => l.status === sp.status) : allLeads;
  const newCount = counts.new;

  const currentPage = parsePage(sp.page);
  const totalPages = pageCount(filtered.length, PAGE_SIZE);
  const pageItems = paginate(filtered, currentPage, PAGE_SIZE);

  function pageHref(page: number) {
    return buildPageHref('/host/leads', {
      status: sp.status,
      page: page > 1 ? String(page) : undefined,
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title={
          <>
            Yêu cầu{' '}
            {newCount > 0 && <span className="text-rose-600">· {newCount} mới</span>}
          </>
        }
        description="Khách gửi qua form liên hệ. Phản hồi nhanh < 30ph để giữ Trust Score và lên Top tìm kiếm."
      />

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          <Lightbulb className="mr-2 inline h-4 w-4" />
          Không tải được yêu cầu từ BE: {errorMsg}
        </div>
      )}

      {/* Filter chips */}
      <div className="mb-5">
        <FilterChips
          active={sp.status ?? 'all'}
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
            Khách gửi yêu cầu sẽ hiện ở đây. Đảm bảo cơ sở đã được duyệt và publish.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {pageItems.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            buildHref={pageHref}
          />
        </>
      )}

      {/* Tip */}
      <div className="mt-6 flex gap-3 rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-900">
        <Lightbulb className="h-5 w-5 shrink-0 text-gold-700" />
        <div>
          <span className="font-semibold">Mẹo:</span> Phản hồi yêu cầu trong 30 phút để giữ Trust
          Score &gt; 90% và{' '}
          <Link href="/host/resources" className="underline font-medium">
            lên Top tìm kiếm
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
