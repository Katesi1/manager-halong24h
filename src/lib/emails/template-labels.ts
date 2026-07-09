/**
 * Nhãn tiếng Việt hiển thị cho 8 key email chính thức của BE (spec §16, v1.34
 * rút từ 15 → 8; 7 key kia chỉ là mẫu không gửi thật, BE đã gỡ).
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
};
