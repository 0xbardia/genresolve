"use client";

import { useWallet } from "@/lib/genlayer/WalletProvider";
import { CreateClaimForm } from "@/components/CreateClaimForm";
import { ConfigAlert } from "@/components/ErrorAlert";

export default function CreateClaimPage() {
  const { network, contractAddress } = useWallet();

  return (
    <div className="mx-auto max-w-xl space-y-7 page-section">
      <div>
        <p className="eyebrow">New entry</p>
        <h1 className="display-title mt-2 text-2xl sm:text-3xl">
          Create claim
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)] max-w-md">
          One primary statement for{" "}
          <span className="text-[var(--text-secondary)]">{network.shortName}</span>
          . Optional evidence and stake. After create, judgment starts
          automatically on the claim page (you can retry manually if needed).
        </p>
      </div>

      {!contractAddress && <ConfigAlert networkName={network.shortName} />}

      <CreateClaimForm />

      <p className="text-xs leading-relaxed text-[var(--text-faint)] px-0.5">
        Limits: claim ≤ 2,000 characters · evidence ≤ 8,000 characters.
      </p>
    </div>
  );
}
