"use client";

import { cn } from "@/lib/utils";
import type { EvidenceMethod } from "./assistClient";

export function EvidenceMethodSwitch({
  method,
  onChange,
  disabled,
}: {
  method: EvidenceMethod;
  onChange: (m: EvidenceMethod) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="evidence-method-switch"
      role="radiogroup"
      aria-label="Evidence input method"
    >
      {(
        [
          { id: "manual" as const, label: "Manual" },
          { id: "research" as const, label: "Research" },
        ] as const
      ).map((opt) => {
        const active = method === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            className={cn(
              "evidence-method-option min-h-11",
              active && "is-active"
            )}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
