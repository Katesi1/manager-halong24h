'use client';

import { useState } from 'react';
import { Save, Shield, ShieldCheck, UserCog, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type Role = 'OWNER' | 'SALE' | 'CUSTOMER';

const ROLES: { key: Role; label: string; hint: string; icon: typeof Shield }[] = [
  { key: 'OWNER', label: 'Chủ nhà', hint: 'Chủ cơ sở lưu trú', icon: ShieldCheck },
  { key: 'SALE', label: 'Nhân viên', hint: 'Nhân viên của chủ nhà', icon: UserCog },
  { key: 'CUSTOMER', label: 'Khách hàng', hint: 'Người đặt phòng', icon: Users },
];

interface Permission {
  key: string;
  label: string;
  description: string;
}

interface PermissionGroup {
  id: string;
  label: string;
  permissions: Permission[];
}

const GROUPS: PermissionGroup[] = [
  {
    id: 'property',
    label: 'Quản lý cơ sở',
    permissions: [
      { key: 'property.view', label: 'Xem danh sách cơ sở', description: 'Xem danh sách cơ sở thuộc quyền quản lý' },
      { key: 'property.create', label: 'Tạo cơ sở mới', description: 'Thêm cơ sở lưu trú mới vào hệ thống' },
      { key: 'property.edit', label: 'Sửa thông tin cơ sở', description: 'Chỉnh sửa tên, mô tả, ảnh, tiện ích' },
      { key: 'property.delete', label: 'Xoá cơ sở', description: 'Xoá cơ sở khỏi hệ thống' },
      { key: 'property.pricing', label: 'Quản lý giá phòng', description: 'Đặt giá cơ bản, giá cuối tuần, giá theo mùa' },
    ],
  },
  {
    id: 'booking',
    label: 'Đặt phòng',
    permissions: [
      { key: 'booking.view', label: 'Xem đặt phòng', description: 'Xem danh sách và chi tiết đặt phòng' },
      { key: 'booking.create', label: 'Tạo đặt phòng', description: 'Tạo đặt phòng mới cho khách' },
      { key: 'booking.cancel', label: 'Huỷ đặt phòng', description: 'Huỷ đặt phòng đang chờ hoặc đã xác nhận' },
      { key: 'booking.checkin', label: 'Check-in / Check-out', description: 'Ghi nhận check-in và check-out khách' },
    ],
  },
  {
    id: 'calendar',
    label: 'Lịch & vận hành',
    permissions: [
      { key: 'calendar.view', label: 'Xem lịch phòng', description: 'Xem trạng thái phòng theo ngày' },
      { key: 'calendar.block', label: 'Chặn / mở phòng', description: 'Đánh dấu phòng không khả dụng' },
      { key: 'hk.manage', label: 'Quản lý dọn phòng', description: 'Giao việc dọn phòng cho nhân viên' },
    ],
  },
  {
    id: 'staff',
    label: 'Nhân sự',
    permissions: [
      { key: 'staff.view', label: 'Xem danh sách nhân viên', description: 'Xem nhân viên thuộc cơ sở' },
      { key: 'staff.invite', label: 'Mời nhân viên mới', description: 'Gửi lời mời tham gia hệ thống' },
      { key: 'staff.remove', label: 'Gỡ nhân viên', description: 'Xoá nhân viên khỏi cơ sở' },
    ],
  },
  {
    id: 'finance',
    label: 'Tài chính',
    permissions: [
      { key: 'billing.view', label: 'Xem gói cước', description: 'Xem thông tin subscription hiện tại' },
      { key: 'billing.manage', label: 'Quản lý gói cước', description: 'Nâng/hạ gói, thanh toán' },
      { key: 'report.view', label: 'Xem báo cáo doanh thu', description: 'Xem thống kê doanh thu cơ sở' },
    ],
  },
  {
    id: 'customer',
    label: 'Khách hàng',
    permissions: [
      { key: 'customer.book', label: 'Đặt phòng', description: 'Tìm kiếm và đặt phòng trên hệ thống' },
      { key: 'customer.review', label: 'Đánh giá cơ sở', description: 'Gửi review sau khi check-out' },
      { key: 'customer.dispute', label: 'Mở khiếu nại', description: 'Gửi khiếu nại về trải nghiệm' },
    ],
  },
];

type PermissionMap = Record<string, Record<Role, boolean>>;

function buildInitialMap(): PermissionMap {
  const defaults: Record<string, Role[]> = {
    'property.view': ['OWNER', 'SALE'],
    'property.create': ['OWNER'],
    'property.edit': ['OWNER', 'SALE'],
    'property.delete': ['OWNER'],
    'property.pricing': ['OWNER', 'SALE'],
    'booking.view': ['OWNER', 'SALE'],
    'booking.create': ['OWNER', 'SALE'],
    'booking.cancel': ['OWNER', 'SALE'],
    'booking.checkin': ['OWNER', 'SALE'],
    'calendar.view': ['OWNER', 'SALE'],
    'calendar.block': ['OWNER', 'SALE'],
    'hk.manage': ['OWNER', 'SALE'],
    'staff.view': ['OWNER'],
    'staff.invite': ['OWNER'],
    'staff.remove': ['OWNER'],
    'billing.view': ['OWNER'],
    'billing.manage': ['OWNER'],
    'report.view': ['OWNER', 'SALE'],
    'customer.book': ['CUSTOMER'],
    'customer.review': ['CUSTOMER'],
    'customer.dispute': ['CUSTOMER'],
  };

  const map: PermissionMap = {};
  for (const group of GROUPS) {
    for (const perm of group.permissions) {
      const allowed = defaults[perm.key] ?? [];
      map[perm.key] = {
        OWNER: allowed.includes('OWNER'),
        SALE: allowed.includes('SALE'),
        CUSTOMER: allowed.includes('CUSTOMER'),
      };
    }
  }
  return map;
}

export function PermissionMatrix() {
  const [permissions, setPermissions] = useState<PermissionMap>(buildInitialMap);
  const [saved, setSaved] = useState<PermissionMap>(buildInitialMap);
  const [saving, setSaving] = useState(false);

  const hasChanges = JSON.stringify(permissions) !== JSON.stringify(saved);

  function toggle(permKey: string, role: Role) {
    setPermissions((prev) => ({
      ...prev,
      [permKey]: {
        ...prev[permKey],
        [role]: !prev[permKey][role],
      },
    }));
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaved({ ...permissions });
      setSaving(false);
      toast.success('Đã lưu cấu hình phân quyền.');
    }, 600);
  }

  function handleReset() {
    setPermissions({ ...saved });
  }

  return (
    <div className="space-y-6">
      {/* Role cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.key}
              className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-200">
                  <Icon className="h-5 w-5 text-navy-700" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900">{r.label}</p>
                  <p className="text-xs text-ink-500">{r.hint}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-400">
                {Object.values(permissions).filter((p) => p[r.key]).length} quyền được bật
              </p>
            </div>
          );
        })}
      </div>

      {/* Save bar */}
      {hasChanges && (
        <div className="sticky top-14 z-10 flex items-center gap-3 rounded-xl bg-navy-900 px-5 py-3 text-white shadow-lg">
          <p className="flex-1 text-sm font-medium">
            Bạn có thay đổi chưa lưu
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-white hover:bg-white/10"
          >
            Hoàn tác
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      )}

      {/* Permission groups */}
      {GROUPS.map((group) => (
        <section
          key={group.id}
          className="rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card overflow-hidden"
        >
          <div className="border-b border-ink-100 bg-cream-50 px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-navy-900">
              {group.label}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Quyền
                  </th>
                  {ROLES.map((r) => (
                    <th
                      key={r.key}
                      className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-500 w-28"
                    >
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {group.permissions.map((perm) => {
                  const permState = permissions[perm.key];
                  return (
                    <tr key={perm.key} className="hover:bg-cream-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-medium text-ink-900">{perm.label}</p>
                        <p className="mt-0.5 text-xs text-ink-400">{perm.description}</p>
                      </td>
                      {ROLES.map((r) => {
                        const enabled = permState?.[r.key] ?? false;
                        const changed = enabled !== (saved[perm.key]?.[r.key] ?? false);
                        return (
                          <td key={r.key} className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={enabled}
                              aria-label={`${perm.label} cho ${r.label}`}
                              onClick={() => toggle(perm.key, r.key)}
                              className={cn(
                                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
                                enabled ? 'bg-emerald-500' : 'bg-ink-200',
                                changed && 'ring-2 ring-gold-400 ring-offset-1',
                              )}
                            >
                              <span
                                className={cn(
                                  'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                                  enabled ? 'translate-x-[22px]' : 'translate-x-1',
                                )}
                              />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="rounded-xl bg-cream-100 px-5 py-4 text-sm text-ink-600">
        <p className="font-semibold text-ink-800">Lưu ý:</p>
        <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
          <li>Admin (Super Admin) luôn có toàn quyền, không hiển thị trong bảng này.</li>
          <li>Thay đổi quyền có hiệu lực ngay lập tức cho tất cả người dùng thuộc vai trò đó.</li>
          <li>Toggle có viền vàng = thay đổi chưa được lưu.</li>
        </ul>
      </div>
    </div>
  );
}
