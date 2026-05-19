/**
 * Email template data shapes.
 *
 * Mỗi template là 1 React component nhận `data` strict-typed. Server side render
 * thành HTML string khi gửi. Admin preview cũng dùng cùng data shape với sample.
 */

export interface BookingConfirmationData {
  bookingCode: string;
  guestName: string;
  guestPhone: string | null;
  guestEmail: string;
  guestCount: number;
  checkInAt: string; // ISO
  checkOutAt: string;
  nights: number;
  totalAmount: number;
  deposit: number;

  property: {
    name: string;
    address: string;
    mapUrl: string | null;
    coverImage: string | null;
  };

  owner: {
    name: string;
    phone: string;
    email: string;
    /** Đã KYC verified hay chưa */
    isVerified: boolean;
  };

  bankTransfer: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    /** Reference khách phải ghi khi chuyển (= bookingCode) */
    reference: string;
    /** Số tiền cần chuyển (= totalAmount - deposit) */
    amount: number;
    /** URL ảnh QR — sinh từ vietqr.io (đã verify domain ở next.config) */
    vietqrUrl: string;
  };

  chatUrl: string;
  cancellationPolicy: string;
  houseRules: string | null;
}

export interface PaymentReceivedData {
  bookingCode: string;
  guestName: string;
  checkInAt: string;
  checkOutAt: string;
  nights: number;
  paidAmount: number;
  paidAt: string;

  property: {
    name: string;
    address: string;
    mapUrl: string | null;
    coverImage: string | null;
  };

  owner: {
    name: string;
    phone: string;
    /** SĐT khẩn cấp ngoài giờ */
    emergencyPhone: string | null;
  };

  checkInTime: string;
  checkInInstructions: string | null;
  /** Mã check-in 6 ký tự */
  checkInCode: string;

  chatUrl: string;
  houseRules: string | null;
}

export interface KycApprovedData {
  ownerName: string;
  approvedAt: string;
  dashboardUrl: string;
}

export interface KycRejectedData {
  ownerName: string;
  reason: string;
  resubmitUrl: string;
}

export interface SubscriptionOverdueData {
  ownerName: string;
  period: string; // "2026-05"
  amount: number;
  daysOverdue: number;
  paymentUrl: string;
}

export interface PropertyApprovedData {
  ownerName: string;
  propertyName: string;
  propertyUrl: string;
  dashboardUrl: string;
}

export interface PropertyRejectedData {
  ownerName: string;
  propertyName: string;
  reason: string;
  editUrl: string;
}

/**
 * Shape chung cho 8 sub-template chuyển trạng thái booking (CONTRACTS §6).
 * Đủ field placeholder để render từ phía guest hoặc phía host.
 */
export interface BookingTransitionData {
  bookingCode: string;
  propertyName: string;
  checkIn: string; // ISO
  checkOut: string; // ISO
  guestName: string;
  hostName: string;
  depositAmount: number;
  /** Link CTA (chat / dashboard / review). Optional, mỗi template tự pick. */
  ctaUrl?: string;
}

export type EmailTemplateKey =
  | 'booking_confirmation'
  | 'payment_received'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'property_approved'
  | 'property_rejected'
  | 'subscription_overdue'
  | 'booking_request_guest'
  | 'booking_request_host'
  | 'booking_hold_timeout_guest'
  | 'booking_hold_timeout_host'
  | 'booking_deposit_timeout_guest'
  | 'booking_deposit_timeout_host'
  | 'booking_completed_guest_review'
  | 'booking_completed_host_review';

export const EMAIL_TEMPLATE_META: Record<
  EmailTemplateKey,
  { title: string; subject: string; description: string }
