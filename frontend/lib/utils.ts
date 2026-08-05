import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shorten 0x address for display */
export function shortAddress(address: string | null | undefined, chars = 4): string {
  if (!address) return "—";
  if (address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

/**
 * Human-readable timestamp for lists/detail.
 * Accepts ISO-8601 (contract) or numeric unix seconds/ms. Falls back to raw string.
 */
export function formatDisplayDate(
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined || value === "") return "—";

  let date: Date;
  if (typeof value === "number") {
    date = new Date(value > 1e12 ? value : value * 1000);
  } else {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      date = new Date(n > 1e12 ? n : n * 1000);
    } else {
      date = new Date(trimmed);
    }
  }

  if (Number.isNaN(date.getTime())) return String(value);

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

/** Parse user-entered GEN amount to wei (bigint). Empty → 0n */
export function parseGenToWei(amount: string): bigint {
  const trimmed = amount.trim();
  if (!trimmed || trimmed === "0") return BigInt(0);
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Stake must be a non-negative number");
  }
  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = (frac + "000000000000000000").slice(0, 18);
  return BigInt(whole || "0") * BigInt(10 ** 18) + BigInt(fracPadded || "0");
}

/** Format wei bigint to GEN string (up to 6 decimals for UI) */
export function formatWeiToGen(wei: bigint | number | string | undefined): string {
  try {
    const v = BigInt(wei ?? 0);
    const whole = v / BigInt(10 ** 18);
    const frac = v % BigInt(10 ** 18);
    if (frac === BigInt(0)) return whole.toString();
    const fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
    return `${whole}.${fracStr.slice(0, 6)}`;
  } catch {
    return "0";
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong";
}
