import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ComingSoon({
  title,
  description,
  expected,
}: {
  title: string;
  description?: string;
  expected?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 lg:px-8 py-16 text-center">
      <div className="grid mx-auto h-20 w-20 place-items-center rounded-full bg-gold-100 text-gold-700 text-3xl">
        🚧
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold text-ink-900">{title}</h1>
      <p className="mt-3 text-ink-700">
        {description ?? 'Tính năng này đang được phát triển. Quay lại sau nhé!'}
      </p>
      {expected && (
        <p className="mt-2 text-sm text-ink-500">Dự kiến ra mắt: {expected}</p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button variant="outline">← Trang chủ</Button>
        </Link>
        <Link href="/contact">
          <Button>Liên hệ chúng tôi</Button>
        </Link>
      </div>
    </div>
  );
}
