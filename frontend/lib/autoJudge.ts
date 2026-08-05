/** Session flag so create → detail can auto-start judgment once. */

function key(claimId: number): string {
  return `genresolve_auto_judge_${claimId}`;
}

/** Call after successful create when navigating to claim detail. */
export function flagAutoJudge(claimId: number): void {
  try {
    sessionStorage.setItem(key(claimId), "1");
  } catch {
    // private mode / SSR — query param is the fallback
  }
}

/** Returns true once, then clears. Safe on SSR (false). */
export function consumeAutoJudge(claimId: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    const k = key(claimId);
    if (sessionStorage.getItem(k) === "1") {
      sessionStorage.removeItem(k);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
