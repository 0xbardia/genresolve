/**
 * In-memory token/window rate limits + concurrency (single Node process).
 * Sufficient for MVP; replace with Redis for multi-instance production.
 */

interface WindowCounter {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowCounter>();
const concurrency = new Map<string, number>();
const dayWindows = new Map<string, WindowCounter>();

function bumpWindow(
  map: Map<string, WindowCounter>,
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  let e = map.get(key);
  if (!e || now >= e.resetAt) {
    e = { count: 0, resetAt: now + windowMs };
    map.set(key, e);
  }
  if (e.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((e.resetAt - now) / 1000)),
    };
  }
  e.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function checkIpRateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  return bumpWindow(windows, `ip:${ip}`, limit, windowMs);
}

export function checkDailyLimit(
  key: string,
  limit: number
): { ok: boolean; retryAfterSec: number } {
  const dayMs = 24 * 60 * 60 * 1000;
  return bumpWindow(dayWindows, `day:${key}`, limit, dayMs);
}

export function tryAcquireConcurrency(
  key: string,
  max: number
): boolean {
  const n = concurrency.get(key) ?? 0;
  if (n >= max) return false;
  concurrency.set(key, n + 1);
  return true;
}

export function releaseConcurrency(key: string): void {
  const n = concurrency.get(key) ?? 0;
  if (n <= 1) concurrency.delete(key);
  else concurrency.set(key, n - 1);
}

/** Test helpers */
export function rateLimitReset(): void {
  windows.clear();
  concurrency.clear();
  dayWindows.clear();
}
