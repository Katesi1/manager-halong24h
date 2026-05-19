'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

const PREFS = [
  { key: 'booking', label: 'Có đặt phòng mới', default: true },
  { key: 'lead', label: 'Có yêu cầu khách mới', default: true },
  { key: 'paid', label: 'Khách đã thanh toán', default: true },
  { key: 'message', label: 'Có tin nhắn mới', default: true },
  { key: 'review', label: 'Khách đánh giá mới', default: true },
  { key: 'cancel', label: 'Khách hủy booking', default: true },
];

const STORAGE_KEY = 'halong24h-notif-prefs';

type Prefs = Record<string, boolean>;

export function NotificationPrefs() {
  const { show } = useToast();
  const [prefs, setPrefs] = useState<Prefs>(() => {
    const init: Prefs = {};
    PREFS.forEach((p) => {
      init[p.key] = p.default;
    });
    return init;
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPrefs((p) => ({ ...p, ...parsed }));
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  function toggle(key: string) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    show(
      `${next[key] ? '✓ Bật' : '✗ Tắt'} thông báo: ${PREFS.find((p) => p.key === key)?.label}`,
      'success',
    );
  }

  return (
    <ul className="mt-5 space-y-3">
      {PREFS.map((p) => {
        const enabled = hydrated ? prefs[p.key] : p.default;
        return (
          <li
            key={p.key}
            className="flex items-center justify-between rounded-lg bg-cream-100 px-4 py-3"
          >
            <span className="text-sm text-ink-900">{p.label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => toggle(p.key)}
              className={
                'h-5 w-9 rounded-full transition relative ' +
                (enabled ? 'bg-emerald-500' : 'bg-ink-300')
              }
            >
              <span
                className={
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white transition ' +
                  (enabled ? 'left-[18px]' : 'left-0.5')
                }
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
