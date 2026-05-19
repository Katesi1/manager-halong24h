import Link from 'next/link';
import { GlobeIcon } from '@/components/ui/icons';

const sections: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Trung tâm trợ giúp', href: '/help' },
      { label: 'Chính sách hủy', href: '/policy/cancel' },
      { label: 'Báo cáo sự cố', href: '/help/report' },
      { label: 'Thông tin liên hệ', href: '/contact' },
    ],
  },
  {
    title: 'Cộng đồng',
    links: [
      { label: 'Halong24h.org: hỗ trợ vùng cao', href: '/community' },
      { label: 'Bình đẳng & đa dạng', href: '/community/diversity' },
      { label: 'Chống phân biệt đối xử', href: '/community/anti-discrimination' },
    ],
  },
  {
    title: 'Đón tiếp khách',
    links: [
      { label: 'Đăng ký chủ nhà', href: '/host/onboarding' },
      { label: 'Trang Hosting cao cấp', href: '/host/aircover' },
      { label: 'Tài nguyên cho chủ nhà', href: '/host/resources' },
      { label: 'Cộng đồng chủ nhà', href: '/host/community' },
    ],
  },
  {
    title: 'Halong24h',
    links: [
      { label: 'Phòng tin tức', href: '/about/news' },
      { label: 'Tính năng mới', href: '/about/features' },
      { label: 'Tuyển dụng', href: '/careers' },
      { label: 'Nhà đầu tư', href: '/investors' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {sections.map((s) => (
            <div key={s.title}>
              <h4 className="mb-4 text-sm font-semibold text-ink-900">{s.title}</h4>
              <ul className="space-y-2.5">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-ink-700 hover:text-ink-900 hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-ink-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 lg:px-8 py-5 text-xs text-ink-700 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>© {new Date().getFullYear()} Halong24h, Inc.</span>
            <span>·</span>
            <Link href="/legal/privacy" className="hover:underline">
              Quyền riêng tư
            </Link>
            <span>·</span>
            <Link href="/legal/terms" className="hover:underline">
              Điều khoản
            </Link>
            <span>·</span>
            <Link href="/legal/sitemap" className="hover:underline">
              Sơ đồ trang
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-1.5 hover:underline">
              <GlobeIcon className="h-3.5 w-3.5" />
              <span className="font-medium">Tiếng Việt (VN)</span>
            </button>
            <span>·</span>
            <span className="font-medium">VND</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
