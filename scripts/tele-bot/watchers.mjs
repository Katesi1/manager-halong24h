/**
 * Các watcher poll BE và sinh tin nhắn Telegram (HTML) khi có sự kiện mới.
 *
 * Mỗi watcher nhận (api, state) — mutate state của riêng nó và trả string[].
 * Lần chạy đầu (state chưa có) → seed im lặng, KHÔNG gửi (tránh dội cả lịch sử).
 * Watcher gặp 403 (tài khoản thiếu quyền admin) → tự tắt, cảnh báo 1 lần.
 */

import { escapeHtml as esc } from './telegram.mjs';

// ---------- format helpers ----------

function fmtMoney(n) {
  if (n == null) return 'Chưa chốt giá';
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' ₫';
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(d);
}

/** Chỉ ngày (DD/MM/YYYY) — dùng cho check-in/check-out. */
function fmtDay(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(d);
}

const truncate = (s, n) =>
  s && s.length > n ? s.slice(0, n - 1) + '…' : (s ?? '');

/** BE trả mảng trực tiếp hoặc { items: [] } — nhận cả hai. */
const asItems = (data) => (Array.isArray(data) ? data : (data?.items ?? []));

// ---------- 1. Notifications (/notifications) ----------

const NOTI_TYPE = {
  0: ['📅', 'Đặt phòng'],
  1: ['💰', 'Thanh toán'],
  2: ['⚙️', 'Hệ thống'],
  booking: ['📅', 'Đặt phòng'],
  payment: ['💰', 'Thanh toán'],
  system: ['⚙️', 'Hệ thống'],
};

export async function watchNotifications(api, state) {
  const list = asItems(await api.get('/notifications?limit=50'));
  const first = !state.notifications;
  const st = (state.notifications ??= { seen: [] });
  const seen = new Set(st.seen);

  const messages = [];
  for (const n of [...list].reverse()) {
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    if (first) continue;
    const [emoji, label] = NOTI_TYPE[n.type] ?? ['🔔', 'Thông báo'];
    const body = n.body ?? n.subtitle ?? '';
    messages.push(
      `${emoji} <b>${esc(n.title)}</b>` +
        (body ? `\n${esc(truncate(body, 300))}` : '') +
        `\n<i>${label} • ${fmtDate(n.createdAt)}</i>`,
    );
  }
  st.seen = [...seen].slice(-500);
  return messages;
}

// ---------- 2. Bookings (/bookings) — đơn mới + đổi trạng thái ----------

const BOOKING_STATUS = {
  0: ['⏳', 'Giữ chỗ (HOLD)'],
  1: ['✅', 'Đã xác nhận'],
  2: ['❌', 'Đã huỷ'],
  3: ['🏁', 'Hoàn thành'],
  4: ['🚫', 'Khách không đến'],
};

function bookingStatus(b) {
  if (b.paidAt != null && (b.status === 1 || b.status === 'confirmed')) {
    return ['💰', 'Đã thanh toán'];
  }
  return (
    BOOKING_STATUS[b.status] ?? ['ℹ️', String(b.status)]
  );
}

function nightsBetween(a, b) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  const n = Math.round(ms / 86_400_000);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function bookingLine(b) {
  const nights = b.nights ?? nightsBetween(b.checkinDate, b.checkoutDate) ?? '?';

  // Người đặt: BE có thể để null nếu khách đặt qua app → fallback rõ ràng.
  const guest = b.customerName ?? b.customer?.name;
  const guestPhone = b.customerPhone ?? b.customer?.phone;
  const guestLine = guest
    ? `👤 Khách: ${esc(guest)}${guestPhone ? ` — ${esc(guestPhone)}` : ''}`
    : b.customerId
      ? '👤 Khách: (đặt qua app — chưa có tên)'
      : '👤 Khách: —';

  // Chủ cơ sở (host/owner) — giúp biết đơn "của ai".
  const host = b.host ?? b.property?.owner ?? {};
  const hostLine = host.name
    ? `🏡 Chủ CS: ${esc(host.name)}${host.phone ? ` — ${esc(host.phone)}` : ''}`
    : '';

  // Số tiền: ưu tiên tổng đã chốt; nếu chưa chốt nhưng đã trả → hiện số đã trả.
  let moneyLine;
  if (b.totalAmount != null) {
    moneyLine = `💵 Tổng: ${fmtMoney(b.totalAmount)}`;
  } else if (b.paidAmount) {
    moneyLine = `💵 Đã trả: ${fmtMoney(b.paidAmount)} (chưa chốt tổng)`;
  } else {
    moneyLine = `💵 Tổng: Chưa chốt giá`;
  }

  return (
    `🧾 Mã đơn: <code>${esc(b.code ?? b.id ?? '')}</code>\n` +
    `🏠 ${esc(b.propertyName ?? b.property?.name ?? b.propertyId ?? '')}\n` +
    `${guestLine}\n` +
    (hostLine ? `${hostLine}\n` : '') +
    `📅 ${fmtDay(b.checkinDate)} → ${fmtDay(b.checkoutDate)}` +
    ` (${nights} đêm, ${b.guestCount ?? '?'} khách)\n` +
    moneyLine
  );
}

