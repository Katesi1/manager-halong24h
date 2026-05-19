import type {
  BookingConfirmationData,
  BookingTransitionData,
  KycApprovedData,
  KycRejectedData,
  PaymentReceivedData,
  PropertyApprovedData,
  PropertyRejectedData,
  SubscriptionOverdueData,
} from './types';

/**
 * Sample data cho preview email trong admin/settings.
 * BE sẽ thay bằng dữ liệu thật khi gửi.
 *
 * SYNTHETIC TEST DATA — NOT REAL ACCOUNTS, do not use in production.
 * Mọi số điện thoại / email / số tài khoản trong file này đều là dữ liệu giả
 * dùng để render preview. KHÔNG được dùng làm thông tin liên hệ thật.
 */

export const SAMPLE_BOOKING_CONFIRMATION: BookingConfirmationData = {
  bookingCode: 'HL-2026-05-0142',
  guestName: 'Nguyễn Văn An',
  guestPhone: '0000 000 004',
  guestEmail: 'guest.demo@example.com',
  guestCount: 4,
  checkInAt: '2026-05-20T14:00:00.000Z',
  checkOutAt: '2026-05-22T12:00:00.000Z',
  nights: 2,
  totalAmount: 4_500_000,
  deposit: 1_500_000,
  property: {
    name: 'Villa B1716 — View biển Bãi Cháy',
    address: '156 Hạ Long, Bãi Cháy, Quảng Ninh',
    mapUrl: 'https://maps.google.com/?q=20.95,107.07',
    coverImage:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85',
  },
  owner: {
    name: 'Trần Hoàng Đức',
    phone: '0000 000 003',
    email: 'admin.demo@example.com',
    isVerified: true,
  },
  bankTransfer: {
    bankName: 'Demo Bank',
    accountNumber: '9999999999',
    accountName: 'TRAN HOANG DUC',
    // CONTRACTS §6: memo format BẮT BUỘC = HL24H-{bookingId}
    reference: 'HL24H-HL-2026-05-0142',
    amount: 3_000_000,
    vietqrUrl:
      'https://img.vietqr.io/image/999999-9999999999-compact2.png?amount=3000000&addInfo=HL24H-HL-2026-05-0142&accountName=TRAN%20HOANG%20DUC',
  },
  chatUrl: 'https://halong24h.com/chat/HL-2026-05-0142',
  cancellationPolicy:
    'Huỷ miễn phí trong 48h sau khi đặt. Sau đó hoàn 50% nếu huỷ trước 7 ngày, không hoàn nếu huỷ muộn hơn.',
  houseRules:
    'Không hút thuốc trong phòng.\nKhông tổ chức tiệc/sự kiện.\nThân thiện với gia đình có trẻ em.\nCheck-in 14:00 · Check-out 12:00.',
};

export const SAMPLE_PAYMENT_RECEIVED: PaymentReceivedData = {
  bookingCode: 'HL-2026-05-0142',
  guestName: 'Nguyễn Văn An',
  checkInAt: '2026-05-20T14:00:00.000Z',
  checkOutAt: '2026-05-22T12:00:00.000Z',
  nights: 2,
  paidAmount: 4_500_000,
  paidAt: '2026-05-16T09:30:00.000Z',
  property: {
    name: 'Villa B1716 — View biển Bãi Cháy',
    address: '156 Hạ Long, Bãi Cháy, Quảng Ninh',
    mapUrl: 'https://maps.google.com/?q=20.95,107.07',
    coverImage:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85',
  },
  owner: {
    name: 'Trần Hoàng Đức',
    phone: '0000 000 003',
    emergencyPhone: '0000 000 005',
  },
  checkInTime: '14:00',
  checkInInstructions:
    'Đến cổng tầng 1 toà nhà, gọi SĐT chủ nhà để được dẫn lên căn hộ. Lễ tân toà có hỗ trợ bãi đỗ xe.',
  checkInCode: 'HL142A',
  chatUrl: 'https://halong24h.com/chat/HL-2026-05-0142',
  houseRules:
    'Không hút thuốc trong phòng.\nCheck-in 14:00 · Check-out 12:00.\nLiên hệ chủ nhà trước 1 giờ khi tới để chuẩn bị.',
};

export const SAMPLE_KYC_APPROVED: KycApprovedData = {
  ownerName: 'Trần Hoàng Đức',
  approvedAt: '2026-05-15T16:00:00.000Z',
  dashboardUrl: 'https://manager.halong24h.com/host',
};

export const SAMPLE_KYC_REJECTED: KycRejectedData = {
  ownerName: 'Phạm Hữu Cường',
  reason:
    'Tên trên tài khoản ngân hàng không khớp với CCCD. Vui lòng cung cấp STK đúng chủ.',
  resubmitUrl: 'https://halong24h.com/app',
};

export const SAMPLE_PROPERTY_APPROVED: PropertyApprovedData = {
  ownerName: 'Trần Hoàng Đức',
  propertyName: 'Villa B1716 — View biển Bãi Cháy',
  propertyUrl: 'https://halong24h.com/property/villa-b1716',
  dashboardUrl: 'https://manager.halong24h.com/host/properties',
};

export const SAMPLE_PROPERTY_REJECTED: PropertyRejectedData = {
  ownerName: 'Phạm Hữu Cường',
  propertyName: 'Homestay Hòn Gai Sky',
  reason:
    'Ảnh cơ sở chưa đầy đủ — vui lòng upload ít nhất 5 ảnh chất lượng tốt (phòng ngủ, phòng tắm, view, mặt tiền, khu vực chung). Đồng thời mô tả cần chi tiết hơn về tiện nghi.',
  editUrl: 'https://manager.halong24h.com/host/properties',
};

export const SAMPLE_SUBSCRIPTION_OVERDUE: SubscriptionOverdueData = {
  ownerName: 'Vũ Minh Châu',
  period: '2026-05',
  amount: 1_260_000,
  daysOverdue: 8,
  paymentUrl: 'https://manager.halong24h.com/host/billing',
};

/**
 * Sample dùng chung cho 8 booking-transition templates.
 * Cùng booking + property + actor — chỉ khác câu chuyện theo phía gửi.
 */
export const SAMPLE_BOOKING_TRANSITION: BookingTransitionData = {
  bookingCode: 'HL-2026-05-0142',
  propertyName: 'Villa B1716 — View biển Bãi Cháy',
  checkIn: '2026-05-20T14:00:00.000Z',
  checkOut: '2026-05-22T12:00:00.000Z',
  guestName: 'Nguyễn Văn An',
  hostName: 'Trần Hoàng Đức',
  depositAmount: 1_500_000,
  ctaUrl: 'https://halong24h.com/chat/HL-2026-05-0142',
};
