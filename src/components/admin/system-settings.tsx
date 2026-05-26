'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  Clock,
  FileText,
  Globe,
  Mail,
  Save,
  Shield,
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface OptionChip {
  label: string;
  value: string;
}

const CANCEL_POLICIES: OptionChip[] = [
  { label: 'Linh hoạt', value: 'Hủy miễn phí trong 24h trước check-in. Sau đó không hoàn tiền.' },
  { label: 'Trung bình', value: 'Hủy miễn phí trong 48h sau khi đặt. Hoàn 50% nếu hủy trước 7 ngày. Không hoàn nếu hủy muộn hơn.' },
  { label: 'Nghiêm ngặt', value: 'Hủy miễn phí trong 24h sau khi đặt. Sau đó hoàn 50% nếu hủy trước 14 ngày. Không hoàn nếu hủy muộn hơn.' },
  { label: 'Không hoàn tiền', value: 'Không hoàn tiền sau khi đặt phòng được xác nhận. Chỉ hoàn trong trường hợp bất khả kháng (thiên tai, dịch bệnh).' },
];

const CHECKIN_TIMES: OptionChip[] = [
  { label: '13:00', value: '13:00' },
  { label: '14:00', value: '14:00' },
  { label: '15:00', value: '15:00' },
];

const CHECKOUT_TIMES: OptionChip[] = [
  { label: '11:00', value: '11:00' },
  { label: '12:00', value: '12:00' },
  { label: '13:00', value: '13:00' },
];

const CURRENCIES: OptionChip[] = [
  { label: 'VND (₫)', value: 'VND' },
  { label: 'USD ($)', value: 'USD' },
];

const LANGUAGES: OptionChip[] = [
  { label: 'Tiếng Việt', value: 'vi' },
  { label: 'English', value: 'en' },
];

const MAINTENANCE_MODES: OptionChip[] = [
  { label: 'Hoạt động bình thường', value: 'off' },
  { label: 'Bảo trì (chặn đặt phòng mới)', value: 'booking_only' },
  { label: 'Bảo trì toàn bộ', value: 'full' },
];

const TERMS_TEMPLATES: OptionChip[] = [
  {
    label: 'Mặc định Halong24h',
    value: '1. Chủ nhà cam kết cung cấp đúng thông tin phòng + giá.\n2. Khách thanh toán trực tiếp cho chủ nhà qua STK đã KYC.\n3. Mọi giao dịch phải qua chat của Halong24h — ngoài hệ thống không chịu trách nhiệm.\n4. Tranh chấp được giải quyết bởi đội Halong24h dựa trên chat + bill lưu trong hệ thống.',
  },
  {
    label: 'Đơn giản',
    value: '1. Khách chuyển khoản trực tiếp cho chủ nhà qua STK đã xác minh.\n2. Halong24h là nền tảng kết nối, không giữ tiền.\n3. Mọi trao đổi phải thực hiện qua hệ thống.',
  },
];

const RESPONSIBILITY_TEMPLATES: OptionChip[] = [
  {
    label: 'Đầy đủ',
    value: 'Halong24h là nền tảng kết nối khách và chủ nhà. Hệ thống không giữ tiền giao dịch. Khách chuyển trực tiếp cho chủ nhà qua STK đã xác minh. Halong24h chỉ chịu trách nhiệm trung gian với các giao dịch thực hiện qua chat trong hệ thống.',
  },
  {
    label: 'Ngắn gọn',
    value: 'Halong24h kết nối khách với chủ nhà. Thanh toán trực tiếp qua STK đã KYC. Tranh chấp chỉ xử lý khi giao dịch qua hệ thống.',
  },
];

interface SettingsState {
  cancelPolicy: string;
  checkinTime: string;
  checkoutTime: string;
  currency: string;
  language: string;
  maintenanceMode: string;
  terms: string;
  responsibility: string;
  maintenanceMessage: string;
}

