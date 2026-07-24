import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';

import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://manager.halong24h.com'),
  title: {
    default: 'Halong24h — Trang quản trị',
    template: '%s · Halong24h Quản trị',
  },
  description:
    'Trang quản trị dành cho chủ nhà villa, homestay, khách sạn tại Halong24h.',
  // Manager site nội bộ — không cần Google index.
  robots: { index: false, follow: false },
  icons: {
    icon: '/logo-mark.png',
    shortcut: '/logo-mark.png',
    apple: '/logo-mark.png',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Halong24h Quản trị',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={playfair.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-cream-50 text-ink-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
