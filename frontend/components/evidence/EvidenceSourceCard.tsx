"use client";

import { cn } from "@/lib/utils";
import type { AssistSource } from "@/lib/evidence-assist/types";

export function EvidenceSourceCard({
  source,
  checked,
  disabled,
  onToggle,
}: {
  source: AssistSource;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label
        className={cn(
          "flex gap-3 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-2)] p-3 cursor-pointer transition-colors",
          checked &&
            "border-[rgba(201,162,39,0.45)] bg-[rgba(201,162,39,0.06)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="checkbox"
          className="mt-1 shrink-0"
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
          aria-label={`Include source ${source.title || source.host}`}
        />
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)] mono">
            {source.host}
          </span>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block text-sm font-semibold text-[var(--violet-bright)] hover:underline break-words"
            onClick={(e) => e.stopPropagation()}
          >
            {source.title || source.host}
            <span className="sr-only"> (opens {source.url})</span>
          </a>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)] line-clamp-3">
            {source.snippet}
          </p>
          {source.why ? (
            <p className="mt-1 text-[11px] text-[var(--text-faint)]">
              {source.why}
            </p>
          ) : null}
        </div>
      </label>
    </li>
  );
}
