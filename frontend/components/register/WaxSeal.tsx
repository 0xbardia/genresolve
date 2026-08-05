import { cn } from "@/lib/utils";

export type SealVerdict = "true" | "false" | "unverifiable";

function normalizeVerdict(verdict: string): SealVerdict {
  const v = verdict.toLowerCase();
  if (v === "true") return "true";
  if (v === "false") return "false";
  return "unverifiable";
}

/**
 * WaxSeal — the load-bearing verdict stamp (design system §4.1).
 *
 * Faithful port of the mockup's ring-text generator: the ring is built by
 * rotating individual monospace characters around the seal center. The mockup
 * measured the radius at runtime (R = offsetWidth/2 − 7); this port derives
 * the same radius deterministically from the `size` prop, so SSR and client
 * render byte-identical output — no hydration mismatch, no layout effect.
 *
 * Never replace this with a plain badge: the ring is what stops the seal from
 * reading as a generic colored dot.
 */
export function WaxSeal({
  verdict,
  label,
  ring = "SEALED · GENRESOLVE · SEALED ·",
  size = 64,
  rotate = -7,
  className,
}: {
  verdict: string;
  label: string;
  /** Ring text, e.g. "SEALED · GENRESOLVE · SEALED ·" */
  ring?: string;
  /** Diameter in px — 64 inline, 96 exhibit */
  size?: number;
  /** Rotation in degrees — mockup: -7 (inline), -5 (exhibit) */
  rotate?: number;
  className?: string;
}) {
  const v = normalizeVerdict(verdict);
  const R = Math.round(size / 2) - 7;
  const chars = ring.split("");
  const angleFor = (i: number) => (360 / chars.length) * i;

  return (
    <div
      className={cn("seal", `seal-${v}`, className)}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        fontSize: size >= 96 ? 15 : 12,
      }}
      role="img"
      aria-label={`${label} — sealed`}
    >
      <span className="ring" aria-hidden>
        {chars.map((ch, i) => (
          <span
            key={i}
            style={{
              transform: `rotate(${angleFor(i)}deg) translate(-1px, -${R}px)`,
            }}
          >
            {ch}
          </span>
        ))}
      </span>
      <span className="core">{label}</span>
    </div>
  );
}

/** Small caption block that sits beside a seal (mockup .seal-meta) */
export function SealMeta({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <div className="seal-meta">
      <b>{title}</b>
      {sub}
    </div>
  );
}