> = {
  booking_confirmation: {
    title: 'Xác nhận đặt phòng + Hướng dẫn TT',
    subject: 'Halong24h — Xác nhận đặt phòng {bookingCode} · {propertyName}',
    description:
      'EMAIL 1 — gửi cho khách ngay sau khi chủ nhà xác nhận có phòng. Bao gồm thông tin booking, STK chuyển khoản, VietQR, link chat. Khách dùng email này để chuyển khoản.',
  },
  payment_received: {
    title: 'Đã nhận tiền + Phiếu check-in',
    subject: 'Halong24h — Đã nhận thanh toán · Phiếu check-in {bookingCode}',
    description:
      'EMAIL 2 — gửi cho khách sau khi chủ nhà xác nhận đã nhận tiền. Bao gồm e-voucher, mã check-in, giờ nhận phòng, bản đồ, SĐT khẩn cấp.',
  },
  kyc_approved: {
    title: 'KYC đã được duyệt',
    subject: 'Halong24h — Hồ sơ chủ nhà đã được duyệt',
    description: 'Gửi cho chủ nhà khi admin duyệt hồ sơ KYC.',
  },
  kyc_rejected: {
    title: 'KYC bị từ chối',
    subject: 'Halong24h — Hồ sơ cần bổ sung',
    description: 'Gửi cho chủ nhà khi admin từ chối hồ sơ kèm lý do.',
  },
  property_approved: {
    title: 'Cơ sở đã được duyệt',
    subject: 'Halong24h — Cơ sở {propertyName} đã được duyệt',
    description:
      'Gửi cho chủ nhà khi admin duyệt cơ sở mới tạo. Cơ sở bắt đầu hiển thị trên trang khách.',
  },
  property_rejected: {
    title: 'Cơ sở bị từ chối',
    subject: 'Halong24h — Cơ sở {propertyName} cần chỉnh sửa',
    description:
      'Gửi cho chủ nhà khi admin từ chối cơ sở mới với lý do cụ thể. Chủ nhà cần chỉnh sửa rồi nộp lại.',
  },
  subscription_overdue: {
    title: 'Gói cước quá hạn',
    subject: 'Halong24h — Gói cước tháng {period} quá hạn',
    description: 'Gửi cho chủ nhà khi gói cước quá hạn 7 ngày.',
  },
  booking_request_guest: {
    title: 'Đã gửi yêu cầu đặt phòng (khách)',
    subject: 'Halong24h — Đã gửi yêu cầu đặt phòng {bookingCode}',
    description:
      'CONTRACTS §6 · (none) → hold. Gửi cho khách ngay khi submit booking. Báo đã gửi, chờ chủ phản hồi trong 24h.',
  },
  booking_request_host: {
    title: 'Có yêu cầu booking mới (chủ)',
    subject: 'Halong24h — Yêu cầu booking mới {bookingCode}',
    description:
      'CONTRACTS §6 · (none) → hold. Gửi cho chủ khi có khách submit yêu cầu. Phải duyệt trong 24h.',
  },
  booking_hold_timeout_guest: {
    title: 'Yêu cầu hết hạn (khách)',
    subject: 'Halong24h — Yêu cầu {bookingCode} đã hết hạn',
    description:
      'CONTRACTS §6 · hold → cancelled (chủ không phản hồi 24h). Báo khách yêu cầu hết hạn, gợi ý tìm phòng khác.',
  },
  booking_hold_timeout_host: {
    title: 'Tự huỷ do quá hạn duyệt (chủ)',
    subject: 'Halong24h — Yêu cầu {bookingCode} tự huỷ',
    description:
      'CONTRACTS §6 · hold → cancelled (timeout). Báo chủ rằng booking tự huỷ do quá 24h chưa duyệt.',
  },
  booking_deposit_timeout_guest: {
    title: 'Tự huỷ do chưa cọc (khách)',
    subject: 'Halong24h — Yêu cầu {bookingCode} đã huỷ do chưa cọc',
    description:
      'CONTRACTS §6 · confirmed → cancelled (khách không cọc 24h). Báo khách booking đã huỷ tự động.',
  },
  booking_deposit_timeout_host: {
    title: 'Khách không cọc — slot mở lại (chủ)',
    subject: 'Halong24h — Khách không cọc · slot {bookingCode} mở lại',
    description:
      'CONTRACTS §6 · confirmed → cancelled. Báo chủ slot phòng mở lại do khách không cọc trong 24h.',
  },
  booking_completed_guest_review: {
    title: 'Mời đánh giá trải nghiệm (khách)',
    subject: 'Halong24h — Trải nghiệm thế nào? Đánh giá ngay · {bookingCode}',
    description:
      'CONTRACTS §6 · paid → completed. Gửi sau check-out để mời khách viết review về cơ sở.',
  },
  booking_completed_host_review: {
    title: 'Mời đánh giá khách (chủ)',
    subject: 'Halong24h — Khách đã check-out · Mời đánh giá khách {bookingCode}',
    description:
      'CONTRACTS §6 · paid → completed. Mời chủ nhà đánh giá khách (rating 2 chiều).',
  },
};
