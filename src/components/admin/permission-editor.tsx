'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { updatePermissionsAction } from '@/app/actions/permissions';
import { Button } from '@/components/ui/button';
import {
  PERMISSION_MODULES,
  PERMISSION_MODULE_LABEL,
  type PermissionModule,
  type PermissionRow,
} from '@/core/entities/permission';

interface Props {
  userId: string;
  userLabel: string;
  initial: PermissionRow[];
  /**
   * Danh sách module hiển thị — 4 owner-scope (mặc định) hoặc 18 module cho
   * Sale hệ thống (spec §26.5). Truyền từ page theo `matrix.scope`.
   */
  modules?: PermissionModule[];
  /** Mô tả ngắn dưới tên user (thay câu mặc định 4-module). */
  hint?: string;
}

const CRUD_KEYS = ['canCreate', 'canRead', 'canUpdate', 'canDelete'] as const;
const CRUD_LABEL: Record<(typeof CRUD_KEYS)[number], string> = {
  canCreate: 'Tạo',
  canRead: 'Xem',
  canUpdate: 'Sửa',
  canDelete: 'Xoá',
};

function normalizeRows(
  initial: PermissionRow[],
  modules: PermissionModule[],
): PermissionRow[] {
  const byModule = new Map<PermissionModule, PermissionRow>(
    initial.map((r) => [r.module, r]),
  );
  return modules.map(
    (m) =>
      byModule.get(m) ?? {
        module: m,
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
      },
  );
}

function equal(a: PermissionRow[], b: PermissionRow[]): boolean {
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    if (
      x.module !== y.module ||
      x.canCreate !== y.canCreate ||
      x.canRead !== y.canRead ||
      x.canUpdate !== y.canUpdate ||
      x.canDelete !== y.canDelete
    ) {
      return false;
    }
  }
  return true;
}

export function PermissionEditor({
  userId,
  userLabel,
  initial,
  modules = PERMISSION_MODULES,
  hint,
}: Props) {
  const [rows, setRows] = useState<PermissionRow[]>(() =>
    normalizeRows(initial, modules),
  );
  const [saved, setSaved] = useState<PermissionRow[]>(() =>
    normalizeRows(initial, modules),
  );
  const [pending, startTransition] = useTransition();

  const dirty = !equal(rows, saved);

  function toggle(
    moduleKey: PermissionModule,
    field: (typeof CRUD_KEYS)[number],
  ) {
    setRows((prev) =>
      prev.map((r) =>
        r.module === moduleKey ? { ...r, [field]: !r[field] } : r,
      ),
    );
  }

  function toggleRow(moduleKey: PermissionModule, value: boolean) {
    setRows((prev) =>
      prev.map((r) =>
        r.module === moduleKey
          ? {
              ...r,
              canCreate: value,
              canRead: value,
              canUpdate: value,
              canDelete: value,
            }
          : r,
      ),
    );
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updatePermissionsAction({
        userId,
        permissions: rows,
      });
      if (res.ok) {
        setSaved(rows);
        toast.success('Đã lưu phân quyền');
      } else {
        toast.error(res.error ?? 'Không thể lưu phân quyền');
      }
    });
  }

  function handleReset() {
    setRows(saved);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
        <p className="overline muted no-dash text-[10px]">
          Phân quyền cho nhân viên
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-navy-900">
          {userLabel}
        </h2>
        <p className="mt-1 text-xs text-ink-500">
          {hint ??
            'Chỉ áp dụng cho vai trò SALE — 4 module × 4 thao tác (thêm, xem, sửa, xoá).'}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-ink-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Module</th>
              {CRUD_KEYS.map((k) => (
                <th
                  key={k}
                  className="px-3 py-3 text-center font-medium w-20"
                >
                  {CRUD_LABEL[k]}
                </th>
              ))}
              <th className="px-3 py-3 text-center font-medium w-24">
                Tất cả
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const allOn =
                row.canCreate && row.canRead && row.canUpdate && row.canDelete;
              return (
                <tr
                  key={row.module}
                  className="border-t border-ink-100 hover:bg-cream-50"
                >
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {PERMISSION_MODULE_LABEL[row.module]}
                  </td>
                  {CRUD_KEYS.map((k) => (
                    <td key={k} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={row[k]}
                        onChange={() => toggle(row.module, k)}
                        disabled={pending}
                        className="h-4 w-4 cursor-pointer rounded border-ink-300 text-navy-700 focus:ring-navy-500"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleRow(row.module, !allOn)}
                      disabled={pending}
                      className="text-xs font-medium text-navy-700 hover:underline disabled:opacity-50"
                    >
                      {allOn ? 'Tắt hết' : 'Bật hết'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dirty && (
        <div className="sticky bottom-4 flex items-center gap-3 rounded-xl bg-navy-900 px-5 py-3 text-white shadow-lg">
          <p className="flex-1 text-sm font-medium">
            Bạn có thay đổi chưa lưu
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={pending}
            className="text-white hover:bg-white/10"
          >
            Hoàn tác
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={handleSave}
            disabled={pending}
          >
            {pending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      )}
    </div>
  );
}
