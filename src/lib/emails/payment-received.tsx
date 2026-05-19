import type { PaymentReceivedData } from './types';

/**
 * Email 2 — gửi cho khách SAU KHI chủ nhà bấm "Xác nhận đã nhận tiền".
 *
 * Nội dung = e-voucher / phiếu check-in:
 *   - Status banner success (Đã nhận thanh toán)
 *   - Mã check-in nổi bật (khách đọc khi đến)
 *   - Booking summary + ảnh cơ sở
 *   - Giờ nhận phòng + hướng dẫn check-in
 *   - Liên hệ chủ nhà (kèm SĐT khẩn cấp)
 *   - Bản đồ
 *   - Quy định cơ sở (nhắc lại)
 *   - Link chat (vẫn dùng nếu cần)
 *   - Tuyên bố trách nhiệm
 */

const COLORS = {
  navy: '#1b365d',
  cream: '#faf7f2',
  creamAlt: '#f5f1ea',
  gold: '#c9a96e',
  goldDark: '#8b6c39',
  ink: '#1a1a1a',
  inkMuted: '#717171',
  border: '#ebe3d3',
  emerald: '#10b981',
  emeraldDark: '#047857',
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

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function PaymentReceivedEmail({
  data,
}: {
  data: PaymentReceivedData;
}) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Phiếu check-in {data.bookingCode}</title>
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
        <div
          style={{
            display: 'none',
            overflow: 'hidden',
            lineHeight: '1px',
            opacity: 0,
            maxHeight: 0,
          }}
        >
          Đã nhận thanh toán {formatVND(data.paidAmount)} cho đặt phòng{' '}
          {data.bookingCode}. Mã check-in: {data.checkInCode}.
        </div>

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
                                ✓ Đã nhận thanh toán
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Greeting */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '32px 32px 8px' }}>
                                <h1
                                  style={{
                                    margin: 0,
                                    fontFamily: 'Georgia, serif',
                                    fontSize: '26px',
                                    fontWeight: 600,
                                    color: COLORS.navy,
                                    lineHeight: 1.2,
                                  }}
                                >
                                  Hẹn gặp bạn, {data.guestName}!
                                </h1>
                                <p
                                  style={{
                                    margin: '12px 0 0',
                                    fontSize: '15px',
                                    lineHeight: 1.6,
                                    color: COLORS.ink,
                                  }}
                                >
                                  Chủ nhà <strong>{data.owner.name}</strong> đã xác
                                  nhận nhận đủ <strong>{formatVND(data.paidAmount)}</strong>{' '}
                                  cho đặt phòng <strong>{data.bookingCode}</strong>.
                                  Đặt phòng của bạn đã sẵn sàng.
                                </p>
                                <p
                                  style={{
                                    margin: '8px 0 0',
                                    fontSize: '12px',
                                    color: COLORS.inkMuted,
                                  }}
                                >
                                  Lúc {formatDateTime(data.paidAt)}
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Check-in code — voucher style */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '16px 32px 0' }}>
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellPadding={0}
                                  cellSpacing={0}
                                  border={0}
                                  style={{
                                    backgroundColor: COLORS.navy,
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <tbody>
                                    <tr>
                                      <td
                                        style={{
                                          padding: '24px',
                                          textAlign: 'center',
                                          color: '#ffffff',
                                        }}
                                      >
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            letterSpacing: '0.18em',
                                            textTransform: 'uppercase',
                                            color: COLORS.gold,
                                          }}
                                        >
                                          Mã check-in
                                        </p>
                                        <p
                                          style={{
                                            margin: '8px 0 0',
                                            fontFamily:
                                              "ui-monospace, 'SF Mono', Menlo, monospace",
                                            fontSize: '40px',
                                            fontWeight: 700,
                                            letterSpacing: '0.18em',
                                            color: '#ffffff',
                                          }}
                                        >
                                          {data.checkInCode}
                                        </p>
                                        <p
                                          style={{
                                            margin: '8px 0 0',
                                            fontSize: '12px',
                                            color: 'rgba(255,255,255,0.7)',
                                          }}
                                        >
                                          Đọc mã này khi gặp chủ nhà để check-in
                                        </p>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Cover */}
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
                                <td style={{ padding: '24px 32px 8px' }}>
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

                        {/* Stay info */}
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: '16px 32px' }}>
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
                                  Thông tin lưu trú
                                </p>
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellPadding={0}
                                  cellSpacing={0}
                                  border={0}
                                  style={{
                                    marginTop: '12px',
                                    backgroundColor: COLORS.cream,
                                    borderRadius: '8px',
                                    border: `1px solid ${COLORS.border}`,
                                  }}
                                >
                                  <tbody>
                                    <DetailRow
                                      label="Cơ sở"
                                      value={data.property.name}
                                    />
                                    <DetailRow
                                      label="Địa chỉ"
                                      value={data.property.address}
                                    />
                                    <DetailRow
                                      label="Nhận phòng"
                                      value={`${formatDate(data.checkInAt)} · từ ${data.checkInTime}`}
                                    />
                                    <DetailRow
                                      label="Trả phòng"
                                      value={`${formatDate(data.checkOutAt)} (${data.nights} đêm)`}
                                      last
                                    />
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Check-in instructions */}
                        {data.checkInInstructions && (
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
                                    Hướng dẫn check-in
                                  </p>
                                  <p
                                    style={{
                                      margin: '12px 0 0',
                                      padding: '14px 16px',
                                      backgroundColor: COLORS.creamAlt,
                                      borderLeft: `4px solid ${COLORS.gold}`,
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      lineHeight: 1.6,
                                      color: COLORS.ink,
                                    }}
                                  >
                                    {data.checkInInstructions}
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}

                        {/* Owner contact */}
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
                                  Liên hệ chủ nhà
                                </p>
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
                                      <td
                                        style={{
                                          fontSize: '14px',
                                          paddingBottom: '6px',
                                        }}
                                      >
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
                                    {data.owner.emergencyPhone && (
                                      <tr>
                                        <td
                                          style={{
                                            fontSize: '13px',
                                            color: COLORS.inkMuted,
                                          }}
                                        >
                                          Khẩn cấp ngoài giờ:{' '}
                                          <a
                                            href={`tel:${data.owner.emergencyPhone}`}
                                            style={{
                                              color: COLORS.navy,
                                              textDecoration: 'none',
                                              fontWeight: 600,
                                            }}
                                          >
                                            {data.owner.emergencyPhone}
                                          </a>
                                        </td>
                                      </tr>
                                    )}
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
                                      📍 Xem đường đi trên Google Maps
                                    </a>
                                  </p>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* House rules */}
                        {data.houseRules && (
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
                                    Quy định cơ sở
                                  </p>
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
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}

                        {/* CTA — chat */}
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
                              <td align="center" style={{ padding: '20px 32px' }}>
                                <a
                                  href={data.chatUrl}
                                  style={{
                                    display: 'inline-block',
                                    backgroundColor: '#ffffff',
                                    color: COLORS.navy,
                                    border: `1.5px solid ${COLORS.navy}`,
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    padding: '12px 28px',
                                    borderRadius: '8px',
                                  }}
                                >
                                  💬 Mở khung chat với chủ nhà
                                </a>
                                <p
                                  style={{
                                    margin: '10px 0 0',
                                    fontSize: '12px',
                                    color: COLORS.inkMuted,
                                  }}
                                >
                                  Hỏi đường đi · thay đổi giờ check-in · yêu cầu khác
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Responsibility */}
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
                                  Halong24h chỉ chịu trách nhiệm trung gian với giao
                                  dịch thực hiện qua khung chat hệ thống. Nếu phát
                                  sinh tranh chấp khi check-in, vui lòng giữ lại đoạn
                                  chat + bill chuyển khoản làm bằng chứng.
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

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <tr>
      <td
        style={{
          padding: '12px 16px',
          fontSize: '13px',
          color: COLORS.inkMuted,
          width: '40%',
          verticalAlign: 'top',
          borderBottom: last ? undefined : `1px solid ${COLORS.border}`,
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
          borderBottom: last ? undefined : `1px solid ${COLORS.border}`,
        }}
      >
        {value}
      </td>
    </tr>
  );
}
