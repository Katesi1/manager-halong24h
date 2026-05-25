import Link from 'next/link';

import { PageHeader } from '@/components/host/page-header';
import { SaveButton } from '@/components/host/save-button';
import { Label, Textarea } from '@/components/ui/input';

export default function AdminSettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Cài đặt hệ thống"
        description="Email templates · Điều khoản · Chính sách hủy mặc định."
      />

      <div className="space-y-6">
        {/* Email templates — link sang trang quản lý riêng */}
        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                Mẫu email gửi từ halong24h.com
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                4 mẫu HTML responsive — xem trước với dữ liệu mẫu, gửi test.
              </p>
            </div>
            <Link
              href="/admin/settings/emails"
              className="inline-flex h-10 items-center rounded-[10px] bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
            >
              📧 Mở trình quản lý mẫu →
            </Link>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            <li className="rounded-lg bg-cream-100 p-3 text-sm">
              <p className="font-semibold text-ink-900">Xác nhận đặt phòng</p>
              <p className="text-xs text-ink-500 mt-0.5">
                Gửi khách · kèm STK + VietQR + link chat
              </p>
            </li>
            <li className="rounded-lg bg-cream-100 p-3 text-sm">
              <p className="font-semibold text-ink-900">KYC được duyệt</p>
              <p className="text-xs text-ink-500 mt-0.5">Gửi chủ nhà</p>
            </li>
            <li className="rounded-lg bg-cream-100 p-3 text-sm">
              <p className="font-semibold text-ink-900">KYC bị từ chối</p>
              <p className="text-xs text-ink-500 mt-0.5">
                Gửi chủ nhà · kèm lý do
              </p>
            </li>
            <li className="rounded-lg bg-cream-100 p-3 text-sm">
              <p className="font-semibold text-ink-900">Gói cước quá hạn</p>
              <p className="text-xs text-ink-500 mt-0.5">Gửi chủ nhà</p>
            </li>
          </ul>
        </section>

        {/* Terms */}
        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Điều khoản + Chính sách
          </h2>
          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="terms">Điều khoản sử dụng</Label>
              <Textarea
                id="terms"
                rows={6}
                defaultValue="1. Chủ nhà cam kết cung cấp đúng thông tin phòng + giá.&#10;2. Khách thanh toán trực tiếp cho chủ nhà qua STK đã KYC.&#10;3. Mọi giao dịch phải qua chat của Halong24h — ngoài hệ thống, Halong24h không chịu trách nhiệm.&#10;4. Tranh chấp sẽ được giải quyết bởi đội Halong24h dựa trên chat + bill lưu trong hệ thống."
              />
            </div>
            <div>
              <Label htmlFor="cancel_default">Chính sách hủy mặc định</Label>
              <Textarea
                id="cancel_default"
                rows={3}
                defaultValue="Hủy miễn phí trong 48h sau khi đặt. Sau đó hoàn 50% nếu hủy trước 7 ngày. Không hoàn nếu hủy muộn hơn."
              />
            </div>
            <div>
              <Label htmlFor="responsibility">Tuyên bố trách nhiệm</Label>
              <Textarea
                id="responsibility"
                rows={3}
                defaultValue="Halong24h là nền tảng kết nối khách và chủ nhà. Hệ thống không giữ tiền giao dịch. Khách chuyển trực tiếp cho chủ nhà qua STK đã xác minh. Halong24h chỉ chịu trách nhiệm trung gian với các giao dịch thực hiện qua chat trong hệ thống."
              />
            </div>
          </div>
          <div className="mt-4">
            <SaveButton
              label="Lưu điều khoản"
              successMessage="✓ Đã lưu điều khoản"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

