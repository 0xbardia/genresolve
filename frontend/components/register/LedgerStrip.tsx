import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LedgerCell {
  k: string;
  v: ReactNode;
  /** small variant = sans 16px (network/wallet), default = serif 22px (counts) */
  small?: boolean;
  /** verdigris status dot before the value */
  dot?: boolean;
  sub?: ReactNode;
}

/**
 * Ledger strip (design §4.7) — stats as ONE bordered strip with internal
 * dividers. Explicitly NOT three floating cards.
 */
export function LedgerStrip({
  cells,
  className,
}: {
  cells: LedgerCell[];
  className?: string;
}) {
  return (
    <div className={cn("ledger-strip", className)}>
      {cells.map((c) => (
        <div className="cell" key={c.k}>
          <div className="k">{c.k}</div>
          <div className={cn("v", c.small && "small")}>
            {c.dot ? <span className="dot" aria-hidden /> : null}
            {c.v}
          </div>
          {c.sub ? <div className="sub2">{c.sub}</div> : null}
        </div>
      ))}
    </div>
  );
}
