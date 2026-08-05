import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({
  label = "Loading…",
  className,
  size = "md",
}: {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={cn("loading-row py-6", className)}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn("spinner", size === "lg" && "spinner-lg")}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="glass-card empty-state">
      <div className="empty-state-icon" aria-hidden>
        {icon ?? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 12h6M9 16h4M7 4h10a2 2 0 0 1 2 2v14l-4-2-3 2-3-2-4 2V6a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div className="empty-state-title">{title}</div>
      {description ? <p className="empty-state-desc">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ClaimListSkeleton() {
  return (
    <div
      className="entries"
      role="status"
      aria-live="polite"
      aria-label="Loading claims"
    >
      <span className="sr-only">Loading claims…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="entry" aria-hidden>
          <div className="skeleton w-8" />
          <div className="mid space-y-2">
            <div className="skeleton w-24" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}
