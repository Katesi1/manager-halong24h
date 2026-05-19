export default function PropertyDetailLoading() {
  return (
    <div className="p-6 lg:p-8" aria-busy="true" aria-label="Đang tải cơ sở">
      <div className="mb-8 animate-pulse">
        <div className="h-3 w-32 rounded bg-cream-200" />
        <div className="mt-3 h-10 w-1/2 max-w-md rounded bg-cream-200" />
        <div className="mt-3 h-4 w-2/3 max-w-lg rounded bg-cream-200" />
        <div className="mt-6 h-px w-full bg-cream-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 animate-pulse rounded-2xl bg-white p-6 ring-1 ring-ink-200/60">
          <div className="h-4 w-40 rounded bg-cream-200" />
          <div className="mt-4 space-y-3">
            <div className="h-10 w-full rounded bg-cream-100" />
            <div className="h-10 w-full rounded bg-cream-100" />
            <div className="h-10 w-full rounded bg-cream-100" />
            <div className="h-24 w-full rounded bg-cream-100" />
          </div>
        </div>
        <div className="animate-pulse rounded-2xl bg-white p-6 ring-1 ring-ink-200/60">
          <div className="h-4 w-28 rounded bg-cream-200" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-full rounded bg-cream-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
