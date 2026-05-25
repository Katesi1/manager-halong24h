import { Crown, Ban, Repeat } from 'lucide-react';
import { PageHeader } from '@/components/host/page-header';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { FilterChips, type ChipItem } from '@/components/ui/filter-chips';
import { Badge } from '@/components/ui/badge';
import { formatVND, formatDate } from '@/lib/format';
import type { Guest } from '@/lib/legacy-types';

const DEMO: Guest[] = [
  {
    id: 'g-1',
    tenant_id: 'sample-tenant',
    phone: '0901234567',
    full_name: 'Lê Văn Đức',
    email: 'leduc@example.com',
    total_bookings: 5,
    total_spent: 28_500_000,
    tags: ['vip'],
    notes_internal: 'Khách quen, thích phòng tầng cao view biển. Sinh nhật T6.',
    last_visit_at: '2026-04-26',
    created_at: '2025-08-01',
    updated_at: '2026-04-26',
  },
  {
    id: 'g-2',
    tenant_id: 'sample-tenant',
    phone: '0987654321',
    full_name: 'Trần Minh Quân',
    email: null,
    total_bookings: 2,
    total_spent: 8_400_000,
    tags: ['returning'],
    notes_internal: null,
    last_visit_at: '2026-04-12',
    created_at: '2026-01-15',
    updated_at: '2026-04-12',
  },
  {
    id: 'g-3',
    tenant_id: 'sample-tenant',
    phone: '0912345678',
    full_name: 'Phạm Thúy Linh',
    email: 'linh@example.com',
    total_bookings: 7,
    total_spent: 42_000_000,
    tags: ['vip'],
    notes_internal: 'Đặt theo đoàn 4-6 người. Cần xe đón sân bay.',
    last_visit_at: '2026-03-25',
    created_at: '2024-11-10',
    updated_at: '2026-03-25',
  },
  {
    id: 'g-4',
    tenant_id: 'sample-tenant',
    phone: '0888999000',
    full_name: 'Hoàng Tuấn Anh',
    email: null,
    total_bookings: 1,
    total_spent: 1_850_000,
    tags: [],
    notes_internal: null,
    last_visit_at: '2026-04-18',
    created_at: '2026-04-15',
    updated_at: '2026-04-18',
  },
  {
    id: 'g-5',
    tenant_id: 'sample-tenant',
    phone: '0901111222',
    full_name: 'Đoàn Mạnh Tuấn',
    email: 'tuan@example.com',
    total_bookings: 4,
    total_spent: 35_200_000,
    tags: ['vip', 'returning'],
    notes_internal: 'Thường book 2 phòng cùng lúc.',
    last_visit_at: '2026-04-01',
    created_at: '2025-05-20',
    updated_at: '2026-04-01',
  },
  {
    id: 'g-6',
    tenant_id: 'sample-tenant',
    phone: '0977000111',
    full_name: 'Nguyễn Hữu Cường',
    email: null,
    total_bookings: 1,
    total_spent: 2_400_000,
    tags: ['blacklist'],
    notes_internal: 'Gây ồn 3h sáng, làm hư đồ. Không nhận đặt nữa.',
    last_visit_at: '2025-12-08',
    created_at: '2025-12-01',
    updated_at: '2025-12-09',
  },
];

async function getGuests(): Promise<Guest[]> {
  return DEMO;
}

interface PageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function HostGuestsPage(props: PageProps) {
  const sp = await props.searchParams;
  const activeTag = sp.tag ?? 'all';
  const all = await getGuests();

  const counts = {
    all: all.length,
    vip: all.filter((g) => g.tags.includes('vip')).length,
    returning: all.filter((g) => g.tags.includes('returning')).length,
    blacklist: all.filter((g) => g.tags.includes('blacklist')).length,
  };

  const guests =
    activeTag === 'all' ? all : all.filter((g) => g.tags.includes(activeTag));

  const chips: ChipItem[] = [
    { key: 'all', label: 'Tất cả', href: '/host/guests', count: counts.all },
    { key: 'vip', label: '⭐ VIP', href: '/host/guests?tag=vip', count: counts.vip },
    {
      key: 'returning',
      label: '🔁 Khách quen',
      href: '/host/guests?tag=returning',
      count: counts.returning,
    },
    {
      key: 'blacklist',
      label: '🚫 Hạn chế',
      href: '/host/guests?tag=blacklist',
      count: counts.blacklist,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Khách hàng"
        description="Hồ sơ khách + lịch sử đặt phòng + nhãn nội bộ (VIP, Khách quen, Hạn chế)"
      />

      <div className="mb-5">
        <FilterChips items={chips} active={activeTag} />
      </div>

      {guests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-ink-500">
          {activeTag === 'all'
            ? 'Chưa có khách hàng nào. Khi có đặt phòng đầu tiên, hệ thống sẽ tự tạo hồ sơ.'
            : 'Không có khách phù hợp với bộ lọc'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-ink-200 bg-cream-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Khách</th>
                <th className="px-4 py-3">Nhãn</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3 text-right">Số lượt đặt</th>
                <th className="px-4 py-3 text-right">Tổng chi</th>
                <th className="px-4 py-3">Ghé gần nhất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {guests.map((g) => {
                const isBlacklist = g.tags.includes('blacklist');
                return (
                  <tr
                    key={g.id}
                    className={
                      isBlacklist ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-cream-100'
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <GradientAvatar name={g.full_name ?? g.phone} size="md" />
                        <div>
                          <p className="font-semibold text-ink-900">
                            {g.full_name ?? 'Khách'}
                          </p>
                          {g.notes_internal && (
                            <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-ink-500">
                              💬 {g.notes_internal}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {g.tags.includes('vip') && (
                          <Badge variant="gold">
                            <Crown className="mr-1 h-3 w-3" /> VIP
                          </Badge>
                        )}
                        {g.tags.includes('returning') && (
                          <Badge variant="default">
                            <Repeat className="mr-1 h-3 w-3" /> Khách quen
                          </Badge>
                        )}
                        {g.tags.includes('blacklist') && (
                          <Badge variant="danger">
                            <Ban className="mr-1 h-3 w-3" /> Hạn chế
                          </Badge>
                        )}
                        {g.tags.length === 0 && (
                          <span className="text-xs text-ink-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink-700">{g.phone}</p>
                      {g.email && <p className="text-xs text-ink-500">{g.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ink-900">
                      {g.total_bookings}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      {formatVND(Number(g.total_spent ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {g.last_visit_at ? formatDate(g.last_visit_at) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-ink-500">
        Nhãn nội bộ: <strong className="text-gold-700">VIP</strong> = ≥3 lượt đặt hoặc ≥20tr •{' '}
        <strong className="text-navy-700">Khách quen</strong> = ≥2 lượt đặt •{' '}
        <strong className="text-red-700">Hạn chế</strong> = chủ nhà tự gán (không
        nhận đặt nữa).
      </p>
    </div>
  );
}
