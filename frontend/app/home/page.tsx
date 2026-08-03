"use client";

import Link from "next/link";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useClaimCount, useClaims } from "@/lib/hooks/useGenResolve";
import { ClaimCard } from "@/components/ClaimCard";
import { ConfigAlert, ErrorAlert } from "@/components/ErrorAlert";
import {
  ClaimListSkeleton,
  EmptyState,
} from "@/components/LoadingSpinner";
import { getErrorMessage, shortAddress } from "@/lib/utils";

export default function HomePage() {
  const {
    network,
    contractAddress,
    isConnected,
    address,
    connectWallet,
  } = useWallet();
  const { data: count, isLoading: countLoading } = useClaimCount();
  const {
    data: claims,
    isLoading: claimsLoading,
    isError: claimsError,
    error: claimsErr,
    refetch: refetchClaims,
    isFetching: claimsFetching,
  } = useClaims(0, 5);

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Compact dashboard header */}
      <section className="page-section flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="display-title mt-2 text-2xl sm:text-3xl">Home</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)] max-w-md">
            {network.shortName}
            {typeof count === "number" ? (
              <>
                {" "}
                ·{" "}
                <span className="tabular-nums text-[var(--text-secondary)]">
                  {count}
                </span>{" "}
                claims on this network
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/create" className="btn btn-primary min-h-11">
            New claim
          </Link>
          <Link href="/claims" className="btn btn-secondary min-h-11">
            Browse claims
          </Link>
        </div>
      </section>

      {!contractAddress && (
        <section className="page-section">
          <ConfigAlert networkName={network.shortName} />
        </section>
      )}

      {/* Stats */}
      <section className="page-section grid gap-3 sm:grid-cols-3">
        <div className="glass-card stat-card">
          <div className="stat-label">Network</div>
          <div className="stat-value text-base sm:text-lg flex items-center gap-2">
            <span className="live-dot" />
            {network.shortName}
          </div>
          <div className="stat-meta">
            Chain {network.chainId} · {network.currency.symbol}
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-label">Total claims</div>
          <div className="stat-value tabular-nums">
            {countLoading ? "—" : (count ?? 0)}
          </div>
          <div className="stat-meta">Recorded on this network</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-label">Wallet</div>
          <div className="stat-value mono text-sm sm:text-base">
            {isConnected ? shortAddress(address, 6) : "Not connected"}
          </div>
          <div className="stat-meta">
            {isConnected ? (
              "Ready to create or judge"
            ) : (
              <button
                type="button"
                className="text-[var(--violet-bright)] font-medium hover:underline min-h-11 inline-flex items-center"
                onClick={() => void connectWallet().catch(() => {})}
              >
                Connect wallet
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Recent claims */}
      <section className="page-section space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Activity</p>
            <h2 className="display-title mt-2 text-xl sm:text-2xl">
              Recent claims
            </h2>
          </div>
          <Link
            href="/claims"
            className="btn btn-ghost btn-sm text-[var(--violet-bright)] min-h-11"
          >
            View all →
          </Link>
        </div>

        {!contractAddress ? (
          <EmptyState
            title="Contract not configured"
            description={`Set the contract address for ${network.shortName} in your environment to load claims.`}
            action={
              <Link href="/create" className="btn btn-secondary">
                Open create form
              </Link>
            }
          />
        ) : claimsLoading ? (
          <ClaimListSkeleton />
        ) : claimsError ? (
          <div className="space-y-3">
            <ErrorAlert
              title="Could not load claims"
              message={getErrorMessage(claimsErr)}
            />
            <button
              type="button"
              className="btn btn-secondary min-h-11"
              onClick={() => void refetchClaims()}
              disabled={claimsFetching}
            >
              {claimsFetching ? (
                <>
                  <span className="spinner" aria-hidden />
                  Retrying…
                </>
              ) : (
                "Retry"
              )}
            </button>
          </div>
        ) : !claims?.length ? (
          <EmptyState
            title="No claims yet"
            description="Be the first to submit a claim on this network."
            action={
              <Link href="/create" className="btn btn-primary">
                Create first claim
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3">
            {claims.map((c) => (
              <ClaimCard key={c.id} claim={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
