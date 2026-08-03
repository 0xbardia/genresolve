"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useJudgeClaim } from "@/lib/hooks/useGenResolve";
import { ErrorAlert } from "@/components/ErrorAlert";
import { consumeAutoJudge } from "@/lib/autoJudge";
import { getErrorMessage } from "@/lib/utils";

export function JudgeButton({
  claimId,
  status,
  onJudged,
  /** From create flow (?autoJudge=1) — skip confirm dialog once */
  autoStart = false,
}: {
  claimId: number;
  status: string;
  /** Called after a successful judgment (claim queries invalidated). */
  onJudged?: () => void;
  autoStart?: boolean;
}) {
  const {
    isConnected,
    connectWallet,
    ensureCorrectNetwork,
    isOnCorrectNetwork,
    network,
  } = useWallet();
  const judge = useJudgeClaim();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [autoPhase, setAutoPhase] = useState<"idle" | "starting" | "done">(
    "idle"
  );

  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const autoStartedRef = useRef(false);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!confirmOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.classList.add("dialog-open");
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => cancelRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setConfirmOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
        return;
      }
      if (e.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("dialog-open");
      document.body.style.overflow = prevOverflow;
    };
  }, [confirmOpen]);

  const runJudge = useCallback(
    async (opts?: { fromAuto?: boolean }) => {
      setError(null);
      setConfirmOpen(false);
      const fromAuto = !!opts?.fromAuto;
      try {
        if (!isConnected) {
          toast.message("Connect your wallet", {
            description: fromAuto
              ? "Approve connection to start automatic judgment."
              : "Approve the connection, then judgment can continue.",
          });
          await connectWallet();
        }
        if (!isOnCorrectNetwork) {
          toast.message("Switch network", {
            description: `Use ${network.shortName} in your wallet to continue.`,
          });
          await ensureCorrectNetwork();
        }

        toast.message(fromAuto ? "Judging claim…" : "Judgment started", {
          description: fromAuto
            ? "Confirm the judgment transaction in your wallet if prompted. This can take a few minutes."
            : "AI reviewers are checking the claim. This can take a few minutes.",
        });

        await judge.mutateAsync(claimId);

        toast.success("Judgment complete", {
          description: "The verdict is now saved on-chain and public.",
        });
        setAutoPhase("done");
        onJudged?.();
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        setAutoPhase("done");
        toast.error(
          fromAuto
            ? `Automatic judgment failed — claim is still Pending. You can retry below. ${msg}`
            : msg
        );
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    },
    [
      claimId,
      connectWallet,
      ensureCorrectNetwork,
      isConnected,
      isOnCorrectNetwork,
      judge,
      network.shortName,
      onJudged,
    ]
  );

  // Auto-trigger once after create (session flag and/or ?autoJudge=1)
  useEffect(() => {
    if (status !== "Pending") return;
    if (autoStartedRef.current || judge.isPending) return;

    const fromSession = consumeAutoJudge(claimId);
    const shouldAuto = autoStart || fromSession;
    if (!shouldAuto) return;

    autoStartedRef.current = true;
    setAutoPhase("starting");
    void runJudge({ fromAuto: true });
  }, [status, claimId, autoStart, judge.isPending, runJudge]);

  if (status !== "Pending") return null;

  if (judge.isPending || autoPhase === "starting") {
    return (
      <div className="space-y-3">
        <div className="judging-panel" role="status" aria-live="polite">
          <div className="relative z-[1]">
            <div className="judging-title">
              <span className="judging-pulse" aria-hidden />
              {autoPhase === "starting" && !judge.isPending
                ? "Starting judgment…"
                : "Judging this claim…"}
            </div>
            <p className="judging-desc">
              Independent AI reviewers examine the claim and evidence, then
              agree on a result. Waiting is normal — the process is active, not
              stuck.
              {autoPhase === "starting" || judge.isPending ? (
                <>
                  {" "}
                  Your wallet may ask you to sign the judgment transaction.
                </>
              ) : null}
            </p>
            <div className="progress-row" aria-hidden>
              <div className="progress-dot done" />
              <div className="progress-dot done" />
              <div className="progress-dot active" />
              <div className="progress-dot" />
              <div className="progress-dot" />
            </div>
            <p className="claim-meta mt-3">
              In progress · keep this page open or refresh later
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
          {error ? "Judgment not finished" : "Ready for judgment"}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)] max-w-xl">
          {error
            ? "The claim was created and is still Pending. Start judgment again when you are ready — the result is public and cannot be undone."
            : "Anyone can start an AI review. You will confirm in your wallet. The result (True, False, or Unverifiable) is public and cannot be undone."}
        </p>
        <div className="mt-4">
          <button
            ref={triggerRef}
            type="button"
            className="btn btn-primary min-h-11"
            onClick={() => setConfirmOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={confirmOpen}
            aria-controls={confirmOpen ? "judge-confirm-dialog" : undefined}
          >
            {error ? "Retry judgment" : "Start judgment"}
          </button>
        </div>
      </div>
      {error && <ErrorAlert title="Judgment failed" message={error} />}

      {confirmOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConfirm();
          }}
        >
          <div
            ref={panelRef}
            id="judge-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="dialog-panel"
            tabIndex={-1}
          >
            <h2
              id={titleId}
              className="text-base font-semibold tracking-tight text-[var(--text)]"
            >
              Confirm judgment?
            </h2>
            <p
              id={descId}
              className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]"
            >
              This starts a permanent, public review of claim{" "}
              <span className="mono text-[var(--text)]">#{claimId}</span> on{" "}
              <strong className="text-[var(--text)]">{network.shortName}</strong>.
              Once finished, the verdict cannot be changed or removed.
            </p>
            <ul className="mt-3 space-y-1.5 text-[0.8125rem] text-[var(--text-muted)] list-disc pl-4">
              <li>Your wallet will ask you to sign a transaction</li>
              <li>Gas fees apply; judgment itself has no extra stake</li>
              <li>Results stay on-chain for anyone to read</li>
            </ul>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                className="btn btn-secondary min-h-11"
                onClick={closeConfirm}
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                type="button"
                className="btn btn-primary min-h-11"
                onClick={() => void runJudge()}
              >
                Confirm & start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
