"use client";

import { use } from "react";
import Link from "next/link";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useClaim } from "@/lib/hooks/useGenResolve";
import { StatusBadge, VerdictBadge } from "@/components/StatusBadge";
import { JudgeButton } from "@/components/JudgeButton";
import { ConfigAlert, ErrorAlert } from "@/components/ErrorAlert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatWeiToGen, getErrorMessage, shortAddress } from "@/lib/utils";

function ConfidenceBlock({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="mt-3 max-w-xs">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">Confidence</span>
        <span className="tabular-nums font-semibold text-[var(--text)]">
          {pct}%
        </span>
      </div>
      <div className="confidence-track mt-1.5">
        <div className="confidence-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = use(params);
  const claimId = Number(idParam);
  const { network, contractAddress } = useWallet();
  const {
    data: claim,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useClaim(Number.isFinite(claimId) ? claimId : null);

  const judged = claim?.status === "Judged";

  return (
    <div className="mx-auto max-w-2xl space-y-7 page-section">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/claims"
            className="text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--violet-bright)]"
          >
            ← Back to claims
          </Link>
          <h1 className="display-title mt-2 text-2xl sm:text-[1.75rem]">
            Claim{" "}
            <span className="mono text-[0.8em] font-semibold text-[var(--text-muted)]">
              #{idParam}
            </span>
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {network.shortName}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <>
              <span className="spinner" aria-hidden />
              Refreshing
            </>
          ) : (
            "Refresh"
          )}
        </button>
      </div>

      {!contractAddress && <ConfigAlert networkName={network.shortName} />}
      {isLoading && <LoadingSpinner label="Loading claim…" size="lg" />}
      {isError && <ErrorAlert message={getErrorMessage(error)} />}

      {claim && (
        <div className="space-y-5">
          {/* Verdict-first hierarchy when judged */}
          {judged && (
            <div className="verdict-reveal glass-card p-5 sm:p-6">
              <p className="section-label">Consensus result</p>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <VerdictBadge verdict={claim.verdict} size="lg" />
                <StatusBadge status={claim.status} size="lg" />
              </div>
              <ConfidenceBlock value={claim.confidence} />
            </div>
          )}

          <article className="glass-card p-6 sm:p-8 space-y-6">
            {!judged && (
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={claim.status} size="lg" />
                <span className="meta-pill text-[var(--gold)] border-[rgba(230,192,105,0.25)]">
                  <span className="live-dot !bg-[var(--gold)] !shadow-[0_0_8px_var(--gold)]" />
                  Pending judgment
                </span>
              </div>
            )}

            <div>
              <h2 className="section-label">Claim</h2>
              <p className="claim-text-lg mt-2.5">“{claim.claim_text}”</p>
            </div>

            <hr className="divider" />

            <div>
              <h2 className="section-label">Evidence</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                {claim.evidence || "No evidence provided."}
              </p>
            </div>

            {judged && (
              <>
                <hr className="divider" />
                <div>
                  <h2 className="section-label">Reasoning</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                    {claim.reasoning || "—"}
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--text-faint)]">
                    Reasoning from consensus leader; the agreed field is the
                    verdict.
                  </p>
                </div>
              </>
            )}

            <hr className="divider" />

            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="section-label">Creator</dt>
                <dd className="mt-1.5 mono break-all text-[var(--text-secondary)] text-xs">
                  {claim.creator || shortAddress(claim.creator)}
                </dd>
              </div>
              <div>
                <dt className="section-label">Stake</dt>
                <dd className="mt-1.5 text-[var(--text-secondary)]">
                  {formatWeiToGen(claim.stake)} GEN
                </dd>
              </div>
              <div>
                <dt className="section-label">Created</dt>
                <dd className="mt-1.5 text-[var(--text-secondary)] text-xs">
                  {claim.created_at || "—"}
                </dd>
              </div>
              <div>
                <dt className="section-label">ID</dt>
                <dd className="mt-1.5 mono text-[var(--text-secondary)]">
                  {claim.id}
                </dd>
              </div>
            </dl>
          </article>

          <JudgeButton claimId={claim.id} status={claim.status} />
        </div>
      )}
    </div>
  );
}
