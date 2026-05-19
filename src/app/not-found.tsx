import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
      <div>
        <p className="text-sm font-medium text-brand-700">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Không tìm thấy trang</h1>
        <p className="mt-2 text-slate-600">Trang bạn yêu cầu không tồn tại hoặc đã bị xóa.</p>
        <Link href="/" className="mt-6 inline-block">
          <Button>Về trang chủ</Button>
        </Link>
      </div>
    </div>
  );
}
