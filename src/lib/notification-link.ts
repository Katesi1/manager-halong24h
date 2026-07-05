import type { Notification } from '@/core/entities/notification';

export type ManagerArea = 'admin' | 'host';

/**
 * Suy đường dẫn đích cho 1 notification từ `targetType` + `targetId`
 * (spec §8.2). Ưu tiên `link` BE trả sẵn nếu có. Trả `null` khi không
 * biết đích → UI chỉ đánh dấu đã đọc, không điều hướng.
 */
export function notificationHref(
  n: Pick<Notification, 'link' | 'targetType' | 'targetId'>,
  area: ManagerArea,
): string | null {
  if (n.link) return n.link;

  const type = (n.targetType ?? '').toLowerCase();
  const id = n.targetId;
  if (!type) return null;

  switch (type) {
    case 'booking':
      return id ? `/${area}/bookings/${id}` : `/${area}/bookings`;
    case 'conversation':
    case 'message':
    case 'chat':
      // Chat chỉ có trang phía host (ADMIN vẫn truy cập được qua isManagerRole)
      return id ? `/host/messages/${id}` : '/host/messages';
    case 'property':
      return id ? `/${area}/properties/${id}` : `/${area}/properties`;
    case 'lead':
      return id ? `/host/leads/${id}` : '/host/leads';
    case 'review':
      return area === 'admin' ? '/admin/reviews' : null;
    case 'dispute':
      return area === 'admin' && id ? `/admin/disputes/${id}` : null;
    case 'kyc':
      return area === 'admin'
        ? id
          ? `/admin/kyc/${id}`
          : '/admin/kyc'
        : '/host/kyc';
    case 'user':
      return area === 'admin' && id ? `/admin/users/${id}` : null;
    case 'payment':
    case 'subscription':
      return area === 'admin' ? '/admin/payments' : '/host/billing';
    case 'bank':
    case 'bank_account':
    case 'bank_submitted':
      // ADMIN: queue duyệt STK; OWNER: màn tài khoản nhận tiền (spec §3.3.1).
      return area === 'admin' ? '/admin/bank-accounts' : '/host/settings/bank';
    default:
      return null;
  }
}
