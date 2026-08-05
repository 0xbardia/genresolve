/**
 * Evidence Assist core service (discover / enrich_url).
 * No shell, no cookies, HTTP only.
 */

import { createHash, randomUUID } from "node:crypto";
import { getAssistConfig } from "./config";
import { circuitAllow, circuitFailure, circuitSuccess } from "./circuit";
import { cacheGet, cacheKey, cacheSet } from "./cache";
import {
  buildSnippet,
  extractTitle,
  hostFromUrl,
} from "./extract";
import { SafeFetchError, safeFetchUrl } from "./ssrfFetch";
import type {
  AssistRequest,
  AssistResponse,
  AssistSource,
} from "./types";

function walletHash(addr: string | null | undefined): string {
  if (!addr) return "anon";
  return createHash("sha256").update(addr.toLowerCase()).digest("hex").slice(0, 12);
}

function sourceId(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 12);
}

function whyForClaim(claim: string, host: string): string {
  const words = claim
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 4);
  if (words.length === 0) {
    return `Public page on ${host} for your review — not verified by GenResolve.`;
  }
  return `May relate to “${words.slice(0, 3).join(" ")}…” (${host}). Off-chain suggestion only.`;
}

async function fetchAsSource(
  url: string,
  claimText: string,
  cfg: ReturnType<typeof getAssistConfig>
): Promise<AssistSource> {
  const fetched = await safeFetchUrl(url, cfg);
  const isPlain =
    fetched.contentType.includes("text/plain") ||
    fetched.contentType.includes("application/json");
  const title = isPlain
    ? fetched.host
    : extractTitle(fetched.body) || fetched.host;
  const snippet = buildSnippet(fetched.body, isPlain);
  return {
    id: sourceId(fetched.finalUrl),
    url: fetched.finalUrl,
    title,
    host: fetched.host,
    snippet: snippet || "No text snippet extracted.",
    why: whyForClaim(claimText, fetched.host),
  };
}

interface ExaResult {
  url?: string;
  title?: string;
  text?: string;
  highlights?: string[];
}

async function exaSearch(
  claimText: string,
  limit: number,
  apiKey: string
): Promise<AssistSource[]> {
  if (!circuitAllow("exa")) {
    throw new Error("Assist unavailable (search provider circuit open)");
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: claimText.slice(0, 500),
        type: "auto",
        numResults: limit,
        contents: {
          text: { maxCharacters: 400 },
        },
      }),
    });
    if (!res.ok) {
      circuitFailure("exa");
      throw new Error(`Search API HTTP ${res.status}`);
    }
    const data = (await res.json()) as { results?: ExaResult[] };
    circuitSuccess("exa");
    const out: AssistSource[] = [];
    for (const r of data.results ?? []) {
      if (!r.url) continue;
      let host = "";
      try {
        host = new URL(r.url).hostname.toLowerCase();
      } catch {
        continue;
      }
      // Skip private-looking hosts without full SSRF (search results only metadata)
      if (host === "localhost" || host.endsWith(".local")) continue;
      const snippet =
        (r.highlights && r.highlights[0]) ||
        r.text?.slice(0, 400) ||
        "Search result — open the link to review.";
      out.push({
        id: sourceId(r.url),
        url: r.url,
        title: r.title?.slice(0, 200) || host,
        host,
        snippet: String(snippet).slice(0, 400),
        why: whyForClaim(claimText, host),
      });
    }
    return out;
  } catch (e) {
    circuitFailure("exa");
    throw e;
  } finally {
    clearTimeout(t);
  }
}

function dedupeSources(sources: AssistSource[], limit: number): AssistSource[] {
  const seen = new Set<string>();
  const out: AssistSource[] = [];
  for (const s of sources) {
    const key = s.url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    // Drop invalid
    if (!s.url.startsWith("http://") && !s.url.startsWith("https://")) continue;
    if (!s.host || !s.snippet) continue;
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

export class AssistServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = "AssistServiceError";
  }
}

