/**
 * Bot Telegram thông báo hệ thống HaLong24h Manager.
 *
 * Chạy:  node scripts/tele-bot/bot.mjs   (hoặc `npm run tele-bot`)
 * Cấu hình: scripts/tele-bot/.env — xem .env.example
 *
 * Luồng: login BE → mỗi POLL_INTERVAL_SEC poll 6 nguồn (notifications, bookings,
 * disputes, KYC queue, payment sessions, overdue count) → diff với state.json →
 * gửi tin mới vào Telegram. Lần chạy đầu chỉ ghi nhận hiện trạng, không gửi dội.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HalongApi } from './halong-api.mjs';
import { TelegramSender } from './telegram.mjs';
import { WATCHERS } from './watchers.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));

// ---------- env ----------

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || line.trim().startsWith('#')) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
loadEnvFile(join(DIR, '.env'));

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`[bot] Thiếu biến môi trường ${name} — xem .env.example`);
    process.exit(1);
  }
  return v;
}

const config = {
  baseUrl: process.env.HALONG_API_BASE_URL ?? 'http://api.halong24h.com',
  email: requireEnv('HALONG_BOT_EMAIL'),
  password: requireEnv('HALONG_BOT_PASSWORD'),
  botToken: requireEnv('TELEGRAM_BOT_TOKEN'),
  chatId: requireEnv('TELEGRAM_CHAT_ID'),
  intervalSec: Math.max(10, Number(process.env.POLL_INTERVAL_SEC ?? 30)),
  maxPerCycle: Math.max(1, Number(process.env.MAX_MESSAGES_PER_CYCLE ?? 25)),
};

// ---------- state ----------

const STATE_FILE = process.env.STATE_FILE ?? join(DIR, 'state.json');

function loadState() {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn(`[bot] state.json hỏng, khởi tạo lại: ${e.message}`);
  }
  return {};
}

function saveState(state) {
  try {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error(`[bot] Không ghi được state.json: ${e.message}`);
  }
}

// ---------- main loop ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toLocaleTimeString('vi-VN');

async function main() {
  const api = new HalongApi(config);
  const telegram = new TelegramSender(config);
  const state = loadState();
  // Watcher bị 403 nhiều lần (tài khoản không phải ADMIN) → tắt hẳn
  const disabled = new Set();

  console.log(`[bot] Đăng nhập ${config.baseUrl} với ${config.email}…`);
  await api.login();
  console.log(`[bot] Đăng nhập OK. Poll mỗi ${config.intervalSec}s.`);

  await telegram.sendAll([
    `🤖 <b>Bot HaLong24h đã khởi động</b>\nTheo dõi: ${WATCHERS.map((w) => w.label).join(', ')}`,
  ]);

  let stopping = false;
  process.on('SIGINT', () => {
    stopping = true;
    console.log('\n[bot] Nhận SIGINT — lưu state rồi thoát…');
  });
  process.on('SIGTERM', () => {
    stopping = true;
  });

  while (!stopping) {
    const messages = [];

    for (const w of WATCHERS) {
      if (disabled.has(w.key)) continue;
      try {
        messages.push(...(await w.run(api, state)));
      } catch (e) {
        if (e.status === 403) {
          disabled.add(w.key);
          console.warn(
            `[bot] ${w.label}: tài khoản thiếu quyền (403) — tắt watcher này.`,
          );
        } else {
          console.error(`[bot] ${w.label} lỗi: ${e.message}`);
        }
      }
    }

    if (messages.length > 0) {
      let toSend = messages;
      if (messages.length > config.maxPerCycle) {
        toSend = [
          ...messages.slice(0, config.maxPerCycle),
          `📦 <i>…và ${messages.length - config.maxPerCycle} thông báo khác trong đợt này.</i>`,
        ];
      }
      const ok = await telegram.sendAll(toSend);
      console.log(`[bot] ${now()} — gửi ${ok}/${toSend.length} tin.`);
    }

    saveState(state);
    for (let i = 0; i < config.intervalSec && !stopping; i++) await sleep(1000);
  }

  saveState(state);
  console.log('[bot] Đã thoát.');
}

main().catch((e) => {
  console.error(`[bot] Lỗi nghiêm trọng: ${e.message}`);
  process.exit(1);
});
