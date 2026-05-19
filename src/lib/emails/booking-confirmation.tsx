import type { BookingConfirmationData } from './types';

/**
 * Booking confirmation email — gửi cho khách sau khi chủ nhà bấm "Gửi xác nhận".
 *
 * Theo business model 2026-05-15: platform KHÔNG giữ tiền. Email phải có đủ:
 *   - Thông tin đặt phòng rõ ràng
 *   - STK ngân hàng đã KYC của chủ nhà + mã QR VietQR để khách quét app banking
 *   - Link vào khung chat trên Halong24h (proof of transaction)
 *   - Thông tin liên hệ chủ nhà
 *   - Bản đồ + chính sách huỷ + quy định
 *   - Tuyên bố trách nhiệm
 *
 * CONTRACTS §6: trường `bankTransfer.reference` BẮT BUỘC theo format
 *   `HL24H-{bookingId}` để BE có thể parse memo từ webhook ngân hàng và auto
 *   reconcile transition `confirmed` → `paid`.
 *
 * Design constraints email HTML:
 *   - Width cố định 600px (chuẩn email client)
 *   - Inline styles only (không support class)
 *   - Table-based layout (Gmail/Outlook unreliable với div+flex)
 *   - Web-safe fonts (fallback Arial/Helvetica)
 *   - Compatible Gmail, Outlook, Apple Mail, Yahoo
 */

