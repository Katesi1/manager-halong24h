import { Search } from 'lucide-react';

import { GuestsTableClient } from '@/components/host/guests-table-client';
import { PageHeader } from '@/components/host/page-header';
import { FilterChips } from '@/components/ui/filter-chips';
import { GUEST_LABEL_LABEL, type GuestLabel } from '@/core/entities/guest';
import { buildPageHref, parsePage } from '@/lib/pagination';

const LABEL_KEYS: GuestLabel[] = ['vip', 'regular', 'new', 'restricted'];

function isGuestLabel(value: string | undefined): value is GuestLabel {
  return (
    value === 'vip' ||
    value === 'regular' ||
    value === 'new' ||
    value === 'restricted'
  );
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

  function hrefWith(params: Partial<SearchParams>) {
    return buildPageHref('/host/guests', { q, label, page: undefined, ...params });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Khách hàng"
        description="Hồ sơ khách + lịch sử đặt phòng + nhãn nội bộ (VIP, Khách quen, Hạn chế)."
      />

      {/* Search (URL-driven) */}
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

      {/* Dữ liệu fetch phía CLIENT từ /api/guests → hiện endpoint trong Network */}
      <GuestsTableClient q={q} label={label} page={page} />
    </div>
  );
}
