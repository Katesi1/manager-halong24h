import type { BookingTransitionData } from './types';

/**
 * 8 sub-template chuyển trạng thái booking (CONTRACTS §6).
 *
 * Mỗi transition có 2 phía (guest / host), share cùng `BookingTransitionData`
 * và cùng skeleton `TransitionShell`. Đây là email **giao dịch** (transactional)
 * nên footer chỉ liên hệ — KHÔNG có nút "Hủy đăng ký" (R15 marketing footer).
 *
 * Mapping:
 *   booking_request_guest          ← (none) → hold       · gửi cho khách
 *   booking_request_host           ← (none) → hold       · gửi cho chủ
 *   booking_hold_timeout_guest     ← hold → cancelled    · gửi cho khách
 *   booking_hold_timeout_host      ← hold → cancelled    · gửi cho chủ
 *   booking_deposit_timeout_guest  ← confirmed → cancelled · gửi cho khách
 *   booking_deposit_timeout_host   ← confirmed → cancelled · gửi cho chủ
 *   booking_completed_guest_review ← paid → completed    · gửi cho khách
 *   booking_completed_host_review  ← paid → completed    · gửi cho chủ
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
  amber: '#d97706',
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

function TransitionShell({
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
                          Halong24h · Hotline{' '}
                          <a
                            href="tel:0325992001"
                            style={{
                              color: COLORS.navy,
                              textDecoration: 'underline',
                            }}
                          >
                            0325 992 001
                          </a>{' '}
                          ·{' '}
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
                        <p
                          style={{
                            margin: '6px 0 0',
                            fontSize: '11px',
                            color: COLORS.inkMuted,
                          }}
                        >
                          Email giao dịch hệ thống — bạn nhận vì có booking trên
                          Halong24h.
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

function Heading({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </h1>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '12px 0 0',
        fontSize: '15px',
        lineHeight: 1.7,
        color: COLORS.ink,
      }}
    >
      {children}
    </p>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '16px 0 0',
        fontSize: '13px',
        color: COLORS.inkMuted,
        lineHeight: 1.6,
      }}
    >
      {children}
    </p>
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

function BookingFacts({ data }: { data: BookingTransitionData }) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{
        marginTop: '20px',
        backgroundColor: COLORS.cream,
        borderRadius: '8px',
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <tbody>
        <tr>
          <td
            style={{
              padding: '12px 16px',
              fontSize: '12px',
              color: COLORS.inkMuted,
            }}
          >
            Mã booking
          </td>
          <td
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              color: COLORS.ink,
              fontWeight: 600,
              fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
              textAlign: 'right',
            }}
          >
            {data.bookingCode}
          </td>
        </tr>
        <tr>
          <td
            style={{
              padding: '12px 16px',
              fontSize: '12px',
              color: COLORS.inkMuted,
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            Cơ sở
          </td>
          <td
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              color: COLORS.ink,
              fontWeight: 600,
              textAlign: 'right',
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            {data.propertyName}
          </td>
        </tr>
        <tr>
          <td
            style={{
              padding: '12px 16px',
              fontSize: '12px',
              color: COLORS.inkMuted,
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            Nhận phòng
          </td>
          <td
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              color: COLORS.ink,
              fontWeight: 600,
              textAlign: 'right',
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            {formatDate(data.checkIn)}
          </td>
        </tr>
        <tr>
          <td
            style={{
              padding: '12px 16px',
              fontSize: '12px',
              color: COLORS.inkMuted,
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            Trả phòng
          </td>
          <td
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              color: COLORS.ink,
              fontWeight: 600,
              textAlign: 'right',
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            {formatDate(data.checkOut)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ─────────────────────────────────────────────────────────
// (none) → hold
// ─────────────────────────────────────────────────────────

export function BookingRequestGuestEmail({
  data,
}: {
  data: BookingTransitionData;
}) {
  return (
    <TransitionShell
      title="Đã gửi yêu cầu đặt phòng"
      bannerColor={COLORS.navy}
      bannerText="• Đã gửi yêu cầu đặt phòng"
    >
      <Heading>Chào {data.guestName},</Heading>
      <Body>
        Yêu cầu đặt phòng <strong>{data.bookingCode}</strong> tại{' '}
        <strong>{data.propertyName}</strong> đã được gửi tới chủ nhà{' '}
        <strong>{data.hostName}</strong>. Chủ sẽ phản hồi{' '}
        <strong>trong vòng 24 giờ</strong>.
      </Body>
      <BookingFacts data={data} />
      <Hint>
        Nếu chủ không duyệt trong 24h, yêu cầu sẽ tự huỷ và bạn không bị trừ
        tiền. Bạn cũng có thể vào khung chat để liên hệ trực tiếp.
      </Hint>
      {data.ctaUrl && <PrimaryCta href={data.ctaUrl} label="Vào khung chat" />}
    </TransitionShell>
  );
}

export function BookingRequestHostEmail({
  data,
}: {
  data: BookingTransitionData;
}) {
  return (
    <TransitionShell
      title="Có yêu cầu booking mới"
      bannerColor={COLORS.gold}
      bannerText="• Yêu cầu booking mới"
    >
      <Heading>Chào {data.hostName},</Heading>
      <Body>
        Bạn vừa nhận được yêu cầu đặt phòng mới từ khách{' '}
        <strong>{data.guestName}</strong> tại cơ sở{' '}
        <strong>{data.propertyName}</strong>. Vui lòng{' '}
        <strong>duyệt trong 24 giờ</strong> — nếu không, hệ thống sẽ tự huỷ.
      </Body>
      <BookingFacts data={data} />
      <Hint>
        Khi duyệt, hệ thống sẽ gửi email cho khách kèm STK + VietQR + memo{' '}
        <strong>HL24H-{data.bookingCode}</strong> để khách cọc 50%.
      </Hint>
      {data.ctaUrl && (
        <PrimaryCta href={data.ctaUrl} label="Vào duyệt yêu cầu" />
      )}
    </TransitionShell>
  );
}

// ─────────────────────────────────────────────────────────
// hold → cancelled (24h timeout duyệt)
// ─────────────────────────────────────────────────────────

export function BookingHoldTimeoutGuestEmail({
  data,
}: {
  data: BookingTransitionData;
}) {
  return (
    <TransitionShell
      title="Yêu cầu hết hạn"
      bannerColor={COLORS.rose}
      bannerText="• Yêu cầu đã hết hạn"
    >
      <Heading>Chào {data.guestName},</Heading>
      <Body>
        Rất tiếc — chủ nhà chưa kịp phản hồi yêu cầu{' '}
        <strong>{data.bookingCode}</strong> trong 24 giờ. Yêu cầu đã tự huỷ và
        bạn không bị trừ bất kỳ khoản nào.
      </Body>
      <BookingFacts data={data} />
      <Hint>
        Halong24h gợi ý bạn tìm những cơ sở khác trong khu vực Bãi Cháy — có
        nhiều lựa chọn cùng tầm giá đang trống đúng ngày bạn cần.
      </Hint>
      <PrimaryCta
        href="https://halong24h.com/search"
        label="Tìm phòng khác"
      />
    </TransitionShell>
  );
}

export function BookingHoldTimeoutHostEmail({
  data,
}: {
  data: BookingTransitionData;
}) {
  return (
    <TransitionShell
      title="Yêu cầu tự huỷ do quá hạn duyệt"
      bannerColor={COLORS.amber}
      bannerText="⚠ Tự huỷ do quá hạn duyệt"
    >
      <Heading>Chào {data.hostName},</Heading>
      <Body>
        Yêu cầu đặt phòng <strong>{data.bookingCode}</strong> của khách{' '}
        <strong>{data.guestName}</strong> tại{' '}
        <strong>{data.propertyName}</strong> đã tự huỷ vì bạn chưa duyệt trong
        24 giờ. Slot phòng đã được trả về trạng thái trống.
      </Body>
      <BookingFacts data={data} />
      <Hint>
        Tỉ lệ phản hồi nhanh giúp xếp hạng cơ sở của bạn tốt hơn. Bật thông báo
        đẩy / email để không bỏ lỡ yêu cầu booking trong tương lai.
      </Hint>
    </TransitionShell>
  );
}

// ─────────────────────────────────────────────────────────
// confirmed → cancelled (24h timeout cọc)
// ─────────────────────────────────────────────────────────

export function BookingDepositTimeoutGuestEmail({
  data,
}: {
  data: BookingTransitionData;
}) {
  return (
    <TransitionShell
      title="Tự huỷ do chưa cọc"
      bannerColor={COLORS.rose}
      bannerText="• Đã huỷ do chưa cọc"
    >
      <Heading>Chào {data.guestName},</Heading>
      <Body>
        Booking <strong>{data.bookingCode}</strong> đã tự huỷ vì hệ thống chưa
        ghi nhận khoản cọc{' '}
        <strong style={{ color: COLORS.navy }}>
          {formatVND(data.depositAmount)}
        </strong>{' '}
        trong 24 giờ kể từ khi chủ nhà xác nhận.
      </Body>
      <BookingFacts data={data} />
      <Hint>
        Nếu bạn vừa chuyển khoản và chưa thấy cập nhật, vui lòng upload ảnh
        bill vào khung chat để chủ nhà đối soát. Nếu chưa kịp chuyển, bạn có
        thể đặt lại — slot đã mở.
      </Hint>
      <PrimaryCta
        href="https://halong24h.com/search"
        label="Đặt lại / Tìm phòng khác"
      />
    </TransitionShell>
  );
}

export function BookingDepositTimeoutHostEmail({
  data,
}: {
  data: BookingTransitionData;
}) {
  return (
    <TransitionShell
      title="Khách không cọc · slot mở lại"
      bannerColor={COLORS.amber}
      bannerText="⚠ Khách không cọc · slot mở lại"
    >
      <Heading>Chào {data.hostName},</Heading>
      <Body>
        Khách <strong>{data.guestName}</strong> không hoàn tất cọc{' '}
        <strong>{formatVND(data.depositAmount)}</strong> cho booking{' '}
        <strong>{data.bookingCode}</strong> trong 24 giờ. Hệ thống đã huỷ tự
        động và mở lại slot phòng để bạn nhận khách mới.
      </Body>
      <BookingFacts data={data} />
      <Hint>
        Bạn không cần làm gì thêm. Nếu khách vẫn liên hệ qua khung chat, có
        thể tạo booking mới với cùng dải ngày.
      </Hint>
    </TransitionShell>
  );
}

// ─────────────────────────────────────────────────────────
// paid → completed (sau check-out)
// ─────────────────────────────────────────────────────────

export function BookingCompletedGuestReviewEmail({
  data,
}: {
  data: BookingTransitionData;
}) {
  return (
    <TransitionShell
      title="Trải nghiệm thế nào? Đánh giá ngay"
      bannerColor={COLORS.emerald}
      bannerText="✓ Đã check-out · Mời đánh giá"
    >
      <Heading>Chào {data.guestName},</Heading>
      <Body>
        Cảm ơn bạn đã ở tại <strong>{data.propertyName}</strong>. Trải nghiệm
        có như mong đợi không? Đánh giá của bạn giúp khách sau chọn được phòng
        phù hợp — và giúp chủ nhà cải thiện chất lượng.
      </Body>
      <BookingFacts data={data} />
      <Hint>
        Bạn có 14 ngày kể từ khi check-out để gửi đánh giá. Halong24h hiển thị
        cả review tốt và chưa tốt — review trung thực được khuyến khích.
      </Hint>
      <PrimaryCta
        href={data.ctaUrl ?? 'https://halong24h.com/account/reviews'}
        label="Viết đánh giá ngay"
      />
    </TransitionShell>
  );
}

export function BookingCompletedHostReviewEmail({
  data,
}: {
  data: BookingTransitionData;
}) {
  return (
    <TransitionShell
      title="Khách đã check-out — mời đánh giá khách"
      bannerColor={COLORS.emerald}
      bannerText="✓ Khách đã check-out · Mời đánh giá"
    >
      <Heading>Chào {data.hostName},</Heading>
      <Body>
        Khách <strong>{data.guestName}</strong> vừa hoàn tất chuyến ở tại{' '}
        <strong>{data.propertyName}</strong>. Hãy đánh giá khách để xây dựng
        cộng đồng host-guest minh bạch trên Halong24h.
      </Body>
      <BookingFacts data={data} />
      <Hint>
        Rating khách (sạch sẽ · đúng giờ · tôn trọng quy định) sẽ hiển thị cho
        các chủ nhà khác. Đánh giá trung thực giúp lọc khách scam / no-show
        cho cả hệ thống.
      </Hint>
      <PrimaryCta
        href={data.ctaUrl ?? 'https://manager.halong24h.com/host/bookings'}
        label="Đánh giá khách"
      />
    </TransitionShell>
  );
}
