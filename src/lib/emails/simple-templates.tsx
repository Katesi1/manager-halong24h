import type {
  KycApprovedData,
  KycRejectedData,
  PropertyApprovedData,
  PropertyRejectedData,
  SubscriptionOverdueData,
} from './types';

/**
 * Các email đơn giản hơn (KYC approved/rejected, subscription overdue).
 * Dùng chung skeleton EmailShell — chỉ khác content body.
 */

const COLORS = {
  navy: '#1b365d',
  cream: '#faf7f2',
  creamAlt: '#f5f1ea',
  gold: '#c9a96e',
  ink: '#1a1a1a',
  inkMuted: '#717171',
  border: '#ebe3d3',
  emerald: '#10b981',
  rose: '#dc2626',
};

const BASE_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
}

function EmailShell({
  title,
  bannerColor,
  bannerText,
  children,
}: {
  title: string;
  bannerColor: string;
  bannerText: string;
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: COLORS.cream,
          fontFamily: BASE_FONT,
          color: COLORS.ink,
        }}
      >
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: '24px 12px' }}>
                <table
                  role="presentation"
                  width="600"
                  cellPadding={0}
                  cellSpacing={0}
                  border={0}
                  style={{ maxWidth: '600px', width: '100%' }}
                >
                  <tbody>
                    <tr>
                      <td align="center" style={{ padding: '0 0 16px' }}>
                        <span
                          style={{
                            fontFamily: 'Georgia, serif',
                            fontSize: '28px',
                            fontWeight: 600,
                            color: COLORS.navy,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          Halong24h
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: `1px solid ${COLORS.border}`,
                          overflow: 'hidden',
                        }}
                      >
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  backgroundColor: bannerColor,
                                  color: '#ffffff',
                                  padding: '12px 32px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  letterSpacing: '0.06em',
                                  textTransform: 'uppercase',
                                  textAlign: 'center',
                                }}
                              >
                                {bannerText}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '32px' }}>{children}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '24px 16px', textAlign: 'center' }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            lineHeight: 1.6,
                            color: COLORS.inkMuted,
                          }}
                        >
                          © {new Date().getFullYear()} Halong24h JSC · MST
                          0108XXXXXX · Hạ Long, Quảng Ninh
                        </p>
                        <p
                          style={{
                            margin: '8px 0 0',
                            fontSize: '12px',
                            color: COLORS.inkMuted,
                          }}
                        >
                          Cần hỗ trợ?{' '}
                          <a
                            href="mailto:support@halong24h.com"
                            style={{
                              color: COLORS.navy,
                              textDecoration: 'underline',
                            }}
                          >
                            support@halong24h.com
                          </a>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

function PrimaryCta({ href, label }: { href: string; label: string }) {
  return (
    <p style={{ textAlign: 'center', margin: '24px 0 0' }}>
      <a
        href={href}
        style={{
          display: 'inline-block',
          backgroundColor: COLORS.navy,
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '15px',
          fontWeight: 600,
          padding: '14px 32px',
          borderRadius: '8px',
        }}
      >
        {label}
      </a>
    </p>
  );
}

export function KycApprovedEmail({ data }: { data: KycApprovedData }) {
  return (
    <EmailShell
      title="KYC đã được duyệt"
      bannerColor={COLORS.emerald}
      bannerText="✓ Hồ sơ đã được duyệt"
    >
      <h1
        style={{
          margin: 0,
          fontFamily: 'Georgia, serif',
          fontSize: '24px',
          fontWeight: 600,
          color: COLORS.navy,
          lineHeight: 1.2,
        }}
      >
        Chào {data.ownerName},
      </h1>
      <p
        style={{
          margin: '12px 0 0',
          fontSize: '15px',
          lineHeight: 1.7,
          color: COLORS.ink,
        }}
      >
        Hồ sơ xác minh chủ nhà của bạn đã được đội ngũ Halong24h duyệt. Từ bây
        giờ, cơ sở của bạn sẽ hiển thị huy hiệu{' '}
        <strong style={{ color: COLORS.emerald }}>✓ Đã xác minh</strong> cho
        khách thấy — tăng độ tin cậy và tỷ lệ chốt booking.
      </p>
      <p
        style={{
          margin: '16px 0 0',
          fontSize: '14px',
          color: COLORS.inkMuted,
          lineHeight: 1.6,
        }}
      >
        Bạn có thể bắt đầu nhận đặt phòng ngay. Khách chuyển khoản trực tiếp
        cho bạn qua STK đã xác minh trong hồ sơ KYC.
      </p>
      <PrimaryCta href={data.dashboardUrl} label="Vào trang quản lý" />
    </EmailShell>
  );
}

