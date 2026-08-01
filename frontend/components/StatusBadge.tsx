import { cn } from "@/lib/utils";

function IconCheck() {
  return (
    <span className="badge-icon" aria-hidden>
      ✓
    </span>
  );
}
function IconCross() {
  return (
    <span className="badge-icon" aria-hidden>
      ✕
    </span>
  );
}
function IconQuest() {
  return (
    <span className="badge-icon" aria-hidden>
      ?
    </span>
  );
}
function IconClock() {
  return (
    <span className="badge-icon" aria-hidden>
      ◷
    </span>
  );
}
function IconSeal() {
  return (
    <span className="badge-icon" aria-hidden>
      ◆
    </span>
  );
}

export function StatusBadge({
  status,
  size = "md",
}: {
  status: string;
  size?: "md" | "lg";
}) {
  const pending = status === "Pending";
  const judged = status === "Judged";

  return (
    <span
      className={cn(
        "badge",
        size === "lg" && "badge-lg",
        pending && "badge-pending",
        judged && "badge-judged",
        !pending && !judged && "badge-neutral"
      )}
    >
      {pending ? <IconClock /> : judged ? <IconSeal /> : null}
      {status || "Unknown"}
    </span>
  );
}

export function VerdictBadge({
  verdict,
  size = "md",
}: {
  verdict: string;
  size?: "md" | "lg";
}) {
  if (!verdict) {
    return (
      <span className={cn("badge badge-neutral", size === "lg" && "badge-lg")}>
        No verdict
      </span>
    );
  }

  const v = verdict.toLowerCase();
  const isTrue = v === "true";
  const isFalse = v === "false";
  const isUnv = v === "unverifiable";

  return (
    <span
      className={cn(
        "badge",
        size === "lg" && "badge-lg",
        isTrue && "badge-true",
        isFalse && "badge-false",
        isUnv && "badge-unverifiable",
        !isTrue && !isFalse && !isUnv && "badge-neutral"
      )}
    >
      {isTrue && <IconCheck />}
      {isFalse && <IconCross />}
      {isUnv && <IconQuest />}
      {verdict}
    </span>
  );
}
