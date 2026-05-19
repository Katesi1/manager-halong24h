import Link from 'next/link';
import Image from 'next/image';

import { DemoAuthNotice } from '@/components/layout/demo-banner';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_minmax(420px,560px)] bg-white">
      {/* Visual side */}
      <div className="relative hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1528127269322-539801943592?w=1600&q=85"
          alt="Vịnh Hạ Long"
          fill
          priority
          sizes="60vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-navy-950/80 via-navy-900/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-12 px-12">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-navy-900 font-display font-bold">
              H
            </span>
            <span className="font-display text-2xl font-bold text-white">
              Halong<span className="text-gold-400">24h</span>
            </span>
          </Link>
          <p className="mt-6 max-w-md font-display text-3xl font-bold leading-snug text-white">
            Khám phá Vịnh Hạ Long — Di sản Thiên nhiên Thế giới UNESCO.
          </p>
          <p className="mt-3 max-w-md text-sm text-white/80">
            Villa, homestay, khách sạn cao cấp · Liên hệ trực tiếp chủ nhà · Giá tốt nhất Hạ Long.
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy-900 text-white font-display font-bold">
              H
            </span>
            <span className="text-xl font-semibold tracking-tight text-navy-900">
              Halong<span className="text-gold-600">24h</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-ink-500 hover:underline">
            ← Trang chủ
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <DemoAuthNotice />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
