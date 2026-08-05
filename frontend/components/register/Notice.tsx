import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Register notice block (design §4.8/create view) — brass left rule,
 * mono uppercase title, muted body. The register's voice for caveats
 * ("Non-refundable", etc.).
 */
export function Notice({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("notice", className)} role="note">
      <b>{title}</b>
      {children}
    </div>
  );
}
