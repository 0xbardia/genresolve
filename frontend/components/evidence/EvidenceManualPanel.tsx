"use client";

import type { RefObject } from "react";
import { cn } from "@/lib/utils";
import { MAX_EVIDENCE_LEN } from "@/lib/config/limits";

export function EvidenceManualPanel({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  helpId,
  describedBy,
  textareaRef,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  helpId: string;
  describedBy?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div className="space-y-2">
      <textarea
        ref={textareaRef}
        id={id}
        className={cn(
          "textarea min-h-[96px]",
          invalid && "border-[var(--false)]"
        )}
        placeholder="Add notes or https://… links that support the claim"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        maxLength={MAX_EVIDENCE_LEN}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <p id={helpId} className="field-help">
        Keep it concise. Up to {MAX_EVIDENCE_LEN.toLocaleString()} characters.
        Judgment may fetch a few public links.
      </p>
    </div>
  );
}
