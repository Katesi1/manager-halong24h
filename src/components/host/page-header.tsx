import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  /** Editorial overline (chữ in hoa nhỏ ở trên title). Optional. */
  eyebrow?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  eyebrow,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Đường dẫn" className="mb-3 text-xs text-ink-500">
          <ol className="flex flex-wrap items-center">
            {breadcrumbs.map((b, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <li key={i} className="inline-flex items-center">
                  {b.href ? (
                    <Link
                      href={b.href}
                      className="hover:text-navy-900 hover:underline"
                    >
                      {b.label}
                    </Link>
                  ) : (
                    <span
                      className="text-ink-700"
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {b.label}
                    </span>
                  )}
                  {!isLast && (
                    <span aria-hidden="true" className="mx-1.5 text-ink-300">
                      /
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="overline with-dash mb-2.5 text-[10px]">{eyebrow}</p>
          )}
          <h1 className="font-display text-2xl font-semibold tracking-tight text-navy-900 leading-[1.15] sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm sm:text-base text-ink-700 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      <hr className="hairline-gold mt-6" />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; positive?: boolean };
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
      <p className="overline muted no-dash text-[10px]">{label}</p>
      <p className="mt-2 font-display text-[1.75rem] font-semibold tracking-tight leading-none text-navy-900">
        {value}
      </p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {trend && (
          <span
            className={
              'font-semibold ' +
              (trend.positive === false ? 'text-rose-600' : 'text-emerald-700')
            }
          >
            {trend.positive === false ? '↓' : '↑'} {trend.value}
          </span>
        )}
        {hint && <span className="text-ink-500">{hint}</span>}
      </div>
    </div>
  );
}
