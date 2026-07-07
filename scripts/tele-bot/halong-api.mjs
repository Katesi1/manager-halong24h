/**
 * HTTP client tối giản cho BE api.halong24h.com — dùng riêng cho bot Telegram.
 *
 * - Login bằng email/password → giữ accessToken (15') + refreshToken (14d) in-memory.
 * - Gặp 401 → thử refresh → retry 1 lần. Refresh fail (403 = phiên bị đá) → login lại.
 * - Response envelope { success, message, data } → unwrap trả thẳng `data`.
 *
 * LƯU Ý: BE giới hạn 1 phiên web / tài khoản (spec §1.6.1). Bot login sẽ ĐÁ
 * phiên web đang đăng nhập của cùng tài khoản → dùng tài khoản riêng cho bot.
 */

const TIMEOUT_MS = 15_000;

export class HalongApi {
  /**
   * @param {{ baseUrl: string, email: string, password: string }} cfg
   */
  constructor(cfg) {
    this.baseUrl = cfg.baseUrl.replace(/\/$/, '');
    this.email = cfg.email;
    this.password = cfg.password;
    this.accessToken = null;
    this.refreshToken = null;
  }

  async #request(method, path, { body, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(this.baseUrl + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      let json = null;
      try {
        json = await res.json();
      } catch {
        // body không phải JSON — giữ null
      }
      return { status: res.status, json };
    } finally {
      clearTimeout(timer);
    }
  }

  async login() {
    const { status, json } = await this.#request('POST', '/auth/login', {
      body: { email: this.email, password: this.password },
      auth: false,
    });
    if (status !== 200 && status !== 201) {
      throw new Error(
        `Login thất bại (${status}): ${json?.message ?? 'không rõ lỗi'}`,
      );
    }
    const data = json?.data ?? json;
    if (!data?.accessToken) throw new Error('Login không trả accessToken');
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken ?? null;
  }

  async #refresh() {
    if (!this.refreshToken) return false;
    const { status, json } = await this.#request('POST', '/auth/refresh', {
      body: { refreshToken: this.refreshToken },
      auth: false,
    });
    if (status !== 200 && status !== 201) return false; // 403 = phiên bị đá
    const data = json?.data ?? json;
    if (!data?.accessToken) return false;
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken ?? this.refreshToken;
    return true;
  }

  /**
   * GET có unwrap envelope + tự xử lý hết hạn token.
   * Throw Error có thuộc tính `.status` để caller phân biệt 403 (thiếu quyền).
   */
  async get(path) {
    if (!this.accessToken) await this.login();
    let { status, json } = await this.#request('GET', path);

    if (status === 401) {
      const refreshed = await this.#refresh();
      if (!refreshed) await this.login();
      ({ status, json } = await this.#request('GET', path));
    }

    if (status < 200 || status >= 300) {
      const err = new Error(
        `GET ${path} → ${status}: ${json?.message ?? 'không rõ lỗi'}`,
      );
      err.status = status;
      throw err;
    }
    return json?.data ?? json;
  }
}
