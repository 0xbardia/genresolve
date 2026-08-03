"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useClaim } from "@/lib/hooks/useGenResolve";
import { StatusBadge, VerdictBadge } from "@/components/StatusBadge";
import { JudgeButton } from "@/components/JudgeButton";
import { ConfigAlert, ErrorAlert } from "@/components/ErrorAlert";
import { EmptyState, LoadingSpinner } from "@/components/LoadingSpinner";
import {
  formatDisplayDate,
  formatWeiToGen,
  getErrorMessage,
  shortAddress,
} from "@/lib/utils";

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

function isNotFoundError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  return (
    msg.includes("does not exist") ||
    msg.includes("not found") ||
    (msg.includes("claim") && msg.includes("exist"))
  );
}

export default function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = use(params);
  const searchParams = useSearchParams();
  const claimId = Number(idParam);
  const invalidId =
    !Number.isFinite(claimId) || claimId < 0 || !/^\d+$/.test(idParam);
  const autoJudge =
    searchParams.get("autoJudge") === "1" ||
    searchParams.get("autoJudge") === "true";
  const { network, contractAddress } = useWallet();
  const {
    data: claim,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useClaim(invalidId ? null : claimId);

  const judged = claim?.status === "Judged";
  const notFound =
    invalidId ||
    (isError && isNotFoundError(error)) ||
    (!isLoading && !isError && !claim && contractAddress);

  const verdictRef = useRef<HTMLDivElement>(null);
  const [shouldFocusVerdict, setShouldFocusVerdict] = useState(false);

  const onJudged = useCallback(() => {
    setShouldFocusVerdict(true);
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!shouldFocusVerdict || !judged || !verdictRef.current) return;
    const el = verdictRef.current;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    el.focus({ preventScroll: true });
    setShouldFocusVerdict(false);
  }, [shouldFocusVerdict, judged, claim?.verdict]);

  return (
    <div className="mx-auto max-w-2xl space-y-7 page-section">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/claims"
            className="inline-flex items-center gap-1.5 min-h-11 px-2 -ml-2 rounded-md text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--violet-bright)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cyan)]"
          >
            <span aria-hidden>←</span> Back to claims
          </Link>
          <h1 className="display-title mt-1 text-2xl sm:text-[1.75rem]">
            Claim{" "}
            <span className="mono text-[0.8em] font-semibold text-[var(--text-muted)]">
              #{idParam}
            </span>
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {network.shortName}
          </p>
        </div>
        {!notFound && (
          <button
            type="button"
            className="btn btn-secondary min-h-11 min-w-11"
            onClick={() => void refetch()}
            disabled={isFetching || isLoading}
            aria-label="Refresh claim data"
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
        )}
      </div>

      {!contractAddress && <ConfigAlert networkName={network.shortName} />}

      {invalidId && (
        <EmptyState
          title="Invalid claim ID"
          description="Claim IDs are numbers starting from 0. Check the link or browse all claims."
          action={
            <Link href="/claims" className="btn btn-primary min-h-11">
              Back to claims
            </Link>
          }
        />
      )}

      {!invalidId && isLoading && (
        <LoadingSpinner label="Loading claim…" size="lg" />
      )}

      {!invalidId && isError && isNotFoundError(error) && (
        <EmptyState
          title="Claim not found"
          description={`No claim #${idParam} exists on ${network.shortName}, or it could not be loaded.`}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/claims" className="btn btn-primary min-h-11">
                Back to claims
              </Link>
              <Link href="/home" className="btn btn-secondary min-h-11">
                Go to home
              </Link>
            </div>
          }
        />
      )}

      {!invalidId && isError && !isNotFoundError(error) && (
        <div className="space-y-3">
          <ErrorAlert
            title="Could not load claim"
            message={getErrorMessage(error)}
          />
          <button
            type="button"
            className="btn btn-secondary min-h-11"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      )}

      {claim && (
        <div className="space-y-5">
          {judged && (
            <div
              ref={verdictRef}
              id="claim-verdict"
              tabIndex={-1}
              className="verdict-reveal glass-card p-5 sm:p-6 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cyan)] focus-visible:outline-offset-2"
              aria-label="Judgment result"
            >
              <p className="section-label">Verdict</p>
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
                  Needs judgment
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
                  <h2 className="section-label">Why</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                    {claim.reasoning || "—"}
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--text-faint)]">
                    Explanation from the review process. The official result is
                    the verdict above.
                  </p>
                </div>
              </>
            )}

            <hr className="divider" />

            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="section-label">Creator</dt>
                <dd
                  className="mt-1.5 mono break-all text-[var(--text-secondary)] text-xs"
                  title={claim.creator}
                >
                  {shortAddress(claim.creator, 6)}
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
                  {claim.created_at ? (
                    <time dateTime={claim.created_at} title={claim.created_at}>
                      {formatDisplayDate(claim.created_at)}
                    </time>
                  ) : (
                    "—"
                  )}
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

          <JudgeButton
            claimId={claim.id}
            status={claim.status}
            onJudged={onJudged}
            autoStart={autoJudge}
          />
        </div>
      )}
    </div>
  );
}
