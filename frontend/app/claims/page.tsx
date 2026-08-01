"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useClaimCount, useClaims } from "@/lib/hooks/useGenResolve";
import { ClaimCard } from "@/components/ClaimCard";
import { ConfigAlert, ErrorAlert } from "@/components/ErrorAlert";
import {
  ClaimListSkeleton,
  EmptyState,
} from "@/components/LoadingSpinner";
import { getErrorMessage } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function ClaimsPage() {
  const { network, contractAddress } = useWallet();
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;

  const { data: total } = useClaimCount();
  const {
    data: claims,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useClaims(offset, PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-8 page-section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Public ledger</p>
          <h1 className="display-title mt-2 text-2xl sm:text-3xl">Claims</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {network.shortName}
            {typeof total === "number" ? (
              <>
                {" "}
                ·{" "}
                <span className="tabular-nums text-[var(--text-secondary)]">
                  {total}
                </span>{" "}
                total
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <Link href="/create" className="btn btn-primary btn-sm">
            New claim
          </Link>
        </div>
      </div>

      {!contractAddress && <ConfigAlert networkName={network.shortName} />}

      {isLoading && <ClaimListSkeleton />}
      {isError && <ErrorAlert message={getErrorMessage(error)} />}

      {!isLoading && !isError && contractAddress && (
        <>
          {!claims?.length ? (
            <EmptyState
              title="No claims on this network"
              description="Submit a claim to start the ledger, or switch network if your deployment is elsewhere."
              action={
                <Link href="/create" className="btn btn-primary">
                  Create claim
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

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <span className="text-xs tabular-nums text-[var(--text-muted)]">
              Page {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
