"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AssistSource } from "@/lib/evidence-assist/types";
import { EvidenceSourceCard } from "./EvidenceSourceCard";
import { EvidenceTrustNote } from "./EvidenceTrustNote";
import {
  type AssistApiMode,
  type ResearchPhase,
  buildAppendedEvidence,
  firstUrlInText,
  mapAssistError,
} from "./assistClient";

export function EvidenceResearchPanel({
  claimText,
  evidence,
  walletAddress,
  disabled,
  claimFingerprint,
  onAppend,
  onRequestManual,
}: {
  claimText: string;
  evidence: string;
  walletAddress?: string | null;
  disabled?: boolean;
  /** When this changes after a successful fetch, results are stale. */
  claimFingerprint: string;
  onAppend: (nextEvidence: string) => void;
  onRequestManual: () => void;
}) {
  const abortRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<ResearchPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [sources, setSources] = useState<AssistSource[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [appendError, setAppendError] = useState<string | null>(null);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const canFind = claimText.trim().length >= 40 && !disabled;
  const stale =
    fetchedFor !== null &&
    sources.length > 0 &&
    fetchedFor !== claimFingerprint;
  const firstUrl = firstUrlInText(evidence);

  const runFetch = useCallback(
    async (mode: AssistApiMode, url?: string) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setPhase("loading");
      setError(null);
      setWarnings([]);
      setSources([]);
      setSelected(new Set());
      setAppendError(null);
      setSuccessNote(null);

      try {
        const res = await fetch("/api/evidence-assist", {
          method: "POST",
          signal: ac.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claimText,
            mode,
            url: url || undefined,
            limit: 3,
            walletAddress: walletAddress || undefined,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          code?: string;
          sources?: AssistSource[];
          warnings?: string[];
        };
        if (!res.ok) {
          setPhase("error");
          setError(mapAssistError(res.status, data.code, data.error));
          return;
        }
        const list = data.sources ?? [];
        setSources(list);
        setWarnings(data.warnings ?? []);
        setFetchedFor(claimFingerprint);
        if (mode === "enrich_url" && list[0]) {
          setSelected(new Set([list[0].id]));
        }
        if (list.length === 0) {
          setPhase("empty");
          setError(null);
        } else {
          setPhase("results");
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          setPhase("idle");
          return;
        }
        setPhase("error");
        setError(
          "Research unavailable right now. You can still add evidence manually."
        );
      }
    },
    [claimText, claimFingerprint, walletAddress]
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= 3) return prev;
        next.add(id);
      }
      return next;
    });
    setAppendError(null);
    setSuccessNote(null);
  };

  const handleAppend = () => {
    const chosen = sources.filter((s) => selected.has(s.id));
    const result = buildAppendedEvidence(evidence, chosen);
    if (!result.ok) {
      setAppendError(result.error);
      return;
    }
    onAppend(result.next);
    setSelected(new Set());
    setAppendError(null);
    setSuccessNote("Sources added. Review the evidence draft before submitting.");
    toast.message("Sources added to evidence", {
      description: "Review the draft in Manual before submitting.",
    });
    onRequestManual();
  };

  const claimPreview =
    claimText.trim().slice(0, 96) + (claimText.trim().length > 96 ? "…" : "");

  return (
    <div className="space-y-3">
      <EvidenceTrustNote />

      <div className="evidence-draft-strip px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
          Researching from your claim
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
          {claimPreview || "Write a claim of at least 40 characters to research."}
        </p>
      </div>

      <p className="field-help">
        Optional off-chain suggestions for your review. Nothing is added until
        you choose sources.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-secondary min-h-11"
          disabled={!canFind || phase === "loading"}
          onClick={() => void runFetch("discover")}
          title={
            canFind
              ? "Find public sources for review"
              : "Enter a claim of at least 40 characters first"
          }
        >
          {phase === "loading" ? (
            <>
              <span className="spinner" aria-hidden />
              Looking…
            </>
          ) : (
            "Find sources"
          )}
        </button>
        {firstUrl ? (
          <button
            type="button"
            className="btn btn-ghost min-h-11 text-[var(--violet-bright)]"
            disabled={!canFind || phase === "loading"}
            onClick={() => void runFetch("enrich_url", firstUrl)}
            aria-label={`Enrich first link ${firstUrl}`}
          >
            Enrich first link
          </button>
        ) : null}
      </div>

      {stale && (
        <p className="text-xs text-[var(--gold)]" role="status">
          Claim changed — research again for updated sources.
        </p>
      )}

      {phase === "loading" && (
        <div
          className="flex flex-col items-center gap-3 py-6"
          role="status"
          aria-live="polite"
        >
          <span className="spinner spinner-lg" aria-hidden />
          <p className="text-sm text-[var(--text-muted)]">
            Looking for public sources…
          </p>
          <button
            type="button"
            className="btn btn-secondary min-h-11"
            onClick={() => {
              abortRef.current?.abort();
              setPhase("idle");
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {phase === "error" && error && (
        <div className="space-y-2" role="alert">
          <p className="text-sm font-medium text-[var(--false)]">{error}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary min-h-11"
              onClick={() => void runFetch("discover")}
              disabled={!canFind}
            >
              Try again
            </button>
            <button
              type="button"
              className="btn btn-ghost min-h-11"
              onClick={onRequestManual}
            >
              Edit in Manual
            </button>
          </div>
        </div>
      )}

      {phase === "empty" && (
        <div className="space-y-2" role="status">
          <p className="text-sm text-[var(--text-muted)]">
            No sources found. Try refining the claim or add evidence manually.
          </p>
          <button
            type="button"
            className="btn btn-ghost min-h-11"
            onClick={onRequestManual}
          >
            Edit in Manual
          </button>
        </div>
      )}

      {phase === "idle" && !canFind && (
        <p className="text-xs text-[var(--text-faint)]">
          Enter a claim of at least 40 characters to enable research.
        </p>
      )}

      {phase === "results" && sources.length > 0 && (
        <div className="space-y-3">
          {warnings.length > 0 && (
            <ul className="text-xs text-[var(--gold)] space-y-1">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-[var(--text-muted)]">
            Select up to 3 sources
            {selected.size > 0 ? ` · ${selected.size} selected` : ""}
          </p>
          {selected.size > 0 && (
            <ul className="text-[11px] text-[var(--text-faint)] space-y-0.5 mono">
              {sources
                .filter((s) => selected.has(s.id))
                .map((s) => (
                  <li key={`prev-${s.id}`} className="truncate">
                    {s.host} — {s.title || "source"}
                  </li>
                ))}
            </ul>
          )}
          <ul className="space-y-2" role="list">
            {sources.map((s) => {
              const checked = selected.has(s.id);
              const disableMore = !checked && selected.size >= 3;
              return (
                <EvidenceSourceCard
                  key={s.id}
                  source={s}
                  checked={checked}
                  disabled={disableMore || stale}
                  onToggle={() => toggle(s.id)}
                />
              );
            })}
          </ul>
          {appendError && (
            <p className="text-sm text-[var(--false)]" role="alert">
              {appendError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn btn-secondary min-h-11"
              onClick={onRequestManual}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary min-h-11"
              onClick={handleAppend}
              disabled={selected.size === 0 || stale || disabled}
              title={
                selected.size === 0
                  ? "Select at least one source"
                  : stale
                    ? "Claim changed — research again"
                    : undefined
              }
            >
              Add selected to evidence
            </button>
          </div>
        </div>
      )}

      {successNote && phase !== "results" && (
        <p className="text-xs text-[var(--true)]" role="status">
          {successNote}
        </p>
      )}
    </div>
  );
}
