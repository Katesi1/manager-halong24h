'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface PrefItem {
  key: string;
  label: string;
  defaultOn: boolean;
}

interface PrefGroup {
  id: string;
  title: string;
  caption: string;
  locked: boolean;
  items: PrefItem[];
}

const GROUPS: PrefGroup[] = [
  {
    id: 'property',
    title: 'Hoạt động cơ sở của bạn',
    caption: 'Tùy chọn — bật/tắt tùy ý',
    locked: false,
    items: [
      { key: 'msg_new', label: 'Tin nhắn mới từ khách', defaultOn: true },
      { key: 'review_new', label: 'Khách đánh giá mới', defaultOn: true },
      { key: 'kyc_update', label: 'Cập nhật KYC', defaultOn: true },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing & khuyến mãi',
    caption: 'Mặc định TẮT — opt-in. Bạn có thể tắt bất kỳ lúc nào.',
    locked: false,
    items: [
      { key: 'mkt_news', label: 'Nhận tin tức Halong24h', defaultOn: false },
      { key: 'mkt_promo', label: 'Khuyến mãi từ chủ nhà đã ở', defaultOn: false },
      { key: 'mkt_product', label: 'Cập nhật sản phẩm + tính năng mới', defaultOn: false },
    ],
  },
];

/** Per-profile storage key — tránh leak prefs giữa users dùng chung trình duyệt. */
function storageKeyFor(profileId?: string | null): string {
  const safe = profileId && /^[A-Za-z0-9_-]+$/.test(profileId) ? profileId : 'anon';
  return `halong24h-notif-prefs-${safe}-v2`;
}

type Prefs = Record<string, boolean>;

function buildDefaults(): Prefs {
  const init: Prefs = {};
  GROUPS.forEach((g) => {
    g.items.forEach((it) => {
      init[it.key] = it.defaultOn;
    });
  });
  return init;
}

interface NotificationPrefsProps {
  /** Profile id từ server — dùng để namespace localStorage key. */
  profileId?: string | null;
}

export function NotificationPrefs({ profileId }: NotificationPrefsProps = {}) {
  const storageKey = storageKeyFor(profileId);
  const [prefs, setPrefs] = useState<Prefs>(buildDefaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Prefs;
        setPrefs((p) => ({ ...p, ...parsed }));
      } else {
        // Reset to defaults when switching profiles in same tab.
        setPrefs(buildDefaults());
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [storageKey]);

  function toggle(key: string, locked: boolean) {
    if (locked) return;
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  function handleSave() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(prefs));
    } catch {
      // ignore
    }
    toast.success('Đã lưu cài đặt thông báo.');
  }

  return (
    <div className="mt-5 space-y-6">
      {GROUPS.map((group) => (
        <div key={group.id} className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">
              {group.title}
            </h3>
            <p className="text-xs text-ink-500">
              {group.caption}
            </p>
          </div>
          <ul className="space-y-2">
            {group.items.map((item) => {
              const enabled = hydrated ? prefs[item.key] : item.defaultOn;
              return (
                <li
                  key={item.key}
                  className="flex items-center justify-between rounded-lg px-4 py-3 bg-cream-100"
                >
                  <span className="text-sm text-ink-900">{item.label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={item.label}
                    onClick={() => toggle(item.key, false)}
                    className={cn(
                      'relative h-5 w-9 rounded-full transition',
                      enabled ? 'bg-emerald-500' : 'bg-ink-300',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-white transition',
                        enabled ? 'left-[18px]' : 'left-0.5',
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <p className="text-[11px] text-ink-500">
        Bạn có thể hủy đăng ký marketing bất kỳ lúc nào qua link &quot;Hủy đăng
        ký&quot; trong email.
      </p>

      <div>
        <Button variant="primary" size="sm" onClick={handleSave}>
          Lưu cài đặt thông báo
        </Button>
      </div>
    </div>
  );
}
