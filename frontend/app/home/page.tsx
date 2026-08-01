"use client";

import Link from "next/link";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useClaimCount, useClaims, useOwner } from "@/lib/hooks/useGenResolve";
import { ClaimCard } from "@/components/ClaimCard";
import { ConfigAlert } from "@/components/ErrorAlert";
import {
  ClaimListSkeleton,
  EmptyState,
} from "@/components/LoadingSpinner";
import { shortAddress } from "@/lib/utils";

export default function HomePage() {
  const { network, contractAddress, isConnected, address } = useWallet();
  const { data: count, isLoading: countLoading } = useClaimCount();
  const { data: claims, isLoading: claimsLoading } = useClaims(0, 5);
  const { data: owner } = useOwner();

  return (
    <div className="space-y-12 sm:space-y-14">
      <section className="page-section relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-1)] px-6 py-10 sm:px-10 sm:py-12">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[rgba(139,124,246,0.12)] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-[rgba(95,216,208,0.08)] blur-3xl"
          aria-hidden
        />

        <div className="relative z-[1] max-w-xl">
          <p className="eyebrow">On-chain AI consensus</p>
          <h1 className="display-title mt-3 text-[1.85rem] sm:text-4xl">
            Claims judged by{" "}
            <span className="gradient-text">intelligent consensus</span>
          </h1>
          <p className="lede mt-4">
            Submit natural-language claims. GenLayer validators evaluate
            evidence and permanently record True, False, or Unverifiable —
            with reasoning and confidence.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link href="/create" className="btn btn-primary btn-lg">
              Submit a claim
            </Link>
            <Link href="/claims" className="btn btn-secondary btn-lg">
              Browse ledger
            </Link>
          </div>
        </div>
      </section>

      {!contractAddress && (
        <section className="page-section page-section-delay-1">
          <ConfigAlert networkName={network.shortName} />
        </section>
      )}

      <section className="page-section page-section-delay-1 grid gap-3 sm:grid-cols-3">
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
          <div className="stat-meta">Permanent ledger entries</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-label">Wallet</div>
          <div className="stat-value mono text-sm sm:text-base">
            {isConnected ? shortAddress(address, 6) : "Not connected"}
          </div>
          <div className="stat-meta">
            {owner
              ? `Owner ${shortAddress(owner, 4)}`
              : isConnected
                ? "Ready to transact"
                : "Connect to create or judge"}
          </div>
        </div>
      </section>

      <section className="page-section page-section-delay-2">
        <div className="mb-4">
          <p className="eyebrow">Process</p>
          <h2 className="display-title mt-2 text-xl sm:text-2xl">
            How it works
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Submit",
              body: "Write a claim, attach optional evidence, stake GEN if you wish.",
            },
            {
              step: "02",
              title: "Judge",
              body: "Trigger AI consensus. Validators re-run analysis under the Equivalence Principle.",
            },
            {
              step: "03",
              title: "Record",
              body: "Verdict, reasoning, and confidence are stored permanently on-chain.",
            },
          ].map((item) => (
            <div key={item.step} className="glass-card p-5">
              <div className="text-[11px] font-semibold tracking-[0.12em] text-[var(--violet-bright)]">
                {item.step}
              </div>
              <h3 className="mt-2 text-[0.95rem] font-semibold text-[var(--text)]">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-section page-section-delay-3 space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Ledger</p>
            <h2 className="display-title mt-2 text-xl sm:text-2xl">
              Recent claims
            </h2>
          </div>
          <Link
            href="/claims"
            className="btn btn-ghost btn-sm text-[var(--violet-bright)]"
          >
            View all →
          </Link>
        </div>

        {!contractAddress ? null : claimsLoading ? (
          <ClaimListSkeleton />
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
