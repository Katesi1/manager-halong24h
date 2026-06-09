'use client';

import { Building2, Calendar } from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RoleCode } from '@/core/value-objects/role';

interface Props {
  open: boolean;
  /** Tên user lấy từ Google profile để chào. */
  userName: string;
  userEmail: string;
  /** Disable cả 2 nút khi đang call lại BE với role. */
  pending?: boolean;
  onSelect: (role: RoleCode) => void;
  onCancel: () => void;
}

export function RoleSelectDialog({
  open,
  userName,
  userEmail,
  pending,
  onSelect,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !pending && onCancel()}>
      <DialogContent open={open}>
        <h3 className="font-display text-lg font-semibold text-ink-900">
          Chào {userName}!
        </h3>
        <p className="mt-1 text-sm text-ink-600">
          Email <strong>{userEmail}</strong> chưa có tài khoản. Chọn vai trò để
          tạo mới:
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect(RoleCode.OWNER)}
            disabled={pending}
            className="group flex flex-col items-start gap-2 rounded-xl border border-ink-200 bg-white p-4 text-left transition-all hover:border-navy-500 hover:bg-navy-50 disabled:opacity-50"
          >
            <Building2 className="h-6 w-6 text-navy-700 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-semibold text-ink-900">Chủ nhà (Owner)</p>
              <p className="mt-1 text-xs text-ink-500">
                Tôi có căn villa/homestay cho thuê tại Hạ Long
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelect(RoleCode.CUSTOMER)}
            disabled={pending}
            className="group flex flex-col items-start gap-2 rounded-xl border border-ink-200 bg-white p-4 text-left transition-all hover:border-gold-500 hover:bg-gold-50 disabled:opacity-50"
          >
            <Calendar className="h-6 w-6 text-gold-700 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-semibold text-ink-900">Khách (Customer)</p>
              <p className="mt-1 text-xs text-ink-500">
                Tôi muốn đặt phòng/villa để nghỉ dưỡng
              </p>
            </div>
          </button>
        </div>

        <p className="mt-4 text-[11px] text-ink-500">
          Lưu ý: Web admin chỉ dành cho Owner. Chọn Customer sẽ tạo tài khoản
          nhưng không thể truy cập trang quản lý.
        </p>

        {pending && (
          <p className="mt-3 text-center text-sm text-navy-700">
            Đang tạo tài khoản...
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
