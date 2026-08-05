import { WaxSeal, type SealVerdict } from "./WaxSeal";

function normalizeVerdict(verdict: string): SealVerdict {
  const v = verdict.toLowerCase();
  if (v === "true") return "true";
  if (v === "false") return "false";
  return "unverifiable";
}

/**
 * Exhibit card (design §4.6) — the ONE paper (light) surface on a page,
 * reserved for the final judged-claim moment. Dark-on-light is the exception
 * that makes it read as a physical exhibit page in an otherwise dark register.
 * Used once per page, sparingly.
 */
export function ExhibitCard({
  verdict,
  sealLabel,
  ring,
  tags,
  quote,
  confidence,
  reasoning,
  foot,
}: {
  verdict: string;
  sealLabel: string;
  ring?: string;
  tags: string[];
  quote: string;
  confidence: number;
  reasoning: string;
  foot: string;
}) {
  const v = normalizeVerdict(verdict);
  const conf = Math.max(0, Math.min(100, confidence));

  return (
    <div className="exhibit">
      <WaxSeal verdict={v} label={sealLabel} ring={ring} size={96} rotate={-5} />
      <div>
        <div className="tag-row">
          {tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
        <blockquote>“{quote}”</blockquote>
        <div className="conf-row">
          <span>Confidence</span>
          <span>{conf}%</span>
        </div>
        <div className="conf-bar">
          <span style={{ width: `${conf}%` }} />
        </div>
        <p className="reasoning">{reasoning}</p>
        <div className="foot">{foot}</div>
      </div>
    </div>
  );
}
