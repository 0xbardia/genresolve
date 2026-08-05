import { cn } from "@/lib/utils";

/**
 * The bench (design §4.5) — validator seats in a gentle arc.
 *
 * Roman numerals (JUROR I–V) are deliberate: validators act in PARALLEL, so
 * they are numbered differently from the sequential custody spine. Verdict
 * colors are semantic per seat (data-verdict drives verdigris/oxblood/brass).
 */
export function Bench({
  seats,
  foot,
  className,
}: {
  seats: { roman: string; verdict: string; conf: number }[];
  foot?: string;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <div className="bench">
        {seats.map((s) => {
          const v = s.verdict.toLowerCase();
          const vd =
            v === "true" ? "true" : v === "false" ? "false" : "unverifiable";
          return (
            <div className="seat" key={s.roman}>
              <div className="roman">{s.roman}</div>
              <div className="verdict" data-verdict={vd}>
                {s.verdict}
              </div>
              <div className="bar">
                <span
                  data-verdict={vd}
                  style={{ width: `${Math.max(0, Math.min(100, s.conf))}%` }}
                />
              </div>
              <div className="pct">{s.conf}% confidence</div>
            </div>
          );
        })}
      </div>
      {foot ? <div className="bench-foot">{foot}</div> : null}
    </div>
  );
}
