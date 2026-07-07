# Bot Telegram thông báo hệ thống — HaLong24h Manager

Service Node.js độc lập (không cần cài dependency — dùng `fetch` có sẵn của Node ≥ 18).
Đăng nhập backend `api.halong24h.com` bằng tài khoản riêng, poll định kỳ và đẩy
thông báo mới vào nhóm/kênh Telegram.

## Theo dõi những gì

| Nguồn | Endpoint | Nội dung gửi |
|---|---|---|
| Thông báo hệ thống | `GET /notifications` | Mọi notification (booking 📅 / payment 💰 / system ⚙️) |
| Đặt phòng | `GET /bookings` | Đơn mới 🆕 + đổi trạng thái (xác nhận ✅, huỷ ❌, thanh toán 💰, hoàn thành 🏁, no-show 🚫) |
| Cơ sở/phòng | `GET /properties?includeInactive=true` | Cơ sở mới tạo 🆕 + đổi trạng thái duyệt (duyệt ✅, từ chối ❌, tạm ngưng 🔒) |
| Khiếu nại *(ADMIN)* | `GET /admin/disputes` | Dispute mới ⚖️ |
| KYC *(ADMIN)* | `GET /admin/kyc/queue?filter=pending` | Hồ sơ KYC mới chờ duyệt 🪪 |
| Đối soát CK *(ADMIN)* | `GET /admin/payments?status=pending` | Phiên thanh toán mới chờ duyệt 💸 |
| Gói quá hạn *(ADMIN)* | `GET /admin/subscriptions/count-overdue` | Cảnh báo khi số subscription quá hạn tăng ⚠️ |

Tài khoản không phải ADMIN → 4 watcher admin tự tắt (log cảnh báo 1 lần), bot vẫn
chạy bình thường với notifications + bookings trong scope tài khoản đó.

## Cài đặt

1. **Tạo bot Telegram** (nếu chưa): nhắn `@BotFather` → `/newbot` → lấy token.
2. **Lấy Chat ID**: thêm bot vào nhóm → gửi 1 tin bất kỳ trong nhóm → mở
   `https://api.telegram.org/bot<TOKEN>/getUpdates` → đọc `chat.id` (nhóm là số âm).
3. **Tạo tài khoản BE riêng cho bot** — ⚠️ quan trọng: BE giới hạn **1 phiên web
   / tài khoản** (spec §1.6.1). Nếu bot dùng chung tài khoản admin đang đăng nhập
   web quản trị, hai bên sẽ đá phiên nhau liên tục. Tạo 1 tài khoản ADMIN riêng
   (hoặc chấp nhận thiếu cảnh báo admin nếu dùng role khác).
4. **Cấu hình**:

   ```bash
   cd scripts/tele-bot
   copy .env.example .env    # Windows (Linux/macOS: cp)
   # rồi điền HALONG_BOT_EMAIL / HALONG_BOT_PASSWORD / TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID
   ```

## Chạy

```bash
npm run tele-bot
# hoặc trực tiếp:
node scripts/tele-bot/bot.mjs
```

Chạy nền lâu dài bằng PM2 (khuyến nghị trên server):

```bash
pm2 start scripts/tele-bot/bot.mjs --name halong-tele-bot
pm2 save
```

## Cách hoạt động

- **Lần chạy đầu** chỉ ghi nhận hiện trạng vào `state.json` (cùng thư mục), **không
  gửi dội** toàn bộ lịch sử. Từ chu kỳ sau, chỉ item mới / trạng thái đổi mới được gửi.
- `state.json` được lưu sau mỗi chu kỳ → restart không gửi trùng. Muốn reset thì xoá file này
  (chu kỳ đầu sau reset sẽ seed lại im lặng).
- Token BE hết hạn (15 phút) → tự refresh; refresh bị từ chối (phiên bị đá) → tự login lại.
- Telegram rate-limit (429) → tự chờ `retry_after` rồi gửi lại; mỗi chu kỳ gửi tối đa
  `MAX_MESSAGES_PER_CYCLE` tin, phần dư gộp thành 1 dòng tóm tắt.
- Lỗi mạng / BE sập → log ra console, chu kỳ sau thử lại, bot không chết.