export function KycRejectedEmail({ data }: { data: KycRejectedData }) {
  return (
    <EmailShell
      title="Hồ sơ cần bổ sung"
      bannerColor={COLORS.rose}
      bannerText="Hồ sơ cần bổ sung"
    >
      <h1
        style={{
          margin: 0,
          fontFamily: 'Georgia, serif',
          fontSize: '24px',
          fontWeight: 600,
          color: COLORS.navy,
          lineHeight: 1.2,
        }}
      >
        Chào {data.ownerName},
      </h1>
      <p
        style={{
          margin: '12px 0 0',
          fontSize: '15px',
          lineHeight: 1.7,
          color: COLORS.ink,
        }}
      >
        Hồ sơ KYC của bạn cần được bổ sung/sửa lại trước khi được duyệt. Lý do
        cụ thể:
      </p>
      <div
        style={{
          marginTop: '16px',
          padding: '16px',
          backgroundColor: COLORS.creamAlt,
          borderLeft: `4px solid ${COLORS.rose}`,
          borderRadius: '4px',
          fontSize: '14px',
          lineHeight: 1.6,
          color: COLORS.ink,
        }}
      >
        {data.reason}
      </div>
      <p
        style={{
          margin: '16px 0 0',
          fontSize: '13px',
          color: COLORS.inkMuted,
          lineHeight: 1.6,
        }}
      >
        Vui lòng mở app mobile Halong24h, cập nhật lại các tài liệu cần thiết
        và submit lại hồ sơ. Đội ngũ sẽ duyệt lại trong vòng 24 giờ.
      </p>
      <PrimaryCta href={data.resubmitUrl} label="Mở app để nộp lại" />
    </EmailShell>
  );
}

export function PropertyApprovedEmail({
  data,
}: {
  data: PropertyApprovedData;
}) {
  return (
    <EmailShell
      title="Cơ sở đã được duyệt"
      bannerColor={COLORS.emerald}
      bannerText="✓ Cơ sở đã được duyệt"
    >
      <h1
        style={{
          margin: 0,
          fontFamily: 'Georgia, serif',
          fontSize: '24px',
          fontWeight: 600,
          color: COLORS.navy,
          lineHeight: 1.2,
        }}
      >
        Chào {data.ownerName},
      </h1>
      <p
        style={{
          margin: '12px 0 0',
          fontSize: '15px',
          lineHeight: 1.7,
          color: COLORS.ink,
        }}
      >
        Cơ sở <strong>{data.propertyName}</strong> của bạn đã được đội ngũ
        Halong24h duyệt và bắt đầu hiển thị trên trang khách. Bạn có thể nhận
        booking ngay.
      </p>
      <p
        style={{
          margin: '16px 0 0',
          fontSize: '14px',
          color: COLORS.inkMuted,
          lineHeight: 1.6,
        }}
      >
        Mở trang quản lý để xem báo cáo + cấu hình giá theo ngày.
      </p>
      <PrimaryCta href={data.dashboardUrl} label="Vào trang quản lý" />
    </EmailShell>
  );
}

export function PropertyRejectedEmail({
  data,
}: {
  data: PropertyRejectedData;
}) {
  return (
    <EmailShell
      title="Cơ sở cần chỉnh sửa"
      bannerColor={COLORS.rose}
      bannerText="Cơ sở cần chỉnh sửa"
    >
      <h1
        style={{
          margin: 0,
          fontFamily: 'Georgia, serif',
          fontSize: '24px',
          fontWeight: 600,
          color: COLORS.navy,
          lineHeight: 1.2,
        }}
      >
        Chào {data.ownerName},
      </h1>
      <p
        style={{
          margin: '12px 0 0',
          fontSize: '15px',
          lineHeight: 1.7,
          color: COLORS.ink,
        }}
      >
        Cơ sở <strong>{data.propertyName}</strong> của bạn cần được chỉnh sửa
        trước khi hiển thị trên trang khách. Lý do cụ thể:
      </p>
      <div
        style={{
          marginTop: '16px',
          padding: '16px',
          backgroundColor: COLORS.creamAlt,
          borderLeft: `4px solid ${COLORS.rose}`,
          borderRadius: '4px',
          fontSize: '14px',
          lineHeight: 1.6,
          color: COLORS.ink,
        }}
      >
        {data.reason}
      </div>
      <p
        style={{
          margin: '16px 0 0',
          fontSize: '13px',
          color: COLORS.inkMuted,
          lineHeight: 1.6,
        }}
      >
        Vui lòng vào trang quản lý, cập nhật thông tin/ảnh theo gợi ý của
        admin, rồi cơ sở sẽ được duyệt lại trong 24 giờ.
      </p>
      <PrimaryCta href={data.editUrl} label="Chỉnh sửa cơ sở" />
    </EmailShell>
  );
}

export function SubscriptionOverdueEmail({
  data,
}: {
  data: SubscriptionOverdueData;
}) {
  return (
    <EmailShell
      title="Gói cước quá hạn"
      bannerColor={COLORS.gold}
      bannerText="⚠️ Gói cước quá hạn"
    >
      <h1
        style={{
          margin: 0,
          fontFamily: 'Georgia, serif',
          fontSize: '24px',
          fontWeight: 600,
          color: COLORS.navy,
          lineHeight: 1.2,
        }}
      >
        Chào {data.ownerName},
      </h1>
      <p
        style={{
          margin: '12px 0 0',
          fontSize: '15px',
          lineHeight: 1.7,
          color: COLORS.ink,
        }}
      >
        Gói cước kỳ <strong>{data.period}</strong> trị giá{' '}
        <strong>{formatVND(data.amount)}</strong> đã quá hạn{' '}
        <strong style={{ color: COLORS.rose }}>{data.daysOverdue} ngày</strong>.
      </p>
      <p
        style={{
          margin: '16px 0 0',
          fontSize: '14px',
          color: COLORS.inkMuted,
          lineHeight: 1.6,
        }}
      >
        Vui lòng thanh toán trước khi quá <strong>14 ngày</strong> để tránh bị
        tạm ẩn cơ sở khỏi trang khách.
      </p>
      <PrimaryCta href={data.paymentUrl} label="Thanh toán ngay" />
    </EmailShell>
  );
}
