import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Phone, MessageCircle, Mail, Clock, AlertCircle, Check } from 'lucide-react';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeadActions } from '@/components/host/lead-actions';
import { formatDate, formatDateTime, formatVND, minutesAgo, dowLabel } from '@/lib/format';
import type { LeadStatus } from '@/lib/legacy-types';

interface LeadDetail {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  check_in: string | null;
  check_out: string | null;
  num_guests: number | null;
  message: string | null;
  status: LeadStatus;
  created_at: string;
  responded_at: string | null;
  property_id: string;
  property_name: string;
  property_slug: string;
  room_name: string | null;
  room_id: string | null;
  base_price?: number;
  weekend_price?: number | null;
}

const STATUS_VARIANT: Record<LeadStatus, Parameters<typeof Badge>[0]['variant']> = {
  new: 'danger',
  contacted: 'info',
  converted: 'success',
  rejected: 'default',
  expired: 'default',
};
const STATUS_LABEL: Record<LeadStatus, string> = {
  new: '● Mới',
  contacted: 'Đã liên hệ',
  converted: 'Đã chốt booking',
  rejected: 'Đã từ chối',
  expired: 'Hết hạn',
};

const DEMO: Record<string, LeadDetail> = {
  'demo-l-1': {
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
    responded_at: null,
    property_id: 'sample-1',
    property_name: 'À La Carte Hạ Long Bay',
    property_slug: 'a-la-carte-ha-long-bay',
    room_name: '2PN Family Suite',
    room_id: 'sample-r-2',
    base_price: 3_200_000,
    weekend_price: 4_100_000,
  },
};

async function getLead(leadId: string): Promise<LeadDetail | null> {
  return DEMO[leadId] ?? null;
}

function buildCalendar(checkIn: string | null, checkOut: string | null) {
  if (!checkIn) return null;
  const start = new Date(checkIn);
  start.setDate(start.getDate() - 3);
  const days: { date: string; day: number; dow: string; selected: boolean; between: boolean }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const isStart = iso === checkIn;
    const isEnd = checkOut && iso === checkOut;
    const between = checkOut ? iso > checkIn && iso < checkOut : false;
    days.push({
      date: iso,
      day: d.getDate(),
      dow: dowLabel(d),
      selected: !!(isStart || isEnd),
      between,
    });
  }
  return days;
}

function calcEstimate(
  check_in: string | null,
  check_out: string | null,
  base: number,
  weekend: number | null,
) {
  if (!check_in || !check_out) return { lines: [], total: 0 };
  const start = new Date(check_in);
  const end = new Date(check_out);
  const lines: { label: string; value: number; tag?: string }[] = [];
  const cur = new Date(start);
  while (cur < end) {
    const dow = cur.getDay();
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    const price = isWeekend && weekend ? weekend : base;
    lines.push({
      label: `Đêm ${cur.getDate()}/${cur.getMonth() + 1} (${dowLabel(cur)})`,
      value: price,
      tag: isWeekend ? 'Cuối tuần' : undefined,
    });
    cur.setDate(cur.getDate() + 1);
  }
  const total = lines.reduce((s, l) => s + l.value, 0);
  return { lines, total };
}

