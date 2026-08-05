/** Simple circuit breaker for external providers. */

interface BreakerState {
  failures: number;
  openUntil: number;
}

const breakers = new Map<string, BreakerState>();

const FAILURE_THRESHOLD = 5;
const OPEN_MS = 60_000;

export function circuitAllow(name: string): boolean {
  const b = breakers.get(name);
  if (!b) return true;
  if (Date.now() < b.openUntil) return false;
  return true;
}

export function circuitSuccess(name: string): void {
  breakers.delete(name);
}

export function circuitFailure(name: string): void {
  const b = breakers.get(name) ?? { failures: 0, openUntil: 0 };
  b.failures += 1;
  if (b.failures >= FAILURE_THRESHOLD) {
    b.openUntil = Date.now() + OPEN_MS;
    b.failures = 0;
  }
  breakers.set(name, b);
}

export function circuitReset(): void {
  breakers.clear();
}
