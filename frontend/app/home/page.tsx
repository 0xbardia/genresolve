"use client";

import Link from "next/link";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useClaimCount, useClaims } from "@/lib/hooks/useGenResolve";
import { ClaimEntryRow } from "@/components/register/ClaimEntryRow";
import { LedgerStrip } from "@/components/register/LedgerStrip";
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
    <div className="space-y-10">
      {/* App head */}
      <div className="app-head">
        <div className="title-row">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="mt-2">Home</h1>
            <p className="sub">
              {network.shortName}
              {typeof count === "number" ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="tabular-nums text-[var(--text)]">
                    {count}
                  </span>{" "}
                  claims recorded on this network
                </>
              ) : null}
            </p>
          </div>
          <div className="actions">
            <Link href="/create" className="btn btn-primary min-h-11">
              New claim
            </Link>
            <Link href="/claims" className="btn btn-secondary min-h-11">
              Browse claims
            </Link>
          </div>
        </div>
      </div>

      {!contractAddress && <ConfigAlert networkName={network.shortName} />}

      {/* Ledger strip — one bordered strip, not three cards */}
      <LedgerStrip
        cells={[
          {
            k: "Network",
            v: network.shortName,
            small: true,
            dot: true,
            sub: `Chain ${network.chainId} · ${network.currency.symbol}`,
          },
          {
            k: "Total claims",
            v: countLoading ? "—" : (count ?? 0),
            sub: "Recorded on this network",
          },
          {
            k: "Wallet",
            v: isConnected ? shortAddress(address, 6) : "Not connected",
            small: true,
            sub: isConnected ? (
              "Ready to create or judge"
            ) : (
              <button
                type="button"
                className="min-h-11 inline-flex items-center"
                onClick={() => void connectWallet().catch(() => {})}
              >
                Connect wallet
              </button>
            ),
          },
        ]}
      />

      {/* Recent claims */}
      <section className="page-section space-y-4">
        <div className="docket-list-head">
          <h2>Recent claims</h2>
          <Link href="/claims">View all →</Link>
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
          <div className="entries">
            {claims.map((c, i) => (
              <ClaimEntryRow key={c.id} claim={c} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
