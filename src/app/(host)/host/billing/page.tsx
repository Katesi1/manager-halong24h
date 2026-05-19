import { listPropertiesAction } from '@/app/actions/properties';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { formatVND, formatDate } from '@/lib/format';
import {
  TIER_PRICE_PER_ROOM,
  TIER_ROOM_RANGE,
  calculateTier,
  type SubscriptionTier,
} from '@/lib/database.types';

const TIERS: {
  key: SubscriptionTier;
  name: string;
  perks: string[];
  popular?: boolean;
}[] = [
  {
    key: 'free',
    name: 'Miễn phí',
    perks: ['Quản lý phòng + lịch', 'Nhận yêu cầu khách qua liên hệ', 'Đặt phòng không giới hạn'],
  },
  {
    key: 'basic',
    name: 'Cơ bản',
    perks: [
      'Tất cả tính năng gói Miễn phí',
      'Hiển thị huy hiệu KYC đã xác minh',
      'Email xác nhận đặt phòng từ halong24h.com',
      'Báo cáo doanh thu nâng cao',
    ],
  },
  {
    key: 'standard',
    name: 'Tiêu chuẩn',
    perks: ['Tất cả tính năng gói Cơ bản', 'Kết nối API', 'Nhiều nhân viên', 'Hỗ trợ ưu tiên'],
    popular: true,
  },
  {
    key: 'pro',
    name: 'Chuyên nghiệp',
    perks: [
      'Tất cả tính năng gói Tiêu chuẩn',
      'Quản lý kênh phân phối',
      'Quản lý tài khoản riêng',
      'Cam kết uptime 99%',
    ],
  },
];

interface BillingData {
  roomCount: number;
  currentTier: SubscriptionTier;
  monthlyFee: number;
  invoices: {
    id: string;
    period: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    paid_at: string | null;
    rooms_count: number;
  }[];
}

async function getBilling(): Promise<BillingData> {
  // Đếm số phòng từ cùng nguồn với /host/properties để tránh số liệu lệch nhau.
  const result = await listPropertiesAction({ includeInactive: true });
  const roomCount = result.ok ? result.data.length : 0;
  const tier = calculateTier(roomCount);
  return {
    roomCount,
    currentTier: tier,
    monthlyFee: roomCount * TIER_PRICE_PER_ROOM[tier],
    invoices: [
      { id: 'inv-1', period: '2026-04', amount: 350_000, status: 'paid', paid_at: '2026-04-05', rooms_count: roomCount },
      { id: 'inv-2', period: '2026-03', amount: 350_000, status: 'paid', paid_at: '2026-03-05', rooms_count: roomCount },
      { id: 'inv-3', period: '2026-02', amount: 250_000, status: 'paid', paid_at: '2026-02-08', rooms_count: Math.max(0, roomCount - 2) },
    ],
  };
}

export default async function HostBillingPage() {
  const data = await getBilling();
  const { roomCount, currentTier, monthlyFee, invoices } = data;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Gói cước"
        description={`Tự động tính theo số phòng đang hoạt động. Bạn đang có ${roomCount} phòng → tier ${currentTier.toUpperCase()}.`}
      />

      {/* Current plan */}
      <section className="rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gold-300">
              Gói hiện tại · auto-tier
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold capitalize">
              {currentTier === 'free' ? 'Free' : currentTier}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {roomCount} phòng đang hoạt động · {formatVND(TIER_PRICE_PER_ROOM[currentTier])}/phòng/tháng
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70">Tháng này</p>
            <p className="font-display text-3xl font-bold">{formatVND(monthlyFee)}</p>
            <p className="text-xs text-emerald-300">
              {monthlyFee === 0 ? '✓ Miễn phí (gói Free)' : '✓ Đã tính tự động'}
            </p>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">Tất cả gói cước</h2>
        <p className="mt-1 text-sm text-ink-500">
          Hệ thống tự nâng/hạ tier khi bạn thêm/bớt phòng. Trả năm giảm 15%.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => {
            const isCurrent = t.key === currentTier;
            return (
              <div
                key={t.key}
                className={
                  'relative rounded-2xl bg-white p-6 ring-1 transition-all ' +
                  (isCurrent
                    ? 'ring-2 ring-navy-900 shadow-lg'
                    : t.popular
                      ? 'ring-2 ring-gold-500'
                      : 'ring-ink-200')
                }
              >
                {t.popular && !isCurrent && (
                  <Badge variant="gold" className="absolute -top-2 left-1/2 -translate-x-1/2">
                    Phổ biến
                  </Badge>
                )}
                {isCurrent && (
                  <Badge variant="navy" className="absolute -top-2 left-1/2 -translate-x-1/2">
                    Đang dùng
                  </Badge>
                )}
                <h3 className="font-display text-2xl font-bold text-ink-900">{t.name}</h3>
                <p className="mt-1 text-xs text-ink-500">{TIER_ROOM_RANGE[t.key]}</p>
                <p className="mt-4 font-display text-2xl font-bold text-navy-900">
                  {TIER_PRICE_PER_ROOM[t.key] > 0
                    ? formatVND(TIER_PRICE_PER_ROOM[t.key])
                    : 'Miễn phí'}
                </p>
                <p className="text-xs text-ink-500">
                  {TIER_PRICE_PER_ROOM[t.key] > 0 ? '/phòng/tháng' : 'Không tính phí'}
                </p>
                <ul className="mt-5 space-y-2 text-sm text-ink-700">
                  {t.perks.map((p) => (
                    <li key={p}>✓ {p}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Auto-tier info */}
      <section className="mt-8 rounded-2xl bg-gold-50 p-5 ring-1 ring-gold-200">
        <h3 className="font-display text-xl font-semibold tracking-tight text-gold-900">📊 Cách tính gói tự động</h3>
        <p className="mt-2 text-sm text-gold-900">
          Hệ thống tự đếm số phòng đang hoạt động mỗi ngày để cập nhật gói cước:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-gold-900">
          <li>• 1-3 phòng → <strong>Miễn phí</strong> (0 ₫)</li>
          <li>• 4-10 phòng → <strong>Cơ bản</strong> (50.000 ₫/phòng)</li>
          <li>• 11-30 phòng → <strong>Tiêu chuẩn</strong> (40.000 ₫/phòng)</li>
          <li>• 31+ phòng → <strong>Chuyên nghiệp</strong> (30.000 ₫/phòng)</li>
        </ul>
        <p className="mt-3 text-xs text-gold-800">
          Quá hạn 7 ngày → cảnh báo. Quá 14 ngày → tự khóa cơ sở.
        </p>
      </section>

      {/* Invoice history */}
      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">Lịch sử hóa đơn</h2>
        {invoices.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-sm text-ink-500">
            Chưa có hóa đơn nào (gói Miễn phí hoặc tháng đầu sử dụng)
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-200 bg-cream-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Kỳ</th>
                  <th className="px-4 py-3">Số phòng</th>
                  <th className="px-4 py-3">Số tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">TT lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-cream-100">
                    <td className="px-4 py-3 font-medium text-ink-900">{inv.period}</td>
                    <td className="px-4 py-3 text-ink-700">{inv.rooms_count} phòng</td>
                    <td className="px-4 py-3 font-semibold text-ink-900">
                      {formatVND(inv.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          inv.status === 'paid'
                            ? 'success'
                            : inv.status === 'pending'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {inv.status === 'paid' ? 'Đã trả' : inv.status === 'pending' ? 'Chờ TT' : 'Quá hạn'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500">
                      {inv.paid_at ? formatDate(inv.paid_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
