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

  const totalCount = typeof total === "number" ? total : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE) || 1);
  const pageLen = claims?.length ?? 0;
  const rangeStart = totalCount === 0 || pageLen === 0 ? 0 : offset + 1;
  const rangeEnd = totalCount === 0 ? 0 : offset + pageLen;

  return (
    <div className="space-y-8 page-section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Browse</p>
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
            className="btn btn-secondary min-h-11 min-w-11"
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
          <Link href="/create" className="btn btn-primary min-h-11">
            New claim
          </Link>
        </div>
      </div>

      {!contractAddress && <ConfigAlert networkName={network.shortName} />}

      {isLoading && <ClaimListSkeleton />}

      {isError && (
        <div className="space-y-3">
          <ErrorAlert
            title="Could not load claims"
            message={getErrorMessage(error)}
          />
          <button
            type="button"
            className="btn btn-secondary min-h-11"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <>
                <span className="spinner" aria-hidden />
                Retrying…
              </>
            ) : (
              "Retry"
            )}
          </button>
        </div>
      )}

      {!isLoading && !isError && contractAddress && (
        <>
          {!claims?.length ? (
            <EmptyState
              title="No claims on this network"
              description="Submit a claim to get started, or switch network if your deployment is elsewhere."
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
            <p className="text-xs tabular-nums text-[var(--text-muted)] order-2 sm:order-1">
              {totalCount === 0
                ? "No claims to show"
                : `Showing ${rangeStart}–${rangeEnd} of ${totalCount}`}
              <span className="text-[var(--text-faint)]">
                {" "}
                · Page {page + 1} / {totalPages}
              </span>
            </p>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                type="button"
                className="btn btn-secondary min-h-11 min-w-[5.5rem]"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary min-h-11 min-w-[5.5rem]"
                disabled={page + 1 >= totalPages || totalCount === 0}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
