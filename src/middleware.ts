import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_ACCESS = 'h24h_access';
const COOKIE_REFRESH = 'h24h_refresh';
const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

interface RefreshResponse {
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

async function refreshAtBackend(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as RefreshResponse;
    const access =
      json.data?.accessToken ??
      json.data?.access_token ??
      json.accessToken;
    const refresh =
      json.data?.refreshToken ??
      json.data?.refresh_token ??
      json.refreshToken;
    if (!access || !refresh) return null;
    return { accessToken: access, refreshToken: refresh };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const publicPaths = ['/login', '/signup', '/forgot-password', '/legal'];
  if (
    publicPaths.some((p) => path.startsWith(p)) ||
    path.startsWith('/_next') ||
    path.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const access = request.cookies.get(COOKIE_ACCESS)?.value;
  const refresh = request.cookies.get(COOKIE_REFRESH)?.value;

  if (!access && !refresh) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  if (!access && refresh) {
    const pair = await refreshAtBackend(refresh);
    if (!pair) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', path);
      const response = NextResponse.redirect(url);
      response.cookies.delete(COOKIE_ACCESS);
      response.cookies.delete(COOKIE_REFRESH);
      return response;
    }

    const forwarded = new Headers(request.headers);
    const existingCookie = forwarded.get('cookie') ?? '';
    const merged = existingCookie
      .split(';')
      .map((c) => c.trim())
      .filter(
        (c) =>
          !c.startsWith(`${COOKIE_ACCESS}=`) &&
          !c.startsWith(`${COOKIE_REFRESH}=`),
      )
      .concat([
        `${COOKIE_ACCESS}=${pair.accessToken}`,
        `${COOKIE_REFRESH}=${pair.refreshToken}`,
      ])
      .join('; ');
    forwarded.set('cookie', merged);

    const response = NextResponse.next({ request: { headers: forwarded } });
    response.cookies.set(COOKIE_ACCESS, pair.accessToken, {
      ...COOKIE_OPTS,
      maxAge: ACCESS_MAX_AGE,
    });
    response.cookies.set(COOKIE_REFRESH, pair.refreshToken, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_MAX_AGE,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
