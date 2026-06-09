import { Lock, Sparkles } from 'lucide-react';

export default function HousekeepingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50/50 via-white to-cream-50/30 p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-600">
          Vận hành · Buồng phòng
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-[1.05] tracking-tight text-navy-900 sm:text-5xl">
          Dọn phòng
        </h1>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="relative overflow-hidden rounded-3xl bg-white p-10 ring-1 ring-ink-200/60 shadow-sm text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy-50/40 via-transparent to-cream-50/40" />

          <div className="relative">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-white shadow-lg ring-1 ring-navy-700">
              <Lock className="h-9 w-9" />
            </div>

            <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
              Tính năng đang khóa
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500 sm:text-base">
              Module Housekeeping (buồng phòng) sẽ được mở ở giai đoạn sau.
              Hiện tại tính năng tạm khóa để tập trung hoàn thiện các module ưu tiên.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-50 px-4 py-2 text-xs font-semibold text-gold-700 ring-1 ring-gold-200">
              <Sparkles className="h-3.5 w-3.5" />
              Sắp ra mắt trong phase tiếp theo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
