import { createHash } from "node:crypto";
import type { AssistResponse } from "./types";

interface CacheEntry {
  expires: number;
  value: Omit<AssistResponse, "requestId" | "cached">;
}

const store = new Map<string, CacheEntry>();

export function cacheKey(
  claimText: string,
  mode: string,
  url: string | undefined
): string {
  const h = createHash("sha256");
  h.update(claimText.trim().toLowerCase());
  h.update("|");
  h.update(mode);
  h.update("|");
  h.update((url ?? "").trim());
  return h.digest("hex");
}

export function cacheGet(
  key: string
): Omit<AssistResponse, "requestId" | "cached"> | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.expires) {
    store.delete(key);
    return null;
  }
  return e.value;
}

export function cacheSet(
  key: string,
  value: Omit<AssistResponse, "requestId" | "cached">,
  ttlSec: number
): void {
  // Simple bound to avoid unbounded growth in long-lived processes
  if (store.size > 500) {
    const first = store.keys().next().value;
    if (first) store.delete(first);
  }
  store.set(key, {
    expires: Date.now() + ttlSec * 1000,
    value,
  });
}

/** Test helper */
export function cacheClear(): void {
  store.clear();
}
