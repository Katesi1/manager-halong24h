if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL chưa được cấu hình trong .env');
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const API_TIMEOUT_MS = 15_000;

export const COOKIE_ACCESS_TOKEN = 'h24h_access';
export const COOKIE_REFRESH_TOKEN = 'h24h_refresh';

export const ACCESS_TOKEN_MAX_AGE_SEC = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 days

export const DEFAULT_LOCALE = 'vi';
