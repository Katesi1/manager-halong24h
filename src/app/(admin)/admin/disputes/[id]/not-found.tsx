import Link from 'next/link';

export default function DisputeNotFound() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center shadow-card">
        <p className="text-3xl">⚖️</p>
        <p className="mt-3 text-sm font-medium text-gold-700">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-navy-900">
          Không tìm thấy khiếu nại
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Khiếu nại này không tồn tại hoặc đã bị gỡ khỏi hệ thống.
        </p>
        <Link
          href="/admin/disputes"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-navy-900 px-5 text-sm font-medium text-white hover:bg-navy-800"
        >
          ← Quay lại danh sách khiếu nại
        </Link>
      </div>
    </div>
  );
}
