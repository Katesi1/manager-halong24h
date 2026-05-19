'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker, type DateRange } from 'react-day-picker';
import { vi } from 'date-fns/locale';
import { format, differenceInCalendarDays } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface Props {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  /** Children render the trigger (input-like). Click to open popover. */
  trigger: (props: { isOpen: boolean; onClick: () => void }) => React.ReactNode;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function DateRangePicker({ checkIn, checkOut, onChange, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => setMounted(true), []);

  // Reposition popup khi mở (fixed positioning, neo theo trigger)
  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    function update() {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, left: r.left + r.width / 2 });
    }
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  // Close on outside click (xét cả popup vì nó render qua portal)
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (popupRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const propsRange: DateRange | undefined =
    checkIn && checkOut
      ? { from: new Date(checkIn), to: new Date(checkOut) }
      : checkIn
        ? { from: new Date(checkIn), to: undefined }
        : undefined;

  /** Range nội bộ trong lúc user đang chọn — chưa commit về parent
   *  cho đến khi đủ cả check-in lẫn check-out. */
  const [draft, setDraft] = useState<DateRange | undefined>(propsRange);

  // Sync draft với props mỗi khi mở popup
  useEffect(() => {
    if (open) setDraft(propsRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, checkIn, checkOut]);

  function handleSelect(r: DateRange | undefined) {
    if (!r?.from) {
      setDraft(undefined);
      return;
    }
    // Nếu có cả 2 ngày VÀ to > from → commit + close
    if (r.to && toISO(r.to) > toISO(r.from)) {
      onChange(toISO(r.from), toISO(r.to));
      setDraft(r);
      setOpen(false);
      return;
    }
    // Chỉ mới chọn check-in (hoặc click trùng ngày) → giữ ở draft, chờ click check-out
    setDraft({ from: r.from, to: undefined });
  }

  function reset() {
    setDraft(undefined);
  }

  const nights =
    draft?.from && draft?.to
      ? Math.max(0, differenceInCalendarDays(draft.to, draft.from))
      : 0;

  const statusText = (() => {
    if (!draft?.from) return 'Chọn ngày nhận phòng';
    if (!draft.to) return 'Chọn ngày trả phòng';
    return `${nights} đêm`;
  })();

  const popup =
    open && pos ? (
      <div
        ref={popupRef}
        style={{ top: pos.top, left: pos.left }}
        className="fixed z-[100] -translate-x-1/2 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-ink-200"
      >
        <DayPicker
          mode="range"
          numberOfMonths={2}
          selected={draft}
          onSelect={handleSelect}
          disabled={{ before: new Date() }}
          locale={vi}
          classNames={{
            months: 'flex gap-6',
            month: 'space-y-3',
            caption:
              'flex justify-center pt-1 relative items-center font-display text-lg font-semibold tracking-tight text-navy-900',
            nav: 'space-x-1 flex items-center',
            nav_button:
              'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-cream-200 rounded-full',
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse space-y-1',
            head_row: 'flex',
            head_cell:
              'text-ink-500 rounded-md w-9 h-9 grid place-items-center font-medium text-[11px]',
            row: 'flex w-full mt-1',
            cell:
              'h-9 w-9 text-center text-sm relative [&:has([aria-selected].day-range-end)]:rounded-r-full [&:has([aria-selected].day-outside)]:bg-navy-50/50 [&:has([aria-selected])]:bg-navy-50 first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20',
            day: 'h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-cream-200 rounded-full transition-colors',
            day_selected:
              'bg-navy-900 text-white hover:bg-navy-800 hover:text-white focus:bg-navy-900',
            day_today: 'bg-gold-100 text-gold-900',
            day_outside: 'text-ink-300 opacity-50',
            day_disabled: 'text-ink-300 opacity-30 cursor-not-allowed',
            day_range_middle: 'aria-selected:bg-navy-50 aria-selected:text-navy-900',
            day_hidden: 'invisible',
          }}
        />
        <div className="mt-3 flex items-center justify-between border-t border-ink-200 pt-3 text-sm">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              {statusText}
            </span>
            {draft?.from && (
              <span className="mt-0.5 text-ink-900">
                <span className="font-semibold">
                  {format(draft.from, 'd MMM', { locale: vi })}
                </span>
                {draft.to && (
                  <>
                    {' → '}
                    <span className="font-semibold">
                      {format(draft.to, 'd MMM yyyy', { locale: vi })}
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {draft?.from && (
              <button
                type="button"
                onClick={reset}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-700 underline underline-offset-2 hover:text-ink-900"
              >
                Xoá ngày
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-navy-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy-800"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div ref={wrapRef} className="relative">
      {trigger({ isOpen: open, onClick: () => setOpen((v) => !v) })}
      {mounted && popup ? createPortal(popup, document.body) : null}
    </div>
  );
}
