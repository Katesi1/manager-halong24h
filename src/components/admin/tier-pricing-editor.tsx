'use client';

import { useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface TierRow {
  id: string;
  name: string;
  roomMin: number;
  roomMax: number | null;
  pricePerRoom: number;
}

const INITIAL_TIERS: TierRow[] = [
  { id: 'free', name: 'Miễn phí', roomMin: 1, roomMax: 3, pricePerRoom: 0 },
  { id: 'basic', name: 'Cơ bản', roomMin: 4, roomMax: 10, pricePerRoom: 50000 },
  { id: 'standard', name: 'Tiêu chuẩn', roomMin: 11, roomMax: 30, pricePerRoom: 40000 },
  { id: 'pro', name: 'Chuyên nghiệp', roomMin: 31, roomMax: null, pricePerRoom: 30000 },
];

export function TierPricingEditor() {
  const [tiers, setTiers] = useState<TierRow[]>(INITIAL_TIERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TierRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTier, setNewTier] = useState<TierRow>({
    id: '',
    name: '',
    roomMin: 0,
    roomMax: null,
    pricePerRoom: 0,
  });

  function startEdit(tier: TierRow) {
    setEditingId(tier.id);
    setDraft({ ...tier });
    setAdding(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit() {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error('Tên gói không được để trống');
      return;
    }
    setTiers((prev) => prev.map((t) => (t.id === draft.id ? draft : t)));
    setEditingId(null);
    setDraft(null);
    toast.success(`Đã cập nhật gói "${draft.name}".`);
  }

  function removeTier(id: string) {
    const tier = tiers.find((t) => t.id === id);
    if (!tier) return;
    if (!confirm(`Xoá gói "${tier.name}"?`)) return;
    setTiers((prev) => prev.filter((t) => t.id !== id));
    toast.success(`Đã xoá gói "${tier.name}".`);
  }

  function addTier() {
    if (!newTier.name.trim()) {
      toast.error('Tên gói không được để trống');
      return;
    }
    const id = newTier.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    setTiers((prev) => [...prev, { ...newTier, id }]);
    setNewTier({ id: '', name: '', roomMin: 0, roomMax: null, pricePerRoom: 0 });
    setAdding(false);
    toast.success(`Đã thêm gói "${newTier.name}".`);
  }

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Cấu hình giá gói cước
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Chỉ quản trị viên mới thấy phần này. Thêm, sửa hoặc xoá gói cước.
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => { setAdding(true); cancelEdit(); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm gói
          </button>
        )}
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[550px] text-sm">
          <thead className="border-b border-ink-200 text-left">
            <tr>
              <th className="pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">Tên gói</th>
              <th className="pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">Từ phòng</th>
              <th className="pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">Đến phòng</th>
              <th className="pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">Giá/phòng/tháng</th>
              <th className="pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {tiers.map((tier) => {
              const isEditing = editingId === tier.id && draft;
              return (
                <tr key={tier.id} className={cn(isEditing && 'bg-cream-50')}>
                  <td className="py-3 pr-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        className="w-full rounded-lg border border-ink-300 px-2 py-1.5 text-sm focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
                      />
                    ) : (
                      <span className="font-semibold text-ink-900">{tier.name}</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={draft.roomMin}
                        onChange={(e) => setDraft({ ...draft, roomMin: Number(e.target.value) })}
                        className="w-20 rounded-lg border border-ink-300 px-2 py-1.5 text-sm focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
                      />
                    ) : (
                      <span className="text-ink-700">{tier.roomMin}</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={draft.roomMax ?? ''}
                        placeholder="∞"
                        onChange={(e) => setDraft({ ...draft, roomMax: e.target.value ? Number(e.target.value) : null })}
                        className="w-20 rounded-lg border border-ink-300 px-2 py-1.5 text-sm focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
                      />
                    ) : (
                      <span className="text-ink-700">{tier.roomMax ?? '∞'}</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={draft.pricePerRoom}
                        step={5000}
                        onChange={(e) => setDraft({ ...draft, pricePerRoom: Number(e.target.value) })}
                        className="w-28 rounded-lg border border-ink-300 px-2 py-1.5 text-sm focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
                      />
                    ) : (
                      <span className="text-ink-700">
                        {tier.pricePerRoom === 0 ? 'Miễn phí' : `${tier.pricePerRoom.toLocaleString('vi-VN')} ₫`}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="grid h-8 w-8 place-items-center rounded-lg text-emerald-700 hover:bg-emerald-50"
                          title="Lưu"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-cream-100"
                          title="Huỷ"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(tier)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-cream-100 hover:text-navy-900"
                          title="Sửa"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTier(tier.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-rose-50 hover:text-rose-700"
                          title="Xoá"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Add new row */}
            {adding && (
              <tr className="bg-emerald-50/50">
                <td className="py-3 pr-3">
                  <input
                    type="text"
                    value={newTier.name}
                    onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                    placeholder="Tên gói mới"
                    className="w-full rounded-lg border border-ink-300 px-2 py-1.5 text-sm focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
                    autoFocus
                  />
                </td>
                <td className="py-3 pr-3">
                  <input
                    type="number"
                    value={newTier.roomMin}
                    onChange={(e) => setNewTier({ ...newTier, roomMin: Number(e.target.value) })}
                    className="w-20 rounded-lg border border-ink-300 px-2 py-1.5 text-sm focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
                  />
                </td>
                <td className="py-3 pr-3">
                  <input
                    type="number"
                    value={newTier.roomMax ?? ''}
                    placeholder="∞"
                    onChange={(e) => setNewTier({ ...newTier, roomMax: e.target.value ? Number(e.target.value) : null })}
                    className="w-20 rounded-lg border border-ink-300 px-2 py-1.5 text-sm focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
                  />
                </td>
                <td className="py-3 pr-3">
                  <input
                    type="number"
                    value={newTier.pricePerRoom}
                    step={5000}
                    onChange={(e) => setNewTier({ ...newTier, pricePerRoom: Number(e.target.value) })}
                    className="w-28 rounded-lg border border-ink-300 px-2 py-1.5 text-sm focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
                  />
                </td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={addTier}
                      className="grid h-8 w-8 place-items-center rounded-lg text-emerald-700 hover:bg-emerald-50"
                      title="Thêm"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdding(false)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-cream-100"
                      title="Huỷ"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
