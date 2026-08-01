"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useJudgeClaim } from "@/lib/hooks/useGenResolve";
import { ErrorAlert } from "@/components/ErrorAlert";
import { getErrorMessage } from "@/lib/utils";

export function JudgeButton({
  claimId,
  status,
}: {
  claimId: number;
  status: string;
}) {
  const {
    isConnected,
    connectWallet,
    ensureCorrectNetwork,
    isOnCorrectNetwork,
  } = useWallet();
  const judge = useJudgeClaim();
  const [error, setError] = useState<string | null>(null);

  if (status !== "Pending") return null;

  const onJudge = async () => {
    setError(null);
    try {
      if (!isConnected) await connectWallet();
      if (!isOnCorrectNetwork) await ensureCorrectNetwork();

      toast.message("Judgment submitted", {
        description: "Validators are forming consensus. This can take minutes.",
      });

      await judge.mutateAsync(claimId);
      toast.success("Claim judged", {
        description: "Verdict, reasoning, and confidence are on-chain.",
      });
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    }
  };

  if (judge.isPending) {
    return (
      <div className="space-y-3">
        <div className="judging-panel" role="status" aria-live="polite">
          <div className="relative z-[1]">
            <div className="judging-title">
              <span className="judging-pulse" aria-hidden />
              Validators are reviewing this claim…
            </div>
            <p className="judging-desc">
              AI validators independently evaluate the claim and evidence,
              then agree on a verdict under the Equivalence Principle. This is
              normal — the process is active, not stuck.
            </p>
            <div className="progress-row" aria-hidden>
              <div className="progress-dot done" />
              <div className="progress-dot done" />
              <div className="progress-dot active" />
              <div className="progress-dot" />
              <div className="progress-dot" />
            </div>
            <p className="claim-meta mt-3">
              Consensus in progress · keep this page open or refresh later
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="glass-card p-5 sm:p-6">
        <h3 className="text-sm font-semibold tracking-tight text-[var(--text)]">
          Ready for judgment
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)] max-w-xl">
          Anyone can trigger AI consensus. Confirm in your wallet — the network
          will store True, False, or Unverifiable with reasoning and confidence.
        </p>
        <div className="mt-4">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void onJudge()}
          >
            Trigger judgment
          </button>
        </div>
      </div>
      {error && <ErrorAlert message={error} />}
    </div>
  );
}