export async function watchBookings(api, state) {
  const list = asItems(await api.get('/bookings'));
  const first = !state.bookings;
  const st = (state.bookings ??= { statuses: {} });

  const messages = [];
  for (const b of list) {
    const [emoji, label] = bookingStatus(b);
    const key = `${b.status}|${b.paidAt != null}`;
    const prev = st.statuses[b.id];
    st.statuses[b.id] = key;
    if (first || prev === key) continue;
    if (prev === undefined) {
      messages.push(`🆕 <b>Đặt phòng mới</b> — ${emoji} ${label}\n${bookingLine(b)}`);
    } else {
      messages.push(`${emoji} <b>Đơn đổi trạng thái: ${label}</b>\n${bookingLine(b)}`);
    }
  }
  // Giữ state gọn: bỏ những booking BE không còn trả về (đơn cũ ngoài trang đầu)
  const liveIds = new Set(list.map((b) => b.id));
  for (const id of Object.keys(st.statuses)) {
    if (!liveIds.has(id)) delete st.statuses[id];
  }
  return messages;
}

// ---------- 3. Properties (/properties) — phòng/cơ sở mới + đổi duyệt ----------

const MODERATION = {
  pending: ['⏳', 'Chờ duyệt'],
  approved: ['✅', 'Đã duyệt'],
  rejected: ['❌', 'Bị từ chối'],
  suspended: ['🔒', 'Tạm ngưng'],
};

export async function watchProperties(api, state) {
  const list = asItems(await api.get('/properties?includeInactive=true'));
  const first = !state.properties;
  const st = (state.properties ??= { statuses: {} });

  const messages = [];
  for (const p of list) {
    const status = p.moderationStatus ?? 'approved';
    const prev = st.statuses[p.id];
    st.statuses[p.id] = status;
    if (first || prev === status) continue;
    const [emoji, label] = MODERATION[status] ?? ['🏠', status];
    const owner = p.ownerName ?? p.owner?.name ?? p.ownerId ?? '';
    const addr = p.address ?? p.city ?? '';
    const info =
      `🏠 ${esc(p.name ?? p.id)}` +
      (owner ? `\n👤 Chủ: ${esc(owner)}` : '') +
      (addr ? `\n📍 ${esc(truncate(addr, 120))}` : '');
    if (prev === undefined) {
      messages.push(`🆕 <b>Cơ sở mới được tạo</b> — ${emoji} ${label}\n${info}`);
    } else {
      messages.push(`${emoji} <b>Cơ sở đổi trạng thái: ${label}</b>\n${info}`);
    }
  }
  const liveIds = new Set(list.map((p) => p.id));
  for (const id of Object.keys(st.statuses)) {
    if (!liveIds.has(id)) delete st.statuses[id];
  }
  return messages;
}

// ---------- 4. Disputes (/admin/disputes) — ADMIN ----------

const DISPUTE_TYPE = {
  refund_request: 'Yêu cầu hoàn tiền',
  service_quality: 'Chất lượng dịch vụ',
  damage_claim: 'Bồi thường hư hại',
  no_show: 'Khách không đến',
  overbooking: 'Trùng đơn',
  other: 'Khác',
};

export async function watchDisputes(api, state) {
  const list = asItems(await api.get('/admin/disputes'));
  const first = !state.disputes;
  const st = (state.disputes ??= { seen: [] });
  const seen = new Set(st.seen);

  const messages = [];
  for (const d of list) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    if (first) continue;
    messages.push(
      `⚖️ <b>Khiếu nại mới</b> — ${esc(d.subject ?? '')}\n` +
        `Loại: ${DISPUTE_TYPE[d.type] ?? esc(d.type ?? '')}` +
        (d.amount != null ? ` • ${fmtMoney(d.amount)}` : '') +
        (d.openerName ? `\n👤 Người mở: ${esc(d.openerName)}` : '') +
        (d.description ? `\n${esc(truncate(d.description, 200))}` : ''),
    );
  }
  st.seen = [...seen].slice(-500);
  return messages;
}

