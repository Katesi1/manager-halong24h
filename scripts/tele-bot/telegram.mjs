/**
 * Gửi tin nhắn Telegram qua Bot API — sendMessage, parse_mode HTML.
 * Gửi tuần tự có delay để tránh rate-limit; 429 → chờ retry_after rồi gửi lại.
 */

const SEND_GAP_MS = 400;
const MAX_MESSAGE_LEN = 4096;

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class TelegramSender {
  /**
   * @param {{ botToken: string, chatId: string }} cfg
   *   chatId nhận 1 ID hoặc nhiều ID cách nhau bởi dấu phẩy — mỗi tin gửi tới
   *   tất cả chat trong danh sách (nhóm, kênh, hoặc nhiều chat cá nhân).
   */
  constructor(cfg) {
    this.url = `https://api.telegram.org/bot${cfg.botToken}/sendMessage`;
    this.chatIds = String(cfg.chatId)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async #sendTo(chatId, html) {
    const text =
      html.length > MAX_MESSAGE_LEN
        ? html.slice(0, MAX_MESSAGE_LEN - 1) + '…'
        : html;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });
      if (res.ok) return true;
      const json = await res.json().catch(() => null);
      if (res.status === 429) {
        const wait = (json?.parameters?.retry_after ?? 3) * 1000;
        console.warn(`[telegram] 429 — chờ ${wait}ms rồi gửi lại`);
        await sleep(wait);
        continue;
      }
      console.error(
        `[telegram] sendMessage → ${chatId} lỗi ${res.status}: ${json?.description ?? ''}`,
      );
      return false;
    }
    return false;
  }

  /** Gửi 1 tin HTML tới mọi chat trong danh sách. Trả true nếu ít nhất 1 chat nhận được. */
  async #sendOne(html) {
    let anyOk = false;
    for (const id of this.chatIds) {
      if (await this.#sendTo(id, html)) anyOk = true;
      if (this.chatIds.length > 1) await sleep(SEND_GAP_MS);
    }
    return anyOk;
  }

  /** Gửi lần lượt 1 mảng tin nhắn HTML (mỗi tin tới tất cả chat). Trả số tin gửi thành công. */
  async sendAll(messages) {
    let ok = 0;
    for (const msg of messages) {
      if (await this.#sendOne(msg)) ok++;
      await sleep(SEND_GAP_MS);
    }
    return ok;
  }
}