export default async function LeadDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const ageMin = minutesAgo(lead.created_at);
  const isUrgent = lead.status === 'new' && ageMin < 30;
  const calendar = buildCalendar(lead.check_in, lead.check_out);
  const estimate = calcEstimate(
    lead.check_in,
    lead.check_out,
    lead.base_price ?? 0,
    lead.weekend_price ?? null,
  );
  const nights =
    lead.check_in && lead.check_out
      ? Math.round(
          (new Date(lead.check_out).getTime() - new Date(lead.check_in).getTime()) / 86_400_000,
        )
      : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-28">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/host/leads"
          className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 hover:bg-cream-100"
          aria-label="Quay lại"
        >
          ←
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-ink-900">Yêu cầu đặt phòng</h1>
          <p className="text-xs text-ink-500 font-mono">#{lead.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <Badge variant={STATUS_VARIANT[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="space-y-5">
          {isUrgent && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                <span className="font-bold">{ageMin} phút trước</span> · Phản hồi trong 30 phút để
                giữ Trust Score &gt; 90%
              </span>
            </div>
          )}

          {/* Customer card */}
          <section className="rounded-2xl bg-white p-5 ring-1 ring-ink-200">
            <div className="flex items-center gap-4">
              <GradientAvatar name={lead.guest_name} size="xl" />
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">{lead.guest_name}</h2>
                <p className="text-sm text-ink-500">{lead.guest_phone}</p>
                {lead.guest_email && (
                  <p className="text-xs text-ink-500 truncate">{lead.guest_email}</p>
                )}
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${lead.guest_phone.replace(/\s/g, '')}`}
                  aria-label="Gọi điện"
                  className="grid h-11 w-11 place-items-center rounded-full bg-navy-50 text-navy-700 hover:bg-navy-100 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                </a>
                <a
                  href={`https://zalo.me/${lead.guest_phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Mở Zalo"
                  className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
                {lead.guest_email && (
                  <a
                    href={`mailto:${lead.guest_email}`}
                    aria-label="Email"
                    className="grid h-11 w-11 place-items-center rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Message */}
          {lead.message && (
            <section>
              <h3 className="overline muted no-dash text-[10px] mb-2">
                Tin nhắn từ khách
              </h3>
              <div className="rounded-xl bg-cream-100 p-4 text-sm italic text-ink-900 leading-relaxed border-l-4 border-navy-700">
                &ldquo;{lead.message}&rdquo;
              </div>
            </section>
          )}

          {/* Detail rows */}
          <section>
            <h3 className="overline muted no-dash text-[10px] mb-2">
              Chi tiết yêu cầu
            </h3>
            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-ink-200 divide-y divide-ink-200">
              <Row label="Cơ sở" value={lead.property_name} />
              {lead.room_name && <Row label="Phòng yêu cầu" value={lead.room_name} />}
              {lead.check_in && (
                <Row
                  label="Nhận phòng"
                  value={`${formatDate(lead.check_in)} (${dowLabel(lead.check_in)})`}
                  highlight
                />
              )}
              {lead.check_out && (
                <Row
                  label="Trả phòng"
                  value={`${formatDate(lead.check_out)} (${dowLabel(lead.check_out)})`}
                  highlight
                />
              )}
              {nights > 0 && <Row label="Số đêm" value={`${nights} đêm`} />}
              {lead.num_guests && <Row label="Số khách" value={`${lead.num_guests} khách`} />}
              <Row label="Nguồn" value="Khách liên hệ qua web" />
              <Row label="Gửi lúc" value={formatDateTime(lead.created_at)} />
            </div>
          </section>

          {/* Mini calendar */}
          {calendar && (
            <section>
              <h3 className="overline muted no-dash text-[10px] mb-2">
                Tình trạng phòng
              </h3>
              <div className="rounded-xl bg-white p-4 ring-1 ring-ink-200">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-900">
                    {new Date(calendar[0].date).toLocaleDateString('vi-VN', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    ● Còn trống
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {calendar.map((d) => (
                    <div
                      key={d.date}
                      className={
                        'aspect-square rounded-md text-center text-xs leading-tight p-1.5 ring-1 ' +
                        (d.selected
                          ? 'bg-navy-700 text-white ring-navy-700 font-bold'
                          : d.between
                            ? 'bg-navy-50 text-navy-900 ring-navy-200'
                            : 'bg-white text-ink-700 ring-ink-100')
                      }
                    >
                      <div className="text-[9px] opacity-70">{d.dow}</div>
                      <div>{d.day}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {estimate.total > 0 && (
            <section className="rounded-2xl bg-white p-5 ring-1 ring-ink-200 sticky top-4">
              <h3 className="overline muted no-dash text-[10px] mb-3">
                Tạm tính
              </h3>
              <ul className="space-y-2 text-sm">
                {estimate.lines.map((l, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="text-ink-700">
                      {l.label}
                      {l.tag && (
                        <span className="ml-1.5 inline-block rounded bg-gold-100 px-1.5 text-[9px] font-bold text-gold-800 align-middle">
                          ⚡ {l.tag}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-ink-900">{formatVND(l.value)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-ink-200 pt-3 mt-3 text-base">
                  <span className="font-bold text-ink-900">Tổng cộng</span>
                  <span className="font-bold text-navy-900">{formatVND(estimate.total)}</span>
                </li>
              </ul>
              <p className="mt-3 text-[11px] text-ink-500">
                Khách phải xác nhận giá cuối cùng trước khi tạo booking.
              </p>
            </section>
          )}

          <Link
            href={`/property/${lead.property_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-ink-200 px-4 py-3 text-center text-sm font-medium text-ink-700 hover:bg-cream-100"
          >
            Xem trang công khai ↗
          </Link>
        </aside>
      </div>

      {/* Sticky bottom CTA */}
      {lead.status !== 'converted' && lead.status !== 'rejected' && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 lg:px-8 py-3">
            <div className="flex-1 hidden md:flex items-center gap-1.5 text-xs text-ink-500">
              <Clock className="h-3 w-3" />
              Phản hồi sớm để tăng tỷ lệ chốt
            </div>
            {lead.status === 'new' && (
              <LeadActions leadId={lead.id} currentStatus={lead.status} />
            )}
            <Link
              href={`/host/bookings/new?lead=${lead.id}&property=${lead.property_id}${lead.room_id ? `&room=${lead.room_id}` : ''}${lead.check_in ? `&check_in=${lead.check_in}` : ''}${lead.check_out ? `&check_out=${lead.check_out}` : ''}`}
            >
              <Button variant="gold" className="gap-1.5">
                <Check className="h-4 w-4" /> Chuyển thành booking
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className={highlight ? 'font-semibold text-navy-700' : 'font-semibold text-ink-900'}>
        {value}
      </span>
    </div>
  );
}
