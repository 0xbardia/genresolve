/**
 * Frontend-only helpers for Evidence Assist UI (no server changes).
 */

import type { AssistSource } from "@/lib/evidence-assist/types";
import { MAX_EVIDENCE_LEN } from "@/lib/config/limits";

export type EvidenceMethod = "manual" | "research";
export type AssistApiMode = "discover" | "enrich_url";
export type ResearchPhase = "idle" | "loading" | "results" | "empty" | "error";

export function mapAssistError(
  status: number,
  code?: string,
  message?: string
): string {
  if (status === 429) return "Too many research requests. Try again later.";
  if (status === 501 || code === "no_search") {
    return "Research unavailable right now. You can still add evidence manually.";
  }
  if (status === 504 || code === "timeout") {
    return "Timed out. Try again or enter evidence manually.";
  }
  if (status === 404 || code === "empty") {
    return "No sources found. Try refining the claim or add evidence manually.";
  }
  if (
    code === "bad_scheme" ||
    code === "bad_url" ||
    code === "private_ip" ||
    code === "credentials"
  ) {
    return "That link type isn’t supported.";
  }
  if (status === 503 || code === "disabled" || code === "search_down") {
    return "Research unavailable right now. You can still add evidence manually.";
  }
  return message || "Research unavailable right now. You can still add evidence manually.";
}

export function formatEvidenceLine(s: AssistSource): string {
  const note = (s.title || s.snippet || s.host)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return `[${s.url}] — ${note} (${s.host})`;
}

export function buildAppendedEvidence(
  current: string,
  chosen: AssistSource[]
): { ok: true; next: string } | { ok: false; error: string } {
  if (!chosen.length) {
    return { ok: false, error: "Select at least one source." };
  }
  const block = chosen.map(formatEvidenceLine).join("\n");
  const sep = current.trim() ? "\n" : "";
  const next = `${current.trimEnd()}${sep}${block}\n`;
  if (next.length > MAX_EVIDENCE_LEN) {
    return {
      ok: false,
      error: `Adding these would exceed ${MAX_EVIDENCE_LEN.toLocaleString()} characters. Trim evidence or select fewer sources.`,
    };
  }
  return { ok: true, next };
}

export function firstUrlInText(text: string): string | undefined {
  const m = text.match(/https?:\/\/[^\s<>"')\]]+/i);
  return m?.[0];
}

export function claimFingerprint(claim: string): string {
  return claim.trim().toLowerCase().replace(/\s+/g, " ");
}

export function draftPreview(evidence: string, maxLines = 2): string {
  const lines = evidence
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return "";
  const shown = lines.slice(0, maxLines);
  const more = lines.length > maxLines ? ` (+${lines.length - maxLines} more)` : "";
  return shown.join(" · ") + more;
}

export function isAssistUiEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_EVIDENCE_ASSIST === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_EVIDENCE_ASSIST === "1"
  );
}
