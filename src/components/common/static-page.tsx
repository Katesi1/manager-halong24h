import Link from 'next/link';

interface StaticPageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  lastUpdated?: string;
}

export function StaticPage({ title, subtitle, children, lastUpdated }: StaticPageProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 lg:px-8 py-12">
      <header className="mb-8">
        <Link href="/" className="text-sm text-ink-500 hover:underline">
          ← Trang chủ
        </Link>
        <h1 className="mt-4 font-display text-4xl font-bold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-3 text-lg text-ink-700">{subtitle}</p>}
        {lastUpdated && (
          <p className="mt-2 text-xs text-ink-500">Cập nhật lần cuối: {lastUpdated}</p>
        )}
      </header>
      <div className="prose prose-slate max-w-none [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:text-ink-900 [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:text-ink-700 [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:text-ink-700 [&_li]:mb-1 [&_a]:text-navy-700 [&_a]:underline">
        {children}
      </div>
    </article>
  );
}
