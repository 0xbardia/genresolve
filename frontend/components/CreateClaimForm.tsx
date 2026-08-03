"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import {
  useCreateClaim,
  useGenResolveContract,
} from "@/lib/hooks/useGenResolve";
import { ErrorAlert } from "@/components/ErrorAlert";
import {
  MAX_CLAIM_TEXT_LEN,
  MAX_EVIDENCE_LEN,
} from "@/lib/config/limits";
import { flagAutoJudge } from "@/lib/autoJudge";
import { cn, getErrorMessage, parseGenToWei } from "@/lib/utils";

function CharCount({ current, max }: { current: number; max: number }) {
  const over = current > max;
  return (
    <span
      className={cn(
        "char-count tabular-nums",
        over && "text-[var(--false)] font-semibold"
      )}
      aria-live="polite"
    >
      {current.toLocaleString()} / {max.toLocaleString()}
    </span>
  );
}

/** Stake format check without throwing — empty is valid (0). */
function getStakeError(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return "Enter a non-negative number (e.g. 0 or 1.5). No letters or symbols.";
  }
  // Extra decimals beyond 18 are truncated by parseGenToWei — still valid.
  try {
    parseGenToWei(trimmed);
  } catch (err) {
    return getErrorMessage(err);
  }
  return null;
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
  const contract = useGenResolveContract();

  const [claimText, setClaimText] = useState("");
  const [evidence, setEvidence] = useState("");
  const [stake, setStake] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Blur / submit gates: first error after blur or submit attempt; then live.
  const [claimTouched, setClaimTouched] = useState(false);
  const [evidenceTouched, setEvidenceTouched] = useState(false);
  const [stakeTouched, setStakeTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const claimForSubmit = claimText.trim();
  const evidenceForSubmit = evidence;
  const claimLen = claimText.length;
  const evidenceLen = evidence.length;
  const claimOver = claimLen > MAX_CLAIM_TEXT_LEN;
  const evidenceOver = evidenceLen > MAX_EVIDENCE_LEN;

  const claimError = useMemo(() => {
    if (!claimForSubmit) {
      return "Enter a clear claim statement. Empty or whitespace-only text is not allowed.";
    }
    if (claimOver) {
      return `Claim is too long — max ${MAX_CLAIM_TEXT_LEN.toLocaleString()} characters.`;
    }
    return null;
  }, [claimForSubmit, claimOver]);

  const evidenceError = useMemo(() => {
    if (evidenceOver) {
      return `Evidence is too long — max ${MAX_EVIDENCE_LEN.toLocaleString()} characters.`;
    }
    return null;
  }, [evidenceOver]);

  const stakeError = useMemo(() => getStakeError(stake), [stake]);

  const showClaimError =
    (claimTouched || submitAttempted) && !!claimError;
  const showEvidenceError =
    (evidenceTouched || submitAttempted) && !!evidenceError;
  // Length overflow: surface immediately (not "first-type" aggression on empty).
  const showClaimOver = claimOver;
  const showEvidenceOver = evidenceOver;
  const showStakeError = (stakeTouched || submitAttempted) && !!stakeError;

  const claimInvalid = showClaimError || showClaimOver;
  const evidenceInvalid = showEvidenceError || showEvidenceOver;
  const stakeInvalid = showStakeError;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitAttempted(true);
    setClaimTouched(true);
    setStakeTouched(true);
    if (evidenceLen > 0 || evidenceOver) setEvidenceTouched(true);

    if (claimError || evidenceError || stakeError) {
      setFormError("Fix the highlighted fields, then try again.");
      // Focus first invalid field so keyboard/screen-reader users land on the issue.
      requestAnimationFrame(() => {
        const id = claimError
          ? "claim_text"
          : evidenceError
            ? "evidence"
            : "stake";
        document.getElementById(id)?.focus();
      });
      return;
    }

    try {
      if (!isConnected) {
        toast.message("Connect your wallet", {
          description: "Approve the connection request, then we will continue.",
        });
        await connectWallet();
      }
      if (!isOnCorrectNetwork) {
        toast.message("Switch network", {
          description: `Wallet must use ${network.shortName} (chain ${network.chainId}).`,
        });
        await ensureCorrectNetwork();
      }

      const stakeWei = parseGenToWei(stake);

      toast.message("Submitting claim…", {
        description: `Confirm in your wallet · ${network.shortName}`,
      });

      await createClaim.mutateAsync({
        claimText: claimForSubmit,
        evidence: evidenceForSubmit,
        stakeWei,
      });

      // New claim id = previous count (ids are sequential from 0).
      let newId: number | null = null;
      if (contract) {
        try {
          const count = await contract.getClaimCount();
          if (count > 0) newId = count - 1;
        } catch {
          newId = null;
        }
      }

      setClaimText("");
      setEvidence("");
      setStake("");
      setClaimTouched(false);
      setEvidenceTouched(false);
      setStakeTouched(false);
      setSubmitAttempted(false);
      setFormError(null);

      if (newId !== null) {
        // Auto-start judge_claim on the detail page (frontend-only; manual retry remains).
        flagAutoJudge(newId);
        toast.success("Claim created", {
          description: `Opening claim #${newId} — judgment starts next (wallet may prompt again).`,
        });
        router.push(`/claims/${newId}?autoJudge=1`);
      } else {
        toast.success("Claim created", {
          description:
            "Opening the claims list. Open your claim to start judgment if needed.",
        });
        router.push("/claims");
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      setFormError(msg);
      toast.error(msg);
    }
  };

  const submitting = createClaim.isPending;
  // Only hard-block on length overflow / pending. Soft field errors (empty claim,
  // bad stake) are enforced on submit so the CTA stays clickable and errors appear
  // after blur or a submit attempt — not as a silent disabled state.
  const canSubmit = !submitting && !claimOver && !evidenceOver;

  const ctaLabel = submitting
    ? "Creating…"
    : !isConnected
      ? "Connect wallet to submit"
      : !isOnCorrectNetwork
        ? "Switch network & submit"
        : "Submit & judge";

  const claimHelpId = "claim_text-help";
  const claimErrorId = "claim_text-error";
  const evidenceHelpId = "evidence-help";
  const evidenceErrorId = "evidence-error";
  const stakeHelpId = "stake-help";
  const stakeErrorId = "stake-error";

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="glass-card space-y-7 p-6 sm:p-8"
      noValidate
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
            claimInvalid && "border-[var(--false)]"
          )}
          placeholder="State a clear, verifiable claim…"
          value={claimText}
          onChange={(e) => setClaimText(e.target.value)}
          onBlur={() => setClaimTouched(true)}
          maxLength={MAX_CLAIM_TEXT_LEN}
          disabled={submitting}
          aria-invalid={claimInvalid}
          aria-required="true"
          aria-describedby={
            claimInvalid
              ? `${claimHelpId} ${claimErrorId}`
              : claimHelpId
          }
        />
        <p id={claimHelpId} className="field-help">
          One clear statement. Facts that can be checked work better than
          opinions or forecasts.
        </p>
        {claimInvalid && claimError && (
          <p id={claimErrorId} className="field-error" role="alert">
            {claimError}
          </p>
        )}
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
            evidenceInvalid && "border-[var(--false)]"
          )}
          placeholder="Supporting text or https://… links"
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          onBlur={() => setEvidenceTouched(true)}
          maxLength={MAX_EVIDENCE_LEN}
          disabled={submitting}
          aria-invalid={evidenceInvalid}
          aria-describedby={
            evidenceInvalid
              ? `${evidenceHelpId} ${evidenceErrorId}`
              : evidenceHelpId
          }
        />
        <p id={evidenceHelpId} className="field-help">
          Up to a few URLs are fetched during judgment. Max{" "}
          {MAX_EVIDENCE_LEN.toLocaleString()} characters.
        </p>
        {evidenceInvalid && evidenceError && (
          <p id={evidenceErrorId} className="field-error" role="alert">
            {evidenceError}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="field">
          <label className="label" htmlFor="stake">
            <span>Stake (GEN)</span>
            <span className="label-hint">Optional</span>
          </label>
          <input
            id="stake"
            className={cn(
              "input max-w-[12rem]",
              stakeInvalid && "border-[var(--false)]"
            )}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            onBlur={() => setStakeTouched(true)}
            disabled={submitting}
            aria-invalid={stakeInvalid}
            aria-describedby={
              stakeInvalid
                ? `${stakeHelpId} ${stakeErrorId}`
                : stakeHelpId
            }
          />
          <p id={stakeHelpId} className="field-help">
            Decimal GEN amount, e.g. <span className="mono">0</span> or{" "}
            <span className="mono">1.5</span>. Leave empty for zero. Non-refundable
            if you send value.
          </p>
          {stakeInvalid && stakeError && (
            <p id={stakeErrorId} className="field-error" role="alert">
              {stakeError}
            </p>
          )}
        </div>
        <div className="meta-pill sm:mt-8 justify-self-start sm:justify-self-end">
          <span className="live-dot" aria-hidden />
          Target{" "}
          <strong className="text-[var(--text)] ml-0.5">{network.shortName}</strong>
        </div>
      </div>

      <div
        className="rounded-[var(--radius-sm)] border border-[rgba(230,192,105,0.25)] bg-[rgba(230,192,105,0.06)] px-4 py-3 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]"
        role="note"
      >
        <span className="font-semibold text-[var(--gold)]">Non-refundable · </span>
        Any GEN stake is permanently locked in the contract in this MVP. Leave
        stake empty or <span className="mono">0</span> unless you intend to bond
        value.
      </div>

      {isConnected && !isOnCorrectNetwork && (
        <div
          className="alert alert-warning"
          role="status"
          aria-live="polite"
        >
          <div className="alert-title">Wrong network</div>
          <p className="mt-1 opacity-95">
            Your wallet is not on{" "}
            <strong className="text-[var(--text)]">{network.shortName}</strong>{" "}
            (chain {network.chainId}). Switch before submitting, or use the
            primary button to request a switch.
          </p>
          <button
            type="button"
            className="btn btn-secondary min-h-11 mt-3"
            disabled={submitting}
            onClick={() => {
              void ensureCorrectNetwork().catch((err) => {
                const msg = getErrorMessage(err);
                setFormError(msg);
                toast.error(msg);
              });
            }}
          >
            Switch to {network.shortName}
          </button>
        </div>
      )}

      {(formError ||
        (createClaim.isError && !formError && submitAttempted)) && (
        <ErrorAlert
          title="Could not create claim"
          message={
            formError || getErrorMessage(createClaim.error)
          }
        />
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--text-faint)] max-w-xs leading-relaxed">
          {!isConnected
            ? "Draft freely. Connect, submit, then judgment starts automatically on the claim page."
            : !isOnCorrectNetwork
              ? `Connected — switch to ${network.shortName} to submit. Gas applies; stake is optional.`
              : "Wallet signs create, then judgment starts on the claim page (second confirm if needed)."}
        </p>
        <button
          type="submit"
          className="btn btn-primary btn-lg min-h-11"
          disabled={!canSubmit}
          aria-describedby="create-cta-hint"
        >
          {submitting ? (
            <>
              <span className="spinner" aria-hidden />
              Creating…
            </>
          ) : (
            ctaLabel
          )}
        </button>
      </div>
      <p id="create-cta-hint" className="sr-only">
        {!isConnected
          ? "Connect wallet is required before the claim can be submitted."
          : !isOnCorrectNetwork
            ? `You must switch to ${network.shortName} before submit.`
            : "Submits the claim, then opens the claim page and starts judgment automatically."}
      </p>
    </form>
  );
}
