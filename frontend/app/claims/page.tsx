"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useClaimCount, useClaims } from "@/lib/hooks/useGenResolve";
import { ClaimEntryRow } from "@/components/register/ClaimEntryRow";
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
    <div className="space-y-10 page-section">
      <div className="app-head">
        <div className="title-row">
          <div>
            <p className="eyebrow">Browse</p>
            <h1 className="mt-2">Claims</h1>
            <p className="sub">
              {network.shortName}
              {typeof total === "number" ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="tabular-nums text-[var(--text)]">
                    {total}
                  </span>{" "}
                  total
                </>
              ) : null}
            </p>
          </div>
          <div className="actions">
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
            <div className="entries">
              {claims.map((c, i) => (
                <ClaimEntryRow key={c.id} claim={c} index={i} />
              ))}
            </div>
          )}

          <div className="pager">
            <span>
              {totalCount === 0
                ? "No claims to show"
                : `Showing ${rangeStart}–${rangeEnd} of ${totalCount}`}
              <span className="text-[var(--text-faint)]">
                {" "}
                · Page {page + 1} / {totalPages}
              </span>
            </span>
            <div className="links">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
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
