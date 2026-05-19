export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E; fieldErrors?: Record<string, string[]> };

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data });

export const fail = <E>(
  error: E,
  fieldErrors?: Record<string, string[]>,
): Result<never, E> => ({ ok: false, error, fieldErrors });

export function isOk<T, E>(r: Result<T, E>): r is { ok: true; data: T } {
  return r.ok;
}
