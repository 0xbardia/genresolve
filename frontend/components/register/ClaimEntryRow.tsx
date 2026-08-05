import Link from "next/link";
import type { Claim } from "@/lib/contracts/types";
import { StatusBadge, VerdictBadge } from "@/components/StatusBadge";
import { formatDisplayDate, formatWeiToGen, shortAddress } from "@/lib/utils";

function verdictKey(verdict: string): "true" | "false" | "unverifiable" {
  const v = verdict.toLowerCase();
  if (v === "true") return "true";
  if (v === "false") return "false";
  return "unverifiable";
}

/**
 * Claim entry row (design §4.7) — the public-register list row.
 * Mono index, bordered stamp chips, serif italic quote, mono metadata line,
 * right-aligned confidence + thin bar. Confidence bar fill is verdict-semantic.
 */
export function ClaimEntryRow({
  claim,
  index,
}: {
  claim: Claim;
  /** Index shown in the mono # column (defaults to claim.id) */
  index?: number;
}) {
  const judged = claim.status === "Judged";
  const when = claim.created_at ? formatDisplayDate(claim.created_at) : null;
  const conf = Math.max(0, Math.min(100, claim.confidence));

  return (
    <Link
      href={`/claims/${claim.id}`}
      className="entry"
      aria-label={`Claim ${claim.id}${judged ? `, ${claim.verdict}` : ", needs judgment"}`}
    >
      <div className="idx">#{index ?? claim.id}</div>
      <div className="mid">
        <div className="tags">
          <StatusBadge status={claim.status} />
          {judged && <VerdictBadge verdict={claim.verdict} />}
        </div>
        <blockquote>“{claim.claim_text}”</blockquote>
        <div className="meta">
          <span title={claim.creator}>{shortAddress(claim.creator)}</span>
          {when ? (
            <time dateTime={claim.created_at} title={claim.created_at}>
              {when}
            </time>
          ) : null}
          <span>{formatWeiToGen(claim.stake)} GEN</span>
        </div>
      </div>
      <div className="right">
        {judged ? (
          <>
            <div className="cl">Confidence</div>
            <div className="cv">{conf}%</div>
            <div className="cbar">
              <span data-verdict={verdictKey(claim.verdict)} style={{ width: `${conf}%` }} />
            </div>
          </>
        ) : (
          <>
            <div className="cl">Status</div>
            <div className="cv" style={{ fontSize: 14 }}>
              Awaiting
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
