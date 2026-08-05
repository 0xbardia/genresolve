/**
 * SSRF-safe HTTP(S) fetch for Evidence Assist.
 * - http/https only
 * - no credentials in URL
 * - DNS resolve + private IP rejection
 * - limited redirects with re-validation
 * - content-type + body size limits
 * - no cookies forwarded
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { AssistConfig } from "./config";
import type { SafeFetchResult } from "./types";

export class SafeFetchError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "bad_url"
      | "bad_scheme"
      | "credentials"
      | "private_ip"
      | "host_blocked"
      | "timeout"
      | "too_large"
      | "bad_content_type"
      | "http_error"
      | "redirect"
      | "network"
  ) {
    super(message);
    this.name = "SafeFetchError";
  }
}

/** Exported for unit tests */
export function isPrivateOrReservedIp(ip: string): boolean {
  const raw = ip.trim().toLowerCase();
  if (!raw) return true;

  // IPv6
  if (raw.includes(":")) {
    if (raw === "::1") return true;
    if (raw === "::") return true;
    // Unique local fc00::/7, link-local fe80::/10
    if (raw.startsWith("fc") || raw.startsWith("fd")) return true;
    if (raw.startsWith("fe8") || raw.startsWith("fe9") || raw.startsWith("fea") || raw.startsWith("feb"))
      return true;
    // IPv4-mapped :ffff:x.x.x.x
    const mapped = raw.match(/:ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (mapped) return isPrivateOrReservedIp(mapped[1]);
    return false;
  }

  // IPv4
  const parts = raw.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true; // treat malformed as unsafe
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local / metadata often 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function assertNoCredentials(u: URL): void {
  if (u.username || u.password) {
    throw new SafeFetchError(
      "URLs with embedded credentials are not allowed",
      "credentials"
    );
  }
}

function assertScheme(u: URL): void {
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new SafeFetchError(
      `Unsupported URL scheme: ${u.protocol.replace(":", "")}`,
      "bad_scheme"
    );
  }
}

/** Validate URL string shape before network I/O. */
export function parseAndValidateUrlString(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed) throw new SafeFetchError("Empty URL", "bad_url");
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    throw new SafeFetchError("Invalid URL", "bad_url");
  }
  assertScheme(u);
  assertNoCredentials(u);
  if (!u.hostname) throw new SafeFetchError("URL missing hostname", "bad_url");
  // Block obvious non-host forms
  if (u.hostname === "localhost" || u.hostname.endsWith(".localhost")) {
    throw new SafeFetchError("Localhost is not allowed", "private_ip");
  }
  return u;
}

async function resolveAndCheckHost(
  hostname: string,
  allowedHosts: string[] | null
): Promise<void> {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (allowedHosts && allowedHosts.length > 0) {
    const ok = allowedHosts.some(
      (a) => host === a || host.endsWith(`.${a}`)
    );
    if (!ok) {
      throw new SafeFetchError(
        `Host not in allowlist: ${host}`,
        "host_blocked"
      );
    }
  }

  // If hostname is already an IP literal
  if (isIP(host)) {
    if (isPrivateOrReservedIp(host)) {
      throw new SafeFetchError(
        "Private or reserved IP addresses are not allowed",
        "private_ip"
      );
    }
    return;
  }

  let records: { address: string; family: number }[];
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new SafeFetchError(`DNS resolution failed for ${host}`, "network");
  }
  if (!records.length) {
    throw new SafeFetchError(`No DNS records for ${host}`, "network");
  }
  for (const r of records) {
    if (isPrivateOrReservedIp(r.address)) {
      throw new SafeFetchError(
        "Hostname resolves to a private or reserved address",
        "private_ip"
      );
    }
  }
}

function isTextContentType(ct: string | null): boolean {
  if (!ct) return false;
  const base = ct.split(";")[0].trim().toLowerCase();
  return (
    base.startsWith("text/") ||
    base === "application/json" ||
    base === "application/xml" ||
    base === "application/xhtml+xml" ||
    base === "application/atom+xml" ||
    base === "application/rss+xml" ||
    base === "application/ld+json"
  );
}

async function readBodyLimited(
  res: Response,
  maxBytes: number
): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      throw new SafeFetchError("Response body too large", "too_large");
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

/**
 * Safe fetch with SSRF controls. Does not forward cookies.
 */
export async function safeFetchUrl(
  rawUrl: string,
  cfg: Pick<
    AssistConfig,
    "perHostTimeoutMs" | "maxBodyBytes" | "maxRedirects" | "allowedHosts"
  >
): Promise<SafeFetchResult> {
  let current = parseAndValidateUrlString(rawUrl);
  await resolveAndCheckHost(current.hostname, cfg.allowedHosts);

  let redirects = 0;
  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      cfg.perHostTimeoutMs
    );

    let res: Response;
    try {
      res = await fetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,application/json;q=0.7,*/*;q=0.1",
          "User-Agent":
            "GenResolve-EvidenceAssist/1.0 (+https://genresolve.xyz; public research assist)",
          // Explicitly do not send cookies
        },
      });
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof Error && e.name === "AbortError") {
        throw new SafeFetchError("Fetch timed out", "timeout");
      }
      throw new SafeFetchError(
        e instanceof Error ? e.message : "Network error",
        "network"
      );
    } finally {
      clearTimeout(timer);
    }

    // Redirect handling
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) {
        throw new SafeFetchError("Redirect without Location", "redirect");
      }
      redirects += 1;
      if (redirects > cfg.maxRedirects) {
        throw new SafeFetchError("Too many redirects", "redirect");
      }
      let next: URL;
      try {
        next = new URL(loc, current);
      } catch {
        throw new SafeFetchError("Invalid redirect URL", "redirect");
      }
      assertScheme(next);
      assertNoCredentials(next);
      await resolveAndCheckHost(next.hostname, cfg.allowedHosts);
      current = next;
      continue;
    }

    if (!res.ok) {
      throw new SafeFetchError(
        `Upstream HTTP ${res.status}`,
        "http_error"
      );
    }

    const contentType = res.headers.get("content-type") || "";
    if (!isTextContentType(contentType)) {
      throw new SafeFetchError(
        `Unsupported content type: ${contentType || "unknown"}`,
        "bad_content_type"
      );
    }

    const body = await readBodyLimited(res, cfg.maxBodyBytes);
    return {
      finalUrl: current.toString(),
      host: current.hostname.toLowerCase(),
      contentType,
      body,
      status: res.status,
    };
  }
}
