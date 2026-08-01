"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useCreateClaim } from "@/lib/hooks/useGenResolve";
import { ErrorAlert } from "@/components/ErrorAlert";
import {
  MAX_CLAIM_TEXT_LEN,
  MAX_EVIDENCE_LEN,
} from "@/lib/config/limits";
import { cn, getErrorMessage, parseGenToWei } from "@/lib/utils";

function CharCount({ current, max }: { current: number; max: number }) {
  const over = current > max;
  return (
    <span
      className={cn(
        "char-count tabular-nums",
        over && "text-[var(--false)] font-semibold"
      )}
    >
      {current.toLocaleString()} / {max.toLocaleString()}
    </span>
  );
}

export function CreateClaimForm() {
  const router = useRouter();
  const {
    isConnected,
    connectWallet,
    ensureCorrectNetwork,
    isOnCorrectNetwork,
    network,
  } = useWallet();
  const createClaim = useCreateClaim();

  const [claimText, setClaimText] = useState("");
  const [evidence, setEvidence] = useState("");
  const [stake, setStake] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const claimForSubmit = claimText.trim();
  const evidenceForSubmit = evidence;
  const claimLen = claimForSubmit.length;
  const evidenceLen = evidenceForSubmit.length;
  const claimOver = claimLen > MAX_CLAIM_TEXT_LEN;
  const evidenceOver = evidenceLen > MAX_EVIDENCE_LEN;

  const lengthError = useMemo(() => {
    if (claimOver) {
      return `Claim text exceeds the maximum of ${MAX_CLAIM_TEXT_LEN.toLocaleString()} characters.`;
    }
    if (evidenceOver) {
      return `Evidence exceeds the maximum of ${MAX_EVIDENCE_LEN.toLocaleString()} characters.`;
    }
    return null;
  }, [claimOver, evidenceOver]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!claimForSubmit) {
      setLocalError("Claim text is required");
      return;
    }
    if (lengthError) {
      setLocalError(lengthError);
      return;
    }

    try {
      if (!isConnected) {
        await connectWallet();
      }
      if (!isOnCorrectNetwork) {
        await ensureCorrectNetwork();
      }

      let stakeWei = BigInt(0);
      try {
        stakeWei = parseGenToWei(stake);
      } catch (err) {
        setLocalError(getErrorMessage(err));
        return;
      }

      toast.message("Submitting claim…", {
        description: `Confirm in your wallet · ${network.shortName}`,
      });

      const receipt = await createClaim.mutateAsync({
        claimText: claimForSubmit,
        evidence: evidenceForSubmit,
        stakeWei,
      });

      toast.success("Claim created", {
        description: "Opening your claim — trigger judgment when ready.",
      });
      setClaimText("");
      setEvidence("");
      setStake("");

      // Prefer detail page for the new claim when we can infer id from count path;
      // fall back to claims list (business logic unchanged).
      void receipt;
      router.push("/claims");
    } catch (err) {
      const msg = getErrorMessage(err);
      setLocalError(msg);
      toast.error(msg);
    }
  };

  const submitting = createClaim.isPending;
  const canSubmit = !submitting && !claimOver && !evidenceOver;

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="glass-card space-y-7 p-6 sm:p-8"
    >
      <div className="field">
        <label className="label" htmlFor="claim_text">
          <span>Claim</span>
          <span className="label-hint flex items-center gap-2">
            Required
            <CharCount current={claimLen} max={MAX_CLAIM_TEXT_LEN} />
          </span>
        </label>
        <textarea
          id="claim_text"
          className={cn(
            "textarea textarea-primary",
            claimOver && "border-[var(--false)]"
          )}
          placeholder="State a clear, verifiable claim…"
          value={claimText}
          onChange={(e) => setClaimText(e.target.value)}
          maxLength={MAX_CLAIM_TEXT_LEN}
          required
          disabled={submitting}
          aria-invalid={claimOver}
        />
        <p className="field-help">
          One primary statement. Objective facts reach consensus more reliably
          than opinions or forecasts.
        </p>
      </div>

      <div className="field">
        <label className="label" htmlFor="evidence">
          <span>Evidence</span>
          <span className="label-hint flex items-center gap-2">
            Optional
            <CharCount current={evidenceLen} max={MAX_EVIDENCE_LEN} />
          </span>
        </label>
        <textarea
          id="evidence"
          className={cn(
            "textarea min-h-[96px]",
            evidenceOver && "border-[var(--false)]"
          )}
          placeholder="Supporting text or https://… links"
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          maxLength={MAX_EVIDENCE_LEN}
          disabled={submitting}
          aria-invalid={evidenceOver}
        />
        <p className="field-help">
          Up to a few URLs are fetched during judgment. Max{" "}
          {MAX_EVIDENCE_LEN.toLocaleString()} characters.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="field">
          <label className="label" htmlFor="stake">
            <span>Stake (GEN)</span>
            <span className="label-hint">Optional</span>
          </label>
          <input
            id="stake"
            className="input max-w-[12rem]"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="meta-pill self-end mb-1 justify-self-start sm:justify-self-end">
          <span className="live-dot" />
          Submitting on <strong className="text-[var(--text)] ml-0.5">{network.shortName}</strong>
        </div>
      </div>

      <div
        className="rounded-[var(--radius-sm)] border border-[rgba(230,192,105,0.25)] bg-[rgba(230,192,105,0.06)] px-4 py-3 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]"
        role="note"
      >
        <span className="font-semibold text-[var(--gold)]">Stake note · </span>
        Any GEN you send is <strong className="text-[var(--text)]">non-refundable</strong>{" "}
        in this MVP — permanently recorded and locked in the contract. Leave at
        0 unless you intend to bond value.
      </div>

      {(localError || lengthError) && (
        <ErrorAlert message={localError || lengthError || ""} />
      )}
      {createClaim.isError && !localError && !lengthError && (
        <ErrorAlert message={getErrorMessage(createClaim.error)} />
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--text-faint)] max-w-xs leading-relaxed">
          {isConnected
            ? "Wallet will prompt to sign. Gas applies; stake is optional."
            : "Connect a wallet to submit. You can draft the claim first."}
        </p>
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={!canSubmit}
        >
          {submitting ? (
            <>
              <span className="spinner" aria-hidden />
              Creating…
            </>
          ) : (
            "Submit claim"
          )}
        </button>
      </div>
    </form>
  );
}
