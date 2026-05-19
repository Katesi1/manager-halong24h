import 'server-only';

import { API_BASE_URL, API_TIMEOUT_MS, DEFAULT_LOCALE } from './api-config';
import { ApiError, type ApiErrorPayload } from './api-error';
import { readTokens, writeTokens } from './token-storage';

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

interface RequestOptions {
  /** Skip Authorization header (cho các endpoint public). */
  skipAuth?: boolean;
  /** Skip auto-refresh trên 401. Dùng cho chính refresh endpoint để tránh vòng lặp. */
  skipRefresh?: boolean;
  /** Headers thêm. */
  headers?: Record<string, string>;
  /** Query params. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Body — nếu là FormData sẽ giữ nguyên, nếu object sẽ JSON.stringify. */
  body?: unknown;
  /** Locale i18n. */
  locale?: string;
  /** Next.js fetch cache options. */
  cache?: RequestCache;
  /** Next.js revalidate. */
  revalidate?: number | false;
  /** Tags để revalidateTag. */
  tags?: string[];
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function refreshTokens(refreshToken: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    throw new ApiError(res.status, 'Không thể làm mới phiên đăng nhập');
  }
  const json = (await res.json()) as ApiSuccess<{
    accessToken: string;
    refreshToken: string;
  }>;
  await writeTokens({
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken,
  });
}

function buildUrl(
  path: string,
  query?: RequestOptions['query'],
): string {
  const url = new URL(
    path.startsWith('http') ? path : `${API_BASE_URL}${path}`,
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function request<T>(
  method: Method,
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': opts.locale ?? DEFAULT_LOCALE,
    ...opts.headers,
  };

  let body: BodyInit | undefined;
  if (opts.body !== undefined && opts.body !== null) {
    if (opts.body instanceof FormData) {
      body = opts.body;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.body);
    }
  }

  if (!opts.skipAuth) {
    const { accessToken } = await readTokens();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body,
      signal: ctrl.signal,
      cache: opts.cache,
      next:
        opts.revalidate !== undefined || opts.tags
          ? { revalidate: opts.revalidate, tags: opts.tags }
          : undefined,
    });
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 && !opts.skipAuth && !opts.skipRefresh) {
    const { refreshToken } = await readTokens();
    if (refreshToken) {
      try {
        await refreshTokens(refreshToken);
        return request<T>(method, path, { ...opts, skipRefresh: true });
      } catch {
        // Fall through to throw 401 below
      }
    }
  }

  if (!res.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await res.json()) as ApiErrorPayload;
    } catch {
      // Server không trả JSON
    }
    const message = payload?.message ?? `HTTP ${res.status}`;
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(
        `[api-client] ${method} ${path} → ${res.status} ${message}`,
        payload?.errors ? { errors: payload.errors } : '',
      );
    }
    throw new ApiError(res.status, message, payload);
  }

  const json = (await res.json()) as ApiSuccess<T>;
  return json.data;
}

export const apiClient = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PUT', path, { ...opts, body }),
  delete: <T = void>(path: string, opts?: RequestOptions) =>
    request<T>('DELETE', path, opts),
};

export type ApiClient = typeof apiClient;
