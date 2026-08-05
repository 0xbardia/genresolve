"use client";

import { draftPreview } from "./assistClient";

export function EvidenceDraftStrip({
  evidence,
  onEditManual,
  showEditCta,
}: {
  evidence: string;
  onEditManual?: () => void;
  showEditCta?: boolean;
}) {
  if (!evidence.trim()) return null;
  const preview = draftPreview(evidence, 2);
  const lines = evidence.split("\n").filter((l) => l.trim()).length;

  return (
    <div className="evidence-draft-strip">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
            Current draft · {lines} line{lines === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)] line-clamp-2 break-words">
            {preview}
          </p>
        </div>
        {showEditCta && onEditManual ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm min-h-11 shrink-0 text-[var(--violet-bright)]"
            onClick={onEditManual}
          >
            Edit in Manual
          </button>
        ) : null}
      </div>
    </div>
  );
}
