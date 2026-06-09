import 'server-only';

import { cookies } from 'next/headers';

import {
  ACCESS_TOKEN_MAX_AGE_SEC,
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  REFRESH_TOKEN_MAX_AGE_SEC,
} from './api-config';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const COMMON_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export async function readTokens(): Promise<Partial<TokenPair>> {
  const store = await cookies();
  return {
    accessToken: store.get(COOKIE_ACCESS_TOKEN)?.value,
    refreshToken: store.get(COOKIE_REFRESH_TOKEN)?.value,
  };
}

/**
 * Returns `true` nếu ghi cookie thành công, `false` nếu bị block bởi RSC context.
 * Caller PHẢI xử lý case `false`: dùng token trả về trực tiếp cho retry, không
 * dựa vào readTokens() (cookie chưa được ghi). Tránh module-level cache vì
 * serverless reuse instance giữa user → cross-user token leak.
 */
export async function writeTokens(pair: TokenPair): Promise<boolean> {
  const store = await cookies();
  try {
    store.set(COOKIE_ACCESS_TOKEN, pair.accessToken, {
      ...COMMON_COOKIE_OPTS,
      maxAge: ACCESS_TOKEN_MAX_AGE_SEC,
    });
    store.set(COOKIE_REFRESH_TOKEN, pair.refreshToken, {
      ...COMMON_COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_MAX_AGE_SEC,
    });
    return true;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[token-storage] cookies().set() blocked (likely RSC context). Caller must pass fresh tokens explicitly. Move auth-mutating call to Server Action or Route Handler for persistence.',
        err,
      );
    }
    return false;
  }
}

export async function clearTokens(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_ACCESS_TOKEN);
  store.delete(COOKIE_REFRESH_TOKEN);
}
