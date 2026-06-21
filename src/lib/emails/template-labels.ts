/**
 * Nhãn tiếng Việt hiển thị cho 15 key email chính thức của BE (spec §16).
 *
 * ĐÂY KHÔNG PHẢI mapping key — key vẫn là source of truth của BE, gửi nguyên
 * sang `POST /admin/emails/test`. Đây chỉ là lớp i18n hiển thị: biến key kỹ
 * thuật (`welcome_owner`) thành nhãn người đọc hiểu ("Chào mừng chủ nhà").
 *
 * Thứ tự ưu tiên khi render: `label` BE trả về (khi BE extend) → nhãn ở đây →
 * chính key. Khi BE bổ sung key mới mà chưa có ở đây, UI tự fallback về key.
 */
export interface TemplateLabel {
  label: string;
  description: string;
}

export const EMAIL_TEMPLATE_LABELS: Record<string, TemplateLabel> = {
  welcome_owner: {
    label: 'Chào mừng chủ nhà',
    description: 'Gửi khi chủ nhà đăng ký tài khoản mới.',
  },
  welcome_sale: {
    label: 'Chào mừng nhân viên Sale',
    description: 'Gửi khi tài khoản nhân viên (Sale) được tạo.',
  },
  password_reset: {
    label: 'Đặt lại mật khẩu',
    description: 'Gửi link đặt lại mật khẩu khi người dùng quên.',
  },
  booking_confirmed: {
    label: 'Xác nhận đặt phòng',
    description:
      'Gửi khách khi chủ nhà xác nhận còn phòng — kèm STK chuyển khoản + VietQR.',
  },
  booking_cancelled: {
    label: 'Huỷ đặt phòng',
    description: 'Gửi khi đơn đặt phòng bị huỷ.',
  },
  booking_paid: {
    label: 'Đã nhận thanh toán',
    description:
      'Gửi khách khi chủ nhà xác nhận đã nhận tiền — kèm phiếu check-in.',
  },
  kyc_approved: {
    label: 'KYC được duyệt',
    description: 'Gửi chủ nhà khi hồ sơ KYC được phê duyệt.',
  },
  kyc_rejected: {
    label: 'KYC bị từ chối',
    description: 'Gửi chủ nhà kèm lý do cần bổ sung hồ sơ.',
  },
  staff_invite: {
    label: 'Mời nhân viên',
    description: 'Gửi lời mời tham gia làm nhân viên (Sale) cho chủ nhà.',
  },
  subscription_due: {
    label: 'Gói cước đến hạn',
    description: 'Nhắc chủ nhà gói cước sắp đến hạn thanh toán.',
  },
  subscription_overdue: {
    label: 'Gói cước quá hạn',
    description: 'Cảnh báo chủ nhà gói cước đã quá hạn.',
  },
  subscription_paid: {
    label: 'Đã thanh toán gói cước',
    description: 'Xác nhận chủ nhà đã thanh toán gói cước thành công.',
  },
  dispute_opened: {
    label: 'Mở tranh chấp',
    description: 'Thông báo có tranh chấp mới được mở.',
  },
  review_received: {
    label: 'Nhận đánh giá mới',
    description: 'Thông báo chủ nhà có đánh giá mới từ khách.',
  },
  property_approved: {
    label: 'Cơ sở được duyệt',
    description: 'Gửi chủ nhà khi cơ sở mới tạo được duyệt.',
  },
};
