'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Power, Trash2 } from 'lucide-react';

import {
  deletePropertyAction,
  updatePropertyAction,
} from '@/app/actions/properties';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/components/ui/toast';

interface Props {
  propertyId: string;
  propertyName: string;
  isActive: boolean;
}

type PendingConfirm = 'toggle' | 'delete' | null;

/**
 * Khu vực quản lý trạng thái cơ sở (host):
 * - Mở / đóng nhận phòng (PATCH isActive)
 * - Xoá cơ sở vĩnh viễn (DELETE /properties/:id)
 */
export function PropertyDangerZone({
  propertyId,
  propertyName,
  isActive,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<PendingConfirm>(null);

  function toggleActive() {
    start(async () => {
      const r = await updatePropertyAction(propertyId, {
        isActive: !isActive,
      });
      setConfirm(null);
      if (!r.ok) {
        toast.error('Thao tác thất bại: ' + r.error);
        return;
      }
      toast.success(
        isActive
          ? 'Đã đóng phòng — cơ sở tạm ngưng nhận đặt phòng'
          : 'Đã mở phòng — cơ sở sẵn sàng nhận đặt phòng',
      );
      router.refresh();
    });
  }

  function deleteProperty() {
    start(async () => {
      const r = await deletePropertyAction(propertyId);
      if (!r.ok) {
        setConfirm(null);
        toast.error('Không xoá được cơ sở: ' + r.error);
        return;
      }
      toast.success(`Đã xoá cơ sở "${propertyName}"`);
      router.push('/host/properties');
    });
  }

  return (
    <section className="mt-10 rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
      <h3 className="font-display text-lg font-semibold text-ink-900">
        Trạng thái & xoá cơ sở
      </h3>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ink-900">
            {isActive ? 'Đang mở nhận phòng' : 'Đang đóng phòng'}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            {isActive
              ? 'Khách có thể xem và đặt phòng tại cơ sở này.'
              : 'Cơ sở tạm ẩn, không nhận đặt phòng mới. Bấm mở lại bất cứ lúc nào.'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setConfirm('toggle')}
        >
          <Power className="mr-1.5 h-4 w-4" />
          {isActive ? 'Đóng phòng' : 'Mở phòng'}
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-ink-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-700">Xoá cơ sở</p>
          <p className="mt-0.5 text-xs text-ink-500">
            Xoá vĩnh viễn cơ sở cùng toàn bộ ảnh, giá và cấu hình. Không thể
            hoàn tác.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setConfirm('delete')}
          className="border-rose-200 text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Xoá cơ sở
        </Button>
      </div>

      <ConfirmDialog
        open={confirm === 'toggle'}
        title={isActive ? 'Đóng phòng?' : 'Mở phòng?'}
        description={
          isActive
            ? `Cơ sở "${propertyName}" sẽ tạm ngưng nhận đặt phòng mới. Các đơn hiện có không bị ảnh hưởng.`
            : `Cơ sở "${propertyName}" sẽ hiển thị trở lại và nhận đặt phòng.`
        }
        confirmLabel={isActive ? 'Đóng phòng' : 'Mở phòng'}
        variant="primary"
        pending={pending}
        onConfirm={toggleActive}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm === 'delete'}
        title="Xoá cơ sở vĩnh viễn?"
        description={`Cơ sở "${propertyName}" cùng toàn bộ dữ liệu liên quan sẽ bị xoá. Hành động này KHÔNG thể hoàn tác.`}
        confirmLabel="Xoá vĩnh viễn"
        pending={pending}
        onConfirm={deleteProperty}
        onCancel={() => setConfirm(null)}
      />
    </section>
  );
}