export async function runEvidenceAssist(
  req: AssistRequest
): Promise<AssistResponse> {
  const cfg = getAssistConfig();
  if (!cfg.enabled) {
    throw new AssistServiceError(
      "Evidence Assist is disabled",
      503,
      "disabled"
    );
  }

  const claimText = (req.claimText ?? "").trim();
  if (claimText.length < cfg.claimMinLen) {
    throw new AssistServiceError(
      `Claim text must be at least ${cfg.claimMinLen} characters`,
      400,
      "validation"
    );
  }

  const mode = req.mode;
  if (mode !== "discover" && mode !== "enrich_url") {
    throw new AssistServiceError("Invalid mode", 400, "validation");
  }

  if (mode === "enrich_url" && !req.url?.trim()) {
    throw new AssistServiceError(
      "url is required for enrich_url mode",
      400,
      "validation"
    );
  }

  const limit = Math.min(
    5,
    Math.max(1, req.limit ?? cfg.maxSources)
  );

  const requestId = randomUUID();
  const key = cacheKey(claimText, mode, req.url);
  const cached = cacheGet(key);
  if (cached) {
    return {
      requestId,
      sources: cached.sources.slice(0, limit),
      warnings: cached.warnings,
      cached: true,
    };
  }

  const warnings: string[] = [];
  const sources: AssistSource[] = [];
  const started = Date.now();
  const deadline = started + cfg.timeoutMs;

  const remaining = () => Math.max(0, deadline - Date.now());

  try {
    if (mode === "enrich_url" && req.url) {
      if (remaining() < 500) {
        throw new AssistServiceError("Timed out", 504, "timeout");
      }
      try {
        sources.push(await fetchAsSource(req.url, claimText, cfg));
      } catch (e) {
        if (e instanceof SafeFetchError) {
          const msg =
            e.code === "timeout"
              ? "Timed out"
              : e.code === "bad_scheme" || e.code === "bad_url"
                ? "Unsupported URL type"
                : e.code === "private_ip" || e.code === "credentials"
                  ? "Unsupported URL type"
                  : e.message;
          throw new AssistServiceError(msg, 400, e.code);
        }
        throw e;
      }
    } else if (mode === "discover") {
      if (req.url?.trim()) {
        try {
          sources.push(await fetchAsSource(req.url.trim(), claimText, cfg));
        } catch (e) {
          warnings.push(
            e instanceof SafeFetchError
              ? `Could not enrich URL: ${e.message}`
              : "Could not enrich provided URL"
          );
        }
      }

      if (sources.length < limit) {
        if (!cfg.exaApiKey) {
          if (sources.length === 0) {
            throw new AssistServiceError(
              "Search is not configured (set ASSIST_EXA_API_KEY) and no URL was provided",
              501,
              "no_search"
            );
          }
          warnings.push(
            "Web search is not configured; only the provided URL was used."
          );
        } else if (remaining() > 1000) {
          try {
            const found = await exaSearch(
              claimText,
              limit - sources.length,
              cfg.exaApiKey
            );
            // Optionally light-verify first result via safe fetch for better snippets
            for (const s of found) {
              if (remaining() < 1500) {
                sources.push(s);
                continue;
              }
              try {
                // Prefer SSRF-checked fetch when time allows
                const enriched = await fetchAsSource(s.url, claimText, cfg);
                sources.push(enriched);
              } catch {
                // Keep search metadata only if host looks public
                sources.push(s);
                warnings.push(`Could not fully fetch ${s.host}; showing search snippet.`);
              }
            }
          } catch (e) {
            warnings.push(
              e instanceof Error
                ? `Search unavailable: ${e.message}`
                : "Search unavailable"
            );
            if (sources.length === 0) {
              throw new AssistServiceError(
                "Assist unavailable (try later)",
                503,
                "search_down"
              );
            }
          }
        }
      }
    }
  } catch (e) {
    if (e instanceof AssistServiceError) throw e;
    throw new AssistServiceError(
      e instanceof Error ? e.message : "Assist failed",
      500,
      "internal"
    );
  }

  const finalSources = dedupeSources(sources, limit);
  if (finalSources.length === 0) {
    throw new AssistServiceError("No sources found", 404, "empty");
  }

  const payload = {
    sources: finalSources,
    warnings,
  };
  cacheSet(key, payload, cfg.cacheTtlSec);

  return {
    requestId,
    ...payload,
    cached: false,
  };
}

export function logAssistEvent(fields: {
  requestId: string;
  ip: string;
  wallet?: string | null;
  latencyMs: number;
  sourceCount: number;
  errorClass?: string;
  mode: string;
}): void {
  const line = {
    msg: "evidence_assist",
    requestId: fields.requestId,
    client: fields.wallet ? `w:${walletHash(fields.wallet)}` : `ip:${fields.ip}`,
    latencyMs: fields.latencyMs,
    sourceCount: fields.sourceCount,
    errorClass: fields.errorClass ?? null,
    mode: fields.mode,
  };
  console.info(JSON.stringify(line));
}

export { hostFromUrl, walletHash };