const COLORS = {
  navy: '#1b365d',
  navyDark: '#0f1f3a',
  cream: '#faf7f2',
  creamAlt: '#f5f1ea',
  gold: '#c9a96e',
  goldDark: '#8b6c39',
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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function BookingConfirmationEmail({ data }: { data: BookingConfirmationData }) {
  const remainingAmount = data.totalAmount - data.deposit;

  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Xác nhận đặt phòng {data.bookingCode}</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: COLORS.cream,
          fontFamily: BASE_FONT,
          color: COLORS.ink,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {/* Preheader (hidden, shown in inbox preview) */}
        <div
          style={{
            display: 'none',
            overflow: 'hidden',
            lineHeight: '1px',
            opacity: 0,
            maxHeight: 0,
            maxWidth: 0,
          }}
        >
          Đặt phòng {data.bookingCode} tại {data.property.name} đã được chủ nhà xác
          nhận. Vui lòng kiểm tra chi tiết và chuyển khoản theo hướng dẫn.
        </div>

        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          style={{ backgroundColor: COLORS.cream }}
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
                    {/* Header */}
                    <tr>
                      <td align="center" style={{ padding: '0 0 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
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

                    {/* Main card */}
                    <tr>
                      <td
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          padding: 0,
                          boxShadow: '0 1px 3px rgba(20,30,55,0.06)',
                          overflow: 'hidden',
                          border: `1px solid ${COLORS.border}`,
                        }}
                      >
                        {/* Status banner */}
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
                                  backgroundColor: COLORS.emerald,
                                  color: '#ffffff',
                                  padding: '12px 32px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  letterSpacing: '0.06em',
                                  textTransform: 'uppercase',
                                  textAlign: 'center',
                                }}
                              >
                                ✓ Đặt phòng đã được xác nhận
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Greeting + booking number */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '32px 32px 16px' }}>
                                <h1
                                  style={{
                                    margin: 0,
                                    fontFamily: 'Georgia, serif',
                                    fontSize: '28px',
                                    fontWeight: 600,
                                    color: COLORS.navy,
                                    lineHeight: 1.2,
                                  }}
                                >
                                  Chào {data.guestName},
                                </h1>
                                <p
                                  style={{
                                    margin: '12px 0 0',
                                    fontSize: '15px',
                                    lineHeight: 1.6,
                                    color: COLORS.ink,
                                  }}
                                >
                                  Đặt phòng của bạn tại <strong>{data.property.name}</strong>
                                  {' '}đã được chủ nhà{' '}
                                  <strong>{data.owner.name}</strong>
                                  {data.owner.isVerified && (
                                    <>
                                      {' '}
                                      <span
                                        style={{
                                          display: 'inline-block',
                                          backgroundColor: COLORS.creamAlt,
                                          color: COLORS.goldDark,
                                          fontSize: '11px',
                                          padding: '2px 8px',
                                          borderRadius: '999px',
                                          fontWeight: 600,
                                          marginLeft: '4px',
                                        }}
                                      >
                                        ✓ Đã xác minh
                                      </span>
                                    </>
                                  )}{' '}
                                  xác nhận. Vui lòng kiểm tra chi tiết bên dưới và
                                  thực hiện chuyển khoản để hoàn tất đặt phòng.
                                </p>
                                <p
                                  style={{
                                    margin: '16px 0 0',
                                    fontSize: '13px',
                                    color: COLORS.inkMuted,
                                  }}
                                >
                                  Mã đặt phòng:{' '}
                                  <strong
                                    style={{
                                      fontFamily:
                                        "ui-monospace, 'SF Mono', Menlo, monospace",
                                      color: COLORS.ink,
                                    }}
                                  >
                                    {data.bookingCode}
                                  </strong>
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Cover image */}
                        {data.property.coverImage && (
                          <table
                            role="presentation"
                            width="100%"
                            cellPadding={0}
                            cellSpacing={0}
                            border={0}
                          >
                            <tbody>
                              <tr>
                                <td style={{ padding: '0 32px 16px' }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={data.property.coverImage}
                                    alt={data.property.name}
                                    width="536"
                                    style={{
                                      display: 'block',
                                      width: '100%',
                                      maxWidth: '536px',
                                      height: 'auto',
                                      borderRadius: '8px',
                                      border: `1px solid ${COLORS.border}`,
                                    }}
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}

                        {/* Booking details box */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '8px 32px 24px' }}>
                                <DetailLabel>Chi tiết đặt phòng</DetailLabel>
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellPadding={0}
                                  cellSpacing={0}
                                  border={0}
                                  style={{
                                    marginTop: '12px',
                                    borderCollapse: 'separate',
                                    backgroundColor: COLORS.cream,
                                    borderRadius: '8px',
                                    border: `1px solid ${COLORS.border}`,
                                  }}
                                >
                                  <tbody>
                                    <DetailRow label="Cơ sở" value={data.property.name} />
                                    <DetailRow label="Địa chỉ" value={data.property.address} />
                                    <DetailRow
                                      label="Nhận phòng"
                                      value={formatDate(data.checkInAt)}
                                    />
                                    <DetailRow
                                      label="Trả phòng"
                                      value={`${formatDate(data.checkOutAt)} (${data.nights} đêm)`}
                                    />
                                    <DetailRow
                                      label="Số khách"
                                      value={`${data.guestCount} người`}
                                    />
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Payment summary */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '0 32px 24px' }}>
                                <DetailLabel>Tổng chi phí</DetailLabel>
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellPadding={0}
                                  cellSpacing={0}
                                  border={0}
                                  style={{
                                    marginTop: '12px',
                                    borderCollapse: 'separate',
                                  }}
                                >
                                  <tbody>
                                    <tr>
                                      <td
                                        style={{
                                          padding: '8px 0',
                                          fontSize: '14px',
                                          color: COLORS.inkMuted,
                                        }}
                                      >
                                        Tổng giá phòng
                                      </td>
                                      <td
                                        style={{
                                          padding: '8px 0',
                                          fontSize: '14px',
                                          textAlign: 'right',
                                          fontWeight: 600,
                                          color: COLORS.ink,
                                        }}
                                      >
                                        {formatVND(data.totalAmount)}
                                      </td>
                                    </tr>
                                    {data.deposit > 0 && (
                                      <tr>
                                        <td
                                          style={{
                                            padding: '8px 0',
                                            fontSize: '14px',
                                            color: COLORS.inkMuted,
                                          }}
                                        >
                                          Đã đặt cọc
                                        </td>
                                        <td
                                          style={{
                                            padding: '8px 0',
                                            fontSize: '14px',
                                            textAlign: 'right',
                                            fontWeight: 600,
                                            color: COLORS.emerald,
                                          }}
                                        >
                                          − {formatVND(data.deposit)}
                                        </td>
                                      </tr>
                                    )}
                                    <tr>
                                      <td
                                        colSpan={2}
                                        style={{
                                          borderTop: `1px solid ${COLORS.border}`,
                                          paddingTop: 0,
                                        }}
                                      />
                                    </tr>
                                    <tr>
                                      <td
                                        style={{
                                          padding: '12px 0 0',
                                          fontSize: '15px',
                                          color: COLORS.ink,
                                          fontWeight: 600,
                                        }}
                                      >
                                        Cần chuyển khoản
                                      </td>
                                      <td
                                        style={{
                                          padding: '12px 0 0',
                                          fontSize: '20px',
                                          textAlign: 'right',
                                          fontWeight: 700,
                                          color: COLORS.navy,
                                        }}
                                      >
                                        {formatVND(remainingAmount)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Bank transfer + VietQR */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '0 32px 24px' }}>
                                <DetailLabel>
                                  Hướng dẫn chuyển khoản trực tiếp cho chủ nhà
                                </DetailLabel>
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellPadding={0}
                                  cellSpacing={0}
                                  border={0}
                                  style={{
                                    marginTop: '12px',
                                    backgroundColor: COLORS.creamAlt,
                                    borderRadius: '8px',
                                    border: `1px solid ${COLORS.border}`,
                                  }}
                                >
                                  <tbody>
                                    <tr>
                                      <td style={{ padding: '20px', verticalAlign: 'top' }}>
                                        <BankRow
                                          label="Ngân hàng"
                                          value={data.bankTransfer.bankName}
                                        />
                                        <BankRow
                                          label="Số tài khoản"
                                          value={data.bankTransfer.accountNumber}
                                          mono
                                        />
                                        <BankRow
                                          label="Chủ tài khoản"
                                          value={data.bankTransfer.accountName}
                                        />
                                        <BankRow
                                          label="Số tiền"
                                          value={formatVND(data.bankTransfer.amount)}
                                          highlight
                                        />
                                        <BankRow
                                          label="Nội dung CK"
                                          value={data.bankTransfer.reference}
                                          mono
                                          highlight
                                        />
                                      </td>
                                      <td
                                        style={{
                                          width: '140px',
                                          padding: '20px',
                                          textAlign: 'center',
                                          verticalAlign: 'top',
                                        }}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={data.bankTransfer.vietqrUrl}
                                          alt="VietQR"
                                          width="120"
                                          height="120"
                                          style={{
                                            display: 'block',
                                            width: '120px',
                                            height: '120px',
                                            margin: '0 auto',
                                            backgroundColor: '#ffffff',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            border: `1px solid ${COLORS.border}`,
                                          }}
                                        />
                                        <p
                                          style={{
                                            margin: '8px 0 0',
                                            fontSize: '11px',
                                            color: COLORS.inkMuted,
                                            fontWeight: 600,
                                          }}
                                        >
                                          Quét VietQR
                                        </p>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <p
                                  style={{
                                    margin: '12px 0 0',
                                    fontSize: '12px',
                                    color: COLORS.inkMuted,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  ⚠️ Nhớ ghi đúng nội dung chuyển khoản{' '}
                                  <strong>{data.bankTransfer.reference}</strong> để chủ
                                  nhà xác nhận nhanh. Sau khi chuyển, upload ảnh
                                  bill vào khung chat bên dưới.
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* CTA — chat */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                        >
                          <tbody>
                            <tr>
                              <td align="center" style={{ padding: '0 32px 24px' }}>
                                <a
                                  href={data.chatUrl}
                                  style={{
                                    display: 'inline-block',
                                    backgroundColor: COLORS.navy,
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    padding: '14px 32px',
                                    borderRadius: '8px',
                                    letterSpacing: '0.02em',
                                  }}
                                >
                                  💬 Vào khung chat với chủ nhà
                                </a>
                                <p
                                  style={{
                                    margin: '12px 0 0',
                                    fontSize: '12px',
                                    color: COLORS.inkMuted,
                                  }}
                                >
                                  Hỏi đáp + upload bill + nhận hướng dẫn check-in
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Owner info */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '0 32px 24px' }}>
                                <DetailLabel>Liên hệ chủ nhà</DetailLabel>
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellPadding={0}
                                  cellSpacing={0}
                                  border={0}
                                  style={{ marginTop: '12px' }}
                                >
                                  <tbody>
                                    <tr>
                                      <td
                                        style={{
                                          fontSize: '14px',
                                          color: COLORS.ink,
                                          paddingBottom: '6px',
                                        }}
                                      >
                                        <strong>{data.owner.name}</strong>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style={{ fontSize: '14px', paddingBottom: '4px' }}>
                                        <a
                                          href={`tel:${data.owner.phone}`}
                                          style={{
                                            color: COLORS.navy,
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                          }}
                                        >
                                          ☎ {data.owner.phone}
                                        </a>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style={{ fontSize: '14px' }}>
                                        <a
                                          href={`mailto:${data.owner.email}`}
                                          style={{
                                            color: COLORS.navy,
                                            textDecoration: 'none',
                                          }}
                                        >
                                          ✉ {data.owner.email}
                                        </a>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                {data.property.mapUrl && (
                                  <p style={{ marginTop: '12px', fontSize: '13px' }}>
                                    <a
                                      href={data.property.mapUrl}
                                      style={{
                                        color: COLORS.navy,
                                        textDecoration: 'underline',
                                      }}
                                    >
                                      📍 Xem trên Google Maps
                                    </a>
                                  </p>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Policies */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                          style={{ borderTop: `1px solid ${COLORS.border}` }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '24px 32px' }}>
                                <DetailLabel>Chính sách huỷ</DetailLabel>
                                <p
                                  style={{
                                    margin: '8px 0 16px',
                                    fontSize: '13px',
                                    lineHeight: 1.6,
                                    color: COLORS.ink,
                                  }}
                                >
                                  {data.cancellationPolicy}
                                </p>
                                {data.houseRules && (
                                  <>
                                    <DetailLabel>Quy định cơ sở</DetailLabel>
                                    <p
                                      style={{
                                        margin: '8px 0 0',
                                        fontSize: '13px',
                                        lineHeight: 1.6,
                                        color: COLORS.ink,
                                        whiteSpace: 'pre-line',
                                      }}
                                    >
                                      {data.houseRules}
                                    </p>
                                  </>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Responsibility statement */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                          style={{ backgroundColor: COLORS.cream }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '20px 32px' }}>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: '12px',
                                    lineHeight: 1.6,
                                    color: COLORS.inkMuted,
                                  }}
                                >
                                  <strong style={{ color: COLORS.ink }}>
                                    ⚖️ Tuyên bố trách nhiệm:
                                  </strong>{' '}
                                  Halong24h là nền tảng trung gian, KHÔNG giữ tiền
                                  giao dịch. Khách chuyển khoản trực tiếp cho chủ
                                  nhà qua STK đã xác minh. Halong24h chỉ chịu trách
                                  nhiệm trung gian với giao dịch{' '}
                                  <strong>thực hiện qua khung chat trên hệ thống</strong>{' '}
                                  của chúng tôi.
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Footer */}
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
                          © {new Date().getFullYear()} Halong24h JSC · MST 0108XXXXXX ·
                          Hạ Long, Quảng Ninh
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
                          </a>{' '}
                          ·{' '}
                          <a
                            href="tel:0325992001"
                            style={{
                              color: COLORS.navy,
                              textDecoration: 'underline',
                            }}
                          >
                            0325 992 001
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

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: COLORS.inkMuted,
      }}
    >
      {children}
    </p>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td
        style={{
          padding: '12px 16px',
          fontSize: '13px',
          color: COLORS.inkMuted,
          width: '40%',
          verticalAlign: 'top',
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: '12px 16px',
          fontSize: '14px',
          color: COLORS.ink,
          fontWeight: 600,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        {value}
      </td>
    </tr>
  );
}

function BankRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
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
              fontSize: '12px',
              color: COLORS.inkMuted,
              paddingBottom: '4px',
            }}
          >
            {label}
          </td>
        </tr>
        <tr>
          <td
            style={{
              fontSize: highlight ? '17px' : '15px',
              fontWeight: highlight ? 700 : 600,
              color: highlight ? COLORS.navy : COLORS.ink,
              paddingBottom: '12px',
              fontFamily: mono
                ? "ui-monospace, 'SF Mono', Menlo, monospace"
                : undefined,
              wordBreak: 'break-all',
            }}
          >
            {value}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
