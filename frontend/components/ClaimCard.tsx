"use client";

import Link from "next/link";
import type { Claim } from "@/lib/contracts/types";
import { StatusBadge, VerdictBadge } from "@/components/StatusBadge";
import { formatWeiToGen, shortAddress } from "@/lib/utils";

export function ClaimCard({ claim }: { claim: Claim }) {
  const judged = claim.status === "Judged";

  return (
    <Link
      href={`/claims/${claim.id}`}
      className="glass-card glass-card-interactive block p-5 sm:p-[1.35rem]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono text-[11px] text-[var(--text-faint)]">
              #{claim.id}
            </span>
            <StatusBadge status={claim.status} />
            {judged && <VerdictBadge verdict={claim.verdict} />}
          </div>

          <p className="claim-text line-clamp-3">“{claim.claim_text}”</p>

          <div className="claim-meta">
            <span>{shortAddress(claim.creator)}</span>
            {claim.created_at ? <span>{claim.created_at}</span> : null}
            <span>{formatWeiToGen(claim.stake)} GEN</span>
          </div>
        </div>

        <div className="shrink-0 sm:text-right sm:pt-0.5">
          {judged ? (
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-faint)] font-semibold">
                Confidence
              </div>
              <div className="text-lg font-semibold tabular-nums tracking-tight text-[var(--text)]">
                {claim.confidence}
                <span className="text-sm font-medium text-[var(--text-muted)]">
                  %
                </span>
              </div>
              <div className="confidence-track w-24 sm:ml-auto">
                <div
                  className="confidence-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, claim.confidence))}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <span className="meta-pill text-[var(--gold)] border-[rgba(230,192,105,0.25)]">
              <span className="live-dot !bg-[var(--gold)] !shadow-[0_0_8px_var(--gold)]" />
              Awaiting judgment
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