// ---------- 4. KYC chờ duyệt (/admin/kyc/queue) — ADMIN ----------

export async function watchKyc(api, state) {
  const data = await api.get('/admin/kyc/queue?filter=pending&pageSize=50');
  const list = asItems(data);
  const first = !state.kyc;
  const st = (state.kyc ??= { seen: [] });
  const seen = new Set(st.seen);

  const messages = [];
  for (const k of list) {
    if (seen.has(k.id)) continue;
    seen.add(k.id);
    if (first) continue;
    const who =
      k.name ?? k.userName ?? k.fullName ?? k.user?.name ?? k.email ?? k.id;
    messages.push(
      `🪪 <b>KYC chờ duyệt</b>\n👤 ${esc(who)}` +
        (k.createdAt ? `\n<i>Nộp lúc ${fmtDate(k.createdAt)}</i>` : ''),
    );
  }
  st.seen = [...seen].slice(-500);
  return messages;
}

// ---------- 5. Phiên thanh toán chờ đối soát (/admin/payments) — ADMIN ----------

export async function watchPaymentSessions(api, state) {
  const list = asItems(await api.get('/admin/payments?status=pending&limit=50'));
  const first = !state.paymentSessions;
  const st = (state.paymentSessions ??= { seen: [] });
  const seen = new Set(st.seen);

  const messages = [];
  for (const s of list) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    if (first) continue;
    const who = s.userName ?? s.user?.name ?? s.userEmail ?? s.user?.email ?? '';
    messages.push(
      `💸 <b>Chuyển khoản chờ đối soát</b>\n` +
        `👤 ${esc(who)}` +
        (s.userEmail ?? s.user?.email ? ` — ${esc(s.userEmail ?? s.user?.email)}` : '') +
        `\nGói: ${esc(s.planLabel ?? s.planId ?? '')} • ${fmtMoney(s.totalAmount ?? s.amount)}` +
        `\nNội dung CK: <code>${esc(s.ckContent ?? s.transferContent ?? '')}</code>`,
    );
  }
  st.seen = [...seen].slice(-500);
  return messages;
}

// ---------- 6. Subscription quá hạn (/admin/subscriptions/count-overdue) ----------

export async function watchOverdueSubscriptions(api, state) {
  const data = await api.get('/admin/subscriptions/count-overdue');
  const count = typeof data === 'number' ? data : (data?.count ?? 0);
  const first = !state.overdue;
  const st = (state.overdue ??= { count: 0 });
  const prev = st.count;
  st.count = count;
  if (first || count <= prev) return [];
  return [
    `⚠️ <b>Subscription quá hạn tăng: ${count}</b> (trước đó ${prev})\n` +
      `Kiểm tra tại trang Gói cước chủ nhà.`,
  ];
}

// ---------- 7. Chủ nhà đăng ký mới (/users?role=1) — ADMIN ----------

export async function watchNewOwners(api, state) {
  const list = asItems(await api.get('/users?role=1'));
  const first = !state.newOwners;
  const st = (state.newOwners ??= { seen: [] });
  const seen = new Set(st.seen);

  const messages = [];
  for (const u of [...list].reverse()) {
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    if (first) continue;
    messages.push(
      `🆕 <b>Chủ nhà mới đăng ký</b>\n` +
        `👤 Tên: ${esc(u.name)}\n` +
        `📧 Email: ${esc(u.email ?? '—')}\n` +
        `📞 SĐT: ${esc(u.phone ?? '—')}\n` +
        `📅 Ngày tạo: ${fmtDate(u.createdAt)}`,
    );
  }
  st.seen = [...seen].slice(-500);
  return messages;
}

// ---------- registry ----------

export const WATCHERS = [
  { key: 'notifications', label: 'Thông báo hệ thống', run: watchNotifications },
  { key: 'bookings', label: 'Đặt phòng', run: watchBookings },
  { key: 'properties', label: 'Cơ sở/phòng', run: watchProperties },
  { key: 'disputes', label: 'Khiếu nại (admin)', run: watchDisputes },
  { key: 'kyc', label: 'KYC chờ duyệt (admin)', run: watchKyc },
  { key: 'paymentSessions', label: 'Đối soát CK (admin)', run: watchPaymentSessions },
  { key: 'overdue', label: 'Subscription quá hạn (admin)', run: watchOverdueSubscriptions },
  { key: 'newOwners', label: 'Chủ nhà mới đăng ký (admin)', run: watchNewOwners },
];

