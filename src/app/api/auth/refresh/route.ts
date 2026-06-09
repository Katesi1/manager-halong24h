import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import {
  ACCESS_TOKEN_MAX_AGE_SEC,
  API_BASE_URL,
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  REFRESH_TOKEN_MAX_AGE_SEC,
} from '@/infrastructure/http/api-config';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

interface RefreshResponseBody {
  success?: boolean;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
  };
  accessToken?: string;
  refreshToken?: string;
}

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(COOKIE_REFRESH_TOKEN)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: 'Không tìm thấy refresh token' },
      { status: 401 },
    );
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Không thể kết nối máy chủ' },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const response = NextResponse.json(
      { success: false, message: 'Phiên đăng nhập đã hết hạn' },
      { status: 401 },
    );
    response.cookies.delete(COOKIE_ACCESS_TOKEN);
    response.cookies.delete(COOKIE_REFRESH_TOKEN);
    return response;
  }

  const json = (await res.json()) as RefreshResponseBody;
  const accessToken =
    json.data?.accessToken ?? json.data?.access_token ?? json.accessToken;
  const newRefresh =
    json.data?.refreshToken ?? json.data?.refresh_token ?? json.refreshToken;

  if (!accessToken || !newRefresh) {
    return NextResponse.json(
      { success: false, message: 'Phản hồi refresh không hợp lệ' },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_ACCESS_TOKEN, accessToken, {
    ...COOKIE_OPTS,
    maxAge: ACCESS_TOKEN_MAX_AGE_SEC,
  });
  response.cookies.set(COOKIE_REFRESH_TOKEN, newRefresh, {
    ...COOKIE_OPTS,
    maxAge: REFRESH_TOKEN_MAX_AGE_SEC,
  });
  return response;
}
