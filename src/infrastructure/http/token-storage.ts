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

export async function writeTokens(pair: TokenPair): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_ACCESS_TOKEN, pair.accessToken, {
    ...COMMON_COOKIE_OPTS,
    maxAge: ACCESS_TOKEN_MAX_AGE_SEC,
  });
  store.set(COOKIE_REFRESH_TOKEN, pair.refreshToken, {
    ...COMMON_COOKIE_OPTS,
    maxAge: REFRESH_TOKEN_MAX_AGE_SEC,
  });
}

export async function clearTokens(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_ACCESS_TOKEN);
  store.delete(COOKIE_REFRESH_TOKEN);
}
