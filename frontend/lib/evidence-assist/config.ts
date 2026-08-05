/**
 * Evidence Assist configuration (server-only secrets never use NEXT_PUBLIC_).
 * Feature is OFF by default until security review.
 */

function envBool(key: string, defaultValue: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return defaultValue;
  return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes";
}

function envInt(key: string, defaultValue: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return defaultValue;
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultValue;
}

export function isEvidenceAssistEnabled(): boolean {
  return envBool("ENABLE_EVIDENCE_ASSIST", false);
}

/** Client-visible flag (must match server enablement for UX). */
export function isEvidenceAssistUiEnabled(): boolean {
  return envBool("NEXT_PUBLIC_ENABLE_EVIDENCE_ASSIST", false);
}

export function getAssistConfig() {
  const allowedHostsRaw = process.env.ASSIST_ALLOWED_HOSTS?.trim() ?? "";
  const allowedHosts = allowedHostsRaw
    ? allowedHostsRaw
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
    : null; // null = no host allowlist (still SSRF-safe)

  return {
    enabled: isEvidenceAssistEnabled(),
    maxSources: Math.min(5, Math.max(1, envInt("ASSIST_MAX_SOURCES", 3))),
    timeoutMs: envInt("ASSIST_TIMEOUT_MS", 20_000),
    perHostTimeoutMs: envInt("ASSIST_PER_HOST_TIMEOUT_MS", 8_000),
    cacheTtlSec: envInt("ASSIST_CACHE_TTL_SEC", 300),
    maxBodyBytes: envInt("ASSIST_MAX_BODY_BYTES", 256 * 1024),
    maxRedirects: 2,
    /** IP rate limit: requests per window */
    ipLimit: envInt("ASSIST_IP_LIMIT", 10),
    ipWindowMs: envInt("ASSIST_IP_WINDOW_MS", 10 * 60 * 1000),
    /** Wallet daily limit */
    walletDailyLimit: envInt("ASSIST_WALLET_DAILY_LIMIT", 20),
    /** Anonymous (no wallet) daily limit — stricter */
    anonDailyLimit: envInt("ASSIST_ANON_DAILY_LIMIT", 5),
    maxConcurrencyPerKey: envInt("ASSIST_MAX_CONCURRENCY", 2),
    claimMinLen: 20,
    claimUiMinLen: 40,
    allowedHosts,
    /** Optional Exa API key (server only). */
    exaApiKey: process.env.ASSIST_EXA_API_KEY?.trim() || "",
    /** Optional Jina prefix; default public reader */
    jinaReaderBase:
      process.env.ASSIST_JINA_READER_BASE?.trim() || "https://r.jina.ai/",
  };
}

export type AssistConfig = ReturnType<typeof getAssistConfig>;
