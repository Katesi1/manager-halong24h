'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';

import {
  createBillingPlanAction,
  deleteBillingPlanAction,
  updateBillingPlanAction,
} from '@/app/actions/billing-plans';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/components/ui/toast';
import {
  planLabel,
  POPULAR_PLAN_ID,
  type BillingPlan,
} from '@/core/entities/billing-plan';
import { formatVND } from '@/core/value-objects/vnd';

interface Draft {
  id: string;
  rooms: number;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string;
  active: boolean;
}

function planToDraft(plan: BillingPlan): Draft {
  return {
    id: plan.id,
    rooms: plan.rooms,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    features: plan.features.join('\n'),
    active: plan.active ?? true,
  };
}

function emptyDraft(): Draft {
  return {
    id: '',
    rooms: 1,
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: '',
    active: true,
  };
}

function parseFeatures(input: string): string[] {
  return input
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

interface Props {
  initialPlans: BillingPlan[];
}

export function BillingPlanEditor({ initialPlans }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [adding, setAdding] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft());
  const [confirmDelete, setConfirmDelete] = useState<BillingPlan | null>(null);

  function startEdit(plan: BillingPlan) {
    setEditingId(plan.id);
    setDraft(planToDraft(plan));
    setAdding(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function handleSave() {
    if (!draft || !editingId) return;
    startTransition(async () => {
      const res = await updateBillingPlanAction(editingId, {
        rooms: draft.rooms,
        monthlyPrice: draft.monthlyPrice,
        yearlyPrice: draft.yearlyPrice,
        features: parseFeatures(draft.features),
        active: draft.active,
      });
      if (res.ok) {
        toast.success(`Đã cập nhật gói "${planLabel(editingId)}"`);
        cancelEdit();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleCreate() {
    startTransition(async () => {
      const res = await createBillingPlanAction({
        id: newDraft.id.trim().toLowerCase(),
        rooms: newDraft.rooms,
        monthlyPrice: newDraft.monthlyPrice,
        yearlyPrice: newDraft.yearlyPrice,
        features: parseFeatures(newDraft.features),
        active: newDraft.active,
      });
      if (res.ok) {
        toast.success(`Đã tạo gói "${res.data.id}"`);
        setNewDraft(emptyDraft());
        setAdding(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    if (!confirmDelete) return;
    const target = confirmDelete;
    startTransition(async () => {
      const res = await deleteBillingPlanAction(target.id);
      setConfirmDelete(null);
      if (res.ok) {
        toast.success(
          res.data.mode === 'soft'
            ? `Gói "${target.id}" đang có người dùng nên đã được ẩn thay vì xoá`
            : `Đã xoá gói "${target.id}"`,
        );
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <section className="mt-8 rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy-900">
            Danh mục gói cước
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Thêm, sửa, xoá gói cước. Bao gồm cả gói đang tạm ẩn (không hiển thị
            cho chủ nhà).
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              cancelEdit();
              setNewDraft(emptyDraft());
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
          >
            <Plus className="h-4 w-4" />
            Thêm gói
          </button>
        )}
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="border-b border-ink-200 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Phòng</th>
              <th className="px-5 py-3">Giá tháng</th>
              <th className="px-5 py-3">Giá năm</th>
              <th className="px-5 py-3">Tính năng</th>
              <th className="px-5 py-3">Trạng thái</th>
              <th className="px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {initialPlans.map((plan) => {
              const isEditing = editingId === plan.id && draft;
              const isActive = plan.active ?? true;

              if (isEditing) {
                return (
                  <DraftRow
                    key={plan.id}
                    draft={draft}
                    setDraft={(d) => setDraft(d)}
                    idLocked
                    pending={pending}
                    onSave={handleSave}
                    onCancel={cancelEdit}
                  />
                );
              }

              return (
                <tr
                  key={plan.id}
                  className={
                    'transition-colors hover:bg-cream-50 ' +
                    (!isActive ? 'opacity-60' : '')
                  }
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs text-ink-700">
                        {plan.id}
                      </code>
                      {plan.id === POPULAR_PLAN_ID && (
                        <span className="rounded-full bg-gold-100 px-1.5 py-0.5 text-[10px] font-semibold text-gold-800">
                          Phổ biến
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-500">
                      {planLabel(plan.id)}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-ink-700">
                    {plan.rooms == null ? '—' : plan.rooms === -1 ? '∞' : plan.rooms}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-navy-900">
                    {plan.monthlyPrice === 0 ? '—' : formatVND(plan.monthlyPrice)}
                  </td>
                  <td className="px-5 py-3.5 text-ink-700">
                    {plan.yearlyPrice === 0 ? '—' : formatVND(plan.yearlyPrice)}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-ink-600">
                    {plan.features?.length
                      ? `${plan.features.length} tính năng`
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <Eye className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600 ring-1 ring-ink-200">
                        <EyeOff className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(plan)}
                        disabled={pending}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-cream-100 hover:text-navy-900 disabled:opacity-50"
                        title="Sửa"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(plan)}
                        disabled={pending}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                        title="Xoá"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {adding && (
              <DraftRow
                draft={newDraft}
                setDraft={setNewDraft}
                idLocked={false}
                pending={pending}
                onSave={handleCreate}
                onCancel={() => setAdding(false)}
              />
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        onCancel={() => setConfirmDelete(null)}
        title={`Xoá gói "${confirmDelete?.id ?? ''}"?`}
        description={
          'Nếu chưa có chủ nhà nào đang dùng, gói sẽ bị xoá hẳn. Nếu đang có người dùng, gói sẽ được ẩn khỏi trang đăng ký nhưng chủ nhà đang dùng vẫn giữ nguyên.'
        }
        confirmLabel="Xoá gói"
        cancelLabel="Huỷ"
        variant="danger"
        pending={pending}
        onConfirm={handleDelete}
      />
    </section>
  );
}

interface DraftRowProps {
  draft: Draft;
  setDraft: (draft: Draft) => void;
  idLocked: boolean;
  pending: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function DraftRow({
  draft,
  setDraft,
  idLocked,
  pending,
  onSave,
  onCancel,
}: DraftRowProps) {
  return (
    <tr className="bg-emerald-50/40">
      <td className="px-5 py-3 align-top">
        <input
          type="text"
          value={draft.id}
          disabled={idLocked || pending}
          placeholder="rooms_5"
          onChange={(e) => setDraft({ ...draft, id: e.target.value })}
          className="w-32 rounded-lg border border-ink-300 px-2 py-1.5 font-mono text-xs focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 disabled:bg-ink-50 disabled:text-ink-500"
        />
        <label className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-600">
          <input
            type="checkbox"
            checked={draft.active}
            disabled={pending}
            onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
            className="h-3.5 w-3.5"
          />
          Active
        </label>
      </td>
      <td className="px-5 py-3 align-top">
        <input
          type="number"
          value={draft.rooms}
          min={-1}
          disabled={pending}
          onChange={(e) =>
            setDraft({ ...draft, rooms: Number(e.target.value) })
          }
          className="w-20 rounded-lg border border-ink-300 px-2 py-1.5 text-sm focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
        />
        <p className="mt-1 text-[10px] text-ink-400">-1 = ∞</p>
      </td>
      <td className="px-5 py-3 align-top">
        <input
          type="number"
          value={draft.monthlyPrice}
          step={50000}
          min={0}
          disabled={pending}
          onChange={(e) =>
            setDraft({ ...draft, monthlyPrice: Number(e.target.value) })
          }
          className="w-32 rounded-lg border border-ink-300 px-2 py-1.5 text-sm focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
        />
      </td>
      <td className="px-5 py-3 align-top">
        <input
          type="number"
          value={draft.yearlyPrice}
          step={500000}
          min={0}
          disabled={pending}
          onChange={(e) =>
            setDraft({ ...draft, yearlyPrice: Number(e.target.value) })
          }
          className="w-36 rounded-lg border border-ink-300 px-2 py-1.5 text-sm focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
        />
      </td>
      <td className="px-5 py-3 align-top" colSpan={2}>
        <textarea
          value={draft.features}
          disabled={pending}
          placeholder="Mỗi dòng một tính năng"
          rows={4}
          onChange={(e) => setDraft({ ...draft, features: e.target.value })}
          className="w-full min-w-[260px] rounded-lg border border-ink-300 px-2 py-1.5 text-xs focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
        />
      </td>
      <td className="px-5 py-3 text-right align-top">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="grid h-8 w-8 place-items-center rounded-lg text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
            title="Lưu"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-cream-100 disabled:opacity-50"
            title="Huỷ"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function AdminWriteHint() {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <div>
        <strong>Cảnh báo:</strong> Mọi thay đổi áp dụng ngay cho chủ nhà đăng ký
        mới. Sửa giá KHÔNG ảnh hưởng gói đang chạy — chỉ áp dụng từ kỳ gia hạn kế
        tiếp. Xoá gói đang có người dùng sẽ tự động chuyển sang ẩn.
      </div>
    </div>
  );
}

