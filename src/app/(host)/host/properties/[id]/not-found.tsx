import Link from 'next/link';

export default function PropertyNotFound() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center shadow-card">
        <p className="text-3xl">🏨</p>
        <p className="mt-3 text-sm font-medium text-gold-700">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-navy-900">
          Không tìm thấy cơ sở
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Cơ sở không tồn tại, đã bị xóa hoặc bạn không có quyền chỉnh sửa.
        </p>
        <Link
          href="/host/properties"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-navy-900 px-5 text-sm font-medium text-white hover:bg-navy-800"
        >
          ← Quay lại danh sách cơ sở
        </Link>
      </div>
    </div>
  );
}
