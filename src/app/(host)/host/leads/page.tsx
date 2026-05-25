import Link from 'next/link';
import { PageHeader } from '@/components/host/page-header';
import { FilterChips } from '@/components/ui/filter-chips';
import { LeadCard, type LeadCardData } from '@/components/host/lead-card';
import { Lightbulb } from 'lucide-react';
import type { LeadStatus } from '@/lib/legacy-types';

const DEMO: LeadCardData[] = [
  {
    id: 'demo-l-1',
    guest_name: 'Lê Văn Đức',
    guest_phone: '+84 901 234 567',
    guest_email: 'leduc@example.com',
    check_in: '2026-05-01',
    check_out: '2026-05-04',
    num_guests: 4,
    message:
      'Đi gia đình 4 người, có 2 trẻ con. Cần phòng tầng cao, view biển nếu được. Có thể check-in sớm 12h trưa được không ạ?',
    status: 'new',
    created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
    property_name: 'À La Carte Hạ Long Bay',
    room_name: '2PN Family Suite',
  },
  {
    id: 'demo-l-2',
    guest_name: 'Vũ Quỳnh Anh',
    guest_phone: '+84 987 654 321',
    guest_email: null,
    check_in: '2026-05-10',
    check_out: '2026-05-12',
    num_guests: 2,
    message: 'Có phòng view biển trực diện ngày này không em?',
    status: 'new',
    created_at: new Date(Date.now() - 12 * 60_000).toISOString(),
    property_name: 'Sun Grand City Feria',
    room_name: 'Studio Premium View Vịnh',
  },
  {
    id: 'demo-l-3',
    guest_name: 'Nguyễn Anh Tú',
    guest_phone: '+84 901 555 234',
    guest_email: 'tu@example.com',
    check_in: '2026-04-28',
    check_out: '2026-04-30',
    num_guests: 2,
    message: 'Có thể đón sân bay không?',
    status: 'new',
    created_at: new Date(Date.now() - 38 * 60_000).toISOString(),
    property_name: 'À La Carte Hạ Long Bay',
    room_name: 'Studio Premium View Vịnh',
  },
  {
    id: 'demo-l-4',
    guest_name: 'Đoàn Mạnh Tuấn',
    guest_phone: '+84 912 345 678',
    guest_email: 'tuan@example.com',
    check_in: '2026-04-30',
    check_out: '2026-05-03',
    num_guests: 6,
    message: 'Lễ 30/4, đặt cho công ty 6 người. Cần hoá đơn VAT.',
    status: 'contacted',
    created_at: new Date(Date.now() - 4 * 3600_000).toISOString(),
    property_name: 'À La Carte Hạ Long Bay',
    room_name: 'Penthouse 3PN Sky Suite',
  },
  {
    id: 'demo-l-5',
    guest_name: 'Phan Đức Long',
    guest_phone: '+84 888 999 000',
    guest_email: null,
    check_in: null,
    check_out: null,
    num_guests: null,
    message: 'Cho hỏi giá tháng 6 ạ?',
    status: 'rejected',
    created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    property_name: 'Sun Grand City Feria',
    room_name: null,
  },
];

async function getLeads(): Promise<LeadCardData[]> {
  return DEMO;
}

export default async function LeadsListPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await props.searchParams;
  const allLeads = await getLeads();

  const counts: Record<LeadStatus, number> = {
    new: allLeads.filter((l) => l.status === 'new').length,
    contacted: allLeads.filter((l) => l.status === 'contacted').length,
    converted: allLeads.filter((l) => l.status === 'converted').length,
    rejected: allLeads.filter((l) => l.status === 'rejected').length,
    expired: allLeads.filter((l) => l.status === 'expired').length,
  };

  const filtered = sp.status ? allLeads.filter((l) => l.status === sp.status) : allLeads;
  const newCount = counts.new;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title={
          <>
            Yêu cầu{' '}
            {newCount > 0 && <span className="text-rose-600">· {newCount} mới</span>}
          </>
        }
        description="Khách gửi qua form liên hệ. Phản hồi nhanh < 30ph để giữ Trust Score và lên Top tìm kiếm."
      />

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
        <div className="space-y-3">
          {filtered.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
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
