export default function AdminLoading() {
  return (
    <div className="p-6 lg:p-8" aria-busy="true" aria-label="Đang tải">
      <div className="mb-8 animate-pulse">
        <div className="h-3 w-32 rounded bg-cream-200" />
        <div className="mt-3 h-10 w-2/3 max-w-md rounded bg-cream-200" />
        <div className="mt-3 h-4 w-3/4 max-w-xl rounded bg-cream-200" />
        <div className="mt-6 h-px w-full bg-cream-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl bg-white p-5 ring-1 ring-ink-200/60"
          >
            <div className="h-3 w-20 rounded bg-cream-200" />
            <div className="mt-3 h-8 w-24 rounded bg-cream-200" />
            <div className="mt-2 h-3 w-16 rounded bg-cream-200" />
          </div>
        ))}
      </div>
      <div className="mt-6 animate-pulse overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/60">
        <div className="border-b border-ink-200 bg-cream-100 px-4 py-3">
          <div className="h-3 w-24 rounded bg-cream-200" />
        </div>
        <div className="divide-y divide-ink-200">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-cream-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-cream-200" />
                <div className="h-3 w-1/4 rounded bg-cream-100" />
              </div>
              <div className="h-6 w-20 rounded bg-cream-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
