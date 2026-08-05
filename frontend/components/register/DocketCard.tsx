import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CustodyState = "done" | "active" | "pending";

export interface CustodyItem {
  title: string;
  sub: string;
  state: CustodyState;
}

/**
 * Chain-of-custody list inside a docket card (design §4.2).
 * Dots: hairline (pending) → verdigris (done) → brass (active/"Now").
 */
export function CustodyList({
  items,
  className,
}: {
  items: CustodyItem[];
  className?: string;
}) {
  return (
    <ul className={cn("custody", className)}>
      {items.map((it) => (
        <li key={it.title} className={it.state === "done" ? "done" : it.state === "active" ? "active" : ""}>
          <span className="node" aria-hidden />
          <div>
            <div className="stitle">{it.title}</div>
            <div className="ssub">{it.sub}</div>
          </div>
          <span className="sstate">
            {it.state === "active" ? "Now" : it.state === "done" ? "Done" : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Docket / case-file card (design §4.2) — the manila folder with the
 * overlapping "CASE FILE" tab. Content is composed by the caller.
 */
export function DocketCard({
  tab = "Case file",
  headLeft,
  headRight,
  children,
  className,
}: {
  tab?: string;
  headLeft: ReactNode;
  headRight?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("docket", className)}>
      <div className="tab">{tab}</div>
      <div className="docket-inner">
        <div className="docket-head">
          <span className="live">
            <span className="dot" aria-hidden />
            {headLeft}
          </span>
          {headRight ? <span>{headRight}</span> : null}
        </div>
        <div className="docket-body">{children}</div>
      </div>
    </div>
  );
}
