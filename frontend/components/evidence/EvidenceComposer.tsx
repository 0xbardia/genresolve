"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MAX_EVIDENCE_LEN } from "@/lib/config/limits";
import { EvidenceMethodSwitch } from "./EvidenceMethodSwitch";
import { EvidenceManualPanel } from "./EvidenceManualPanel";
import { EvidenceResearchPanel } from "./EvidenceResearchPanel";
import { EvidenceDraftStrip } from "./EvidenceDraftStrip";
import {
  type EvidenceMethod,
  claimFingerprint,
  isAssistUiEnabled,
} from "./assistClient";

export function EvidenceComposer({
  evidence,
  onEvidenceChange,
  claimText,
  walletAddress,
  disabled,
  invalid,
  onBlur,
  errorMessage,
}: {
  evidence: string;
  onEvidenceChange: (v: string) => void;
  claimText: string;
  walletAddress?: string | null;
  disabled?: boolean;
  invalid?: boolean;
  onBlur?: () => void;
  errorMessage?: string | null;
}) {
  const assistUi = isAssistUiEnabled();
  const [method, setMethod] = useState<EvidenceMethod>("manual");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const helpId = useId();
  const errorId = useId();
  const fp = claimFingerprint(claimText);

  // Flag off or disable: force Manual so UI never looks stuck in Research.
  useEffect(() => {
    if (!assistUi) setMethod("manual");
  }, [assistUi]);

  const evidenceLen = evidence.length;
  const over = evidenceLen > MAX_EVIDENCE_LEN;

  const goManual = () => {
    setMethod("manual");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const describedBy = [
    helpId,
    invalid && errorMessage ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="field evidence-composer">
      <div className="label">
        <span>Evidence</span>
        <span className="label-hint flex items-center gap-2">
          Optional
          <span
            className={cn(
              "char-count tabular-nums",
              over && "text-[var(--false)] font-semibold"
            )}
            aria-live="polite"
          >
            {evidenceLen.toLocaleString()} / {MAX_EVIDENCE_LEN.toLocaleString()}
          </span>
        </span>
      </div>

      <p className="field-help -mt-0.5">
        Evidence is stored with your claim. Validators use this text and a few
        linked URLs—not the research tool itself.
      </p>

      {assistUi && (
        <EvidenceMethodSwitch
          method={method}
          onChange={setMethod}
          disabled={disabled}
        />
      )}

      {method === "manual" || !assistUi ? (
        <EvidenceManualPanel
          id="evidence"
          value={evidence}
          onChange={onEvidenceChange}
          onBlur={onBlur}
          disabled={disabled}
          invalid={invalid}
          helpId={helpId}
          describedBy={describedBy}
          textareaRef={textareaRef}
        />
      ) : (
        <EvidenceResearchPanel
          claimText={claimText}
          evidence={evidence}
          walletAddress={walletAddress}
          disabled={disabled}
          claimFingerprint={fp}
          onAppend={(next) => {
            onEvidenceChange(next);
            onBlur?.();
          }}
          onRequestManual={goManual}
        />
      )}

      {/* When in Research, show draft strip so appends stay visible */}
      {assistUi && method === "research" && (
        <EvidenceDraftStrip
          evidence={evidence}
          showEditCta
          onEditManual={goManual}
        />
      )}

      {invalid && errorMessage ? (
        <p id={errorId} className="field-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
