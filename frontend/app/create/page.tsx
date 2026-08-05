"use client";

import { useWallet } from "@/lib/genlayer/WalletProvider";
import { CreateClaimForm } from "@/components/CreateClaimForm";
import { ConfigAlert } from "@/components/ErrorAlert";

export default function CreateClaimPage() {
  const { network, contractAddress } = useWallet();

  return (
    <div className="formwrap page-section">
      <p className="eyebrow">New entry</p>
      <h1>File a claim</h1>
      <p className="sub">
        One primary statement for{" "}
        <span className="text-[var(--text)]">{network.shortName}</span>.
        Evidence and stake are optional. Judgment starts automatically once the
        claim is on the register (you can retry manually on the claim page if
        needed).
      </p>

      {!contractAddress && <ConfigAlert networkName={network.shortName} />}

      <CreateClaimForm />

      <p className="limits">
        LIMITS · CLAIM ≤ 2,000 CHARACTERS · EVIDENCE ≤ 8,000 CHARACTERS
      </p>
    </div>
  );
}
