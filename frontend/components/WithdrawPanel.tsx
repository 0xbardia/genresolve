"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import {
  usePendingWithdrawal,
  useWithdraw,
} from "@/lib/hooks/useGenResolve";
import { ErrorAlert } from "@/components/ErrorAlert";
import { formatWeiToGen, getErrorMessage } from "@/lib/utils";

export function WithdrawPanel() {
  const { address, isConnected, ensureCorrectNetwork, isOnCorrectNetwork } =
    useWallet();
  const { data: balance, isFetching } = usePendingWithdrawal();
  const withdraw = useWithdraw();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!address || !isConnected) return null;

  let wei = BigInt(0);
  try {
    wei = BigInt(balance ?? 0);
  } catch {
    wei = BigInt(0);
  }
  if (wei <= BigInt(0)) return null;

  async function handleWithdraw() {
    setError(null);
    setSuccess(null);
    try {
      if (!isOnCorrectNetwork) await ensureCorrectNetwork();
      toast.message("Withdrawing…", {
        description: "Confirm the transaction in your wallet.",
      });
      await withdraw.mutateAsync();
      const msg = "Withdrawal sent. Balance will refresh to 0.";
      setSuccess(msg);
      toast.success("Withdrawal complete");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <div className="glass-card p-5 sm:p-6 space-y-3">
      <h3 className="text-sm font-semibold tracking-tight text-[var(--text)]">
        Pending withdrawal
      </h3>
      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
        Available{" "}
        <span className="tabular-nums text-[var(--text)]">
          {formatWeiToGen(wei)} GEN
        </span>
        {isFetching ? (
          <span className="text-[var(--text-faint)]"> · refreshing</span>
        ) : null}
      </p>
      <button
        type="button"
        className="btn btn-primary min-h-11"
        onClick={() => void handleWithdraw()}
        disabled={withdraw.isPending}
      >
        {withdraw.isPending ? "Withdrawing…" : "Withdraw"}
      </button>
      <div
        className="rounded-[3px] border border-[rgba(224,188,73,0.35)] bg-[rgba(224,188,73,0.08)] px-3 py-2.5 text-sm leading-relaxed text-[var(--gold)]"
        role="note"
      >
        ⚠️ Testnet Limitation: GenLayer Studionet does not yet support automatic
        native token transfers from smart contracts. Your funds (
        <span className="tabular-nums whitespace-nowrap">
          {formatWeiToGen(wei)} GEN
        </span>
        ) are safely recorded in the contract. Withdrawals will process
        automatically once the GenLayer SDK upgrades, or can be released
        manually by the contract owner.
      </div>
      {success ? (
        <p className="text-sm text-[var(--text-secondary)]" role="status">
          {success}
        </p>
      ) : null}
      {error && <ErrorAlert title="Withdraw failed" message={error} />}
    </div>
  );
}