const INITIAL: SettingsState = {
  cancelPolicy: CANCEL_POLICIES[1].value,
  checkinTime: '14:00',
  checkoutTime: '12:00',
  currency: 'VND',
  language: 'vi',
  maintenanceMode: 'off',
  terms: TERMS_TEMPLATES[0].value,
  responsibility: RESPONSIBILITY_TEMPLATES[0].value,
  maintenanceMessage: '',
};

export function SystemSettings() {
  const [state, setState] = useState<SettingsState>(INITIAL);
  const [saved, setSaved] = useState<SettingsState>(INITIAL);
  const [saving, setSaving] = useState(false);

  const hasChanges = JSON.stringify(state) !== JSON.stringify(saved);

  function set<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaved({ ...state });
      setSaving(false);
      toast.success('Đã lưu cài đặt hệ thống.');
    }, 600);
  }

  function handleReset() {
    setState({ ...saved });
  }

  return (
    <div className="space-y-6">
      {/* Save bar */}
      {hasChanges && (
        <div className="sticky top-14 z-10 flex items-center gap-3 rounded-xl bg-navy-900 px-5 py-3 text-white shadow-lg">
          <p className="flex-1 text-sm font-medium">Bạn có thay đổi chưa lưu</p>
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-white hover:bg-white/10">
            Hoàn tác
          </Button>
          <Button variant="gold" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      )}

      {/* General */}
      <SettingsCard icon={Globe} title="Cài đặt chung" description="Ngôn ngữ, tiền tệ, giờ check-in/out mặc định.">
        <div className="grid gap-5 sm:grid-cols-2">
          <ChipSelect
            label="Ngôn ngữ mặc định"
            options={LANGUAGES}
            value={state.language}
            onChange={(v) => set('language', v)}
          />
          <ChipSelect
            label="Đơn vị tiền tệ"
            options={CURRENCIES}
            value={state.currency}
            onChange={(v) => set('currency', v)}
          />
          <ChipSelect
            label="Giờ check-in mặc định"
            options={CHECKIN_TIMES}
            value={state.checkinTime}
            onChange={(v) => set('checkinTime', v)}
          />
          <ChipSelect
            label="Giờ check-out mặc định"
            options={CHECKOUT_TIMES}
            value={state.checkoutTime}
            onChange={(v) => set('checkoutTime', v)}
          />
        </div>
      </SettingsCard>

      {/* Cancellation policy */}
      <SettingsCard icon={Shield} title="Chính sách huỷ phòng" description="Chính sách mặc định áp dụng cho tất cả cơ sở. Chủ nhà có thể ghi đè riêng.">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {CANCEL_POLICIES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => set('cancelPolicy', p.value)}
                className={cn(
                  'rounded-lg px-4 py-2.5 text-sm font-medium transition-all ring-1',
                  state.cancelPolicy === p.value
                    ? 'bg-navy-900 text-white ring-navy-900 shadow-sm'
                    : 'bg-white text-ink-700 ring-ink-200 hover:bg-cream-100 hover:ring-ink-300',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="rounded-lg bg-cream-50 px-4 py-3 text-sm text-ink-700 ring-1 ring-ink-100">
            {state.cancelPolicy}
          </div>
        </div>
      </SettingsCard>

      {/* Terms */}
      <SettingsCard icon={FileText} title="Điều khoản sử dụng" description="Điều khoản hiển thị cho người dùng khi đăng ký và đặt phòng.">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {TERMS_TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => set('terms', t.value)}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-all ring-1',
                  state.terms === t.value
                    ? 'bg-navy-900 text-white ring-navy-900 shadow-sm'
                    : 'bg-white text-ink-700 ring-ink-200 hover:bg-cream-100 hover:ring-ink-300',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Textarea
            rows={5}
            value={state.terms}
            onChange={(e) => set('terms', e.target.value)}
          />
        </div>
      </SettingsCard>

      {/* Responsibility */}
      <SettingsCard icon={Shield} title="Tuyên bố trách nhiệm" description="Tuyên bố hiển thị ở footer, trang điều khoản.">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {RESPONSIBILITY_TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => set('responsibility', t.value)}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-all ring-1',
                  state.responsibility === t.value
                    ? 'bg-navy-900 text-white ring-navy-900 shadow-sm'
                    : 'bg-white text-ink-700 ring-ink-200 hover:bg-cream-100 hover:ring-ink-300',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Textarea
            rows={4}
            value={state.responsibility}
            onChange={(e) => set('responsibility', e.target.value)}
          />
        </div>
      </SettingsCard>

      {/* Email templates */}
      <SettingsCard icon={Mail} title="Mẫu email" description="4 mẫu email HTML responsive gửi từ halong24h.com.">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { name: 'Xác nhận đặt phòng', desc: 'Gửi khách · kèm STK + VietQR + link chat' },
            { name: 'KYC được duyệt', desc: 'Gửi chủ nhà khi hồ sơ được phê duyệt' },
            { name: 'KYC bị từ chối', desc: 'Gửi chủ nhà · kèm lý do từ chối' },
            { name: 'Gói cước quá hạn', desc: 'Gửi chủ nhà khi subscription hết hạn' },
          ].map((t) => (
            <div
              key={t.name}
              className="flex items-start gap-3 rounded-xl bg-cream-50 p-4 ring-1 ring-ink-100"
            >
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                <p className="mt-0.5 text-xs text-ink-500">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/admin/settings/emails"
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-cream-200 px-4 text-sm font-semibold text-navy-900 transition-colors hover:bg-cream-300"
        >
          Mở trình quản lý mẫu email →
        </Link>
      </SettingsCard>

      {/* Maintenance */}
      <SettingsCard icon={Wrench} title="Chế độ bảo trì" description="Tạm ngừng hệ thống khi cần cập nhật hoặc sửa lỗi.">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {MAINTENANCE_MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => set('maintenanceMode', m.value)}
                className={cn(
                  'rounded-lg px-4 py-2.5 text-sm font-medium transition-all ring-1',
                  state.maintenanceMode === m.value
                    ? m.value === 'off'
                      ? 'bg-emerald-600 text-white ring-emerald-600 shadow-sm'
                      : 'bg-rose-600 text-white ring-rose-600 shadow-sm'
                    : 'bg-white text-ink-700 ring-ink-200 hover:bg-cream-100 hover:ring-ink-300',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          {state.maintenanceMode !== 'off' && (
            <div className="rounded-lg bg-rose-50 p-4 ring-1 ring-rose-200">
              <p className="text-xs font-semibold text-rose-800">
                {state.maintenanceMode === 'full'
                  ? 'Toàn bộ hệ thống sẽ hiển thị trang bảo trì.'
                  : 'Người dùng vẫn xem được nhưng không tạo đặt phòng mới.'}
              </p>
              <Textarea
                rows={2}
                value={state.maintenanceMessage}
                onChange={(e) => set('maintenanceMessage', e.target.value)}
                placeholder="Thông báo cho người dùng (VD: Hệ thống bảo trì từ 22:00–06:00 ngày 28/05)"
                className="mt-3"
              />
            </div>
          )}
        </div>
      </SettingsCard>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Globe;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card overflow-hidden">
      <div className="border-b border-ink-100 px-6 py-4">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-navy-900">
          <Icon className="h-5 w-5 text-ink-400" />
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-ink-500">{description}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function ChipSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: OptionChip[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-lg px-3.5 py-2 text-sm font-medium transition-all ring-1',
              value === o.value
                ? 'bg-navy-900 text-white ring-navy-900 shadow-sm'
                : 'bg-white text-ink-700 ring-ink-200 hover:bg-cream-100 hover:ring-ink-300',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
