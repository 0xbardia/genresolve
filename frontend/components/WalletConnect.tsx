"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { getErrorMessage, shortAddress } from "@/lib/utils";

function WalletIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M16 13.5h.01M3 10h18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WalletConnect() {
  const {
    address,
    isConnected,
    isLoading,
    hasWallet,
    connectWallet,
    disconnectWallet,
    ensureCorrectNetwork,
    isOnCorrectNetwork,
    network,
  } = useWallet();
  const [busy, setBusy] = useState(false);

  const onConnect = async () => {
    setBusy(true);
    try {
      if (!hasWallet) {
        toast.error("Install MetaMask or Rabby to connect");
        return;
      }
      const addr = await connectWallet();
      toast.success(`Connected ${shortAddress(addr)}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onSwitch = async () => {
    setBusy(true);
    try {
      await ensureCorrectNetwork();
      toast.success(`Switched to ${network.shortName}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <button
        type="button"
        className="btn btn-secondary btn-sm min-h-11"
        disabled
        aria-busy="true"
        aria-label="Loading wallet status"
      >
        <span className="spinner" aria-hidden />
        Loading
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        type="button"
        className="btn btn-secondary btn-sm min-h-11"
        disabled={busy}
        onClick={() => void onConnect()}
        aria-label="Connect wallet"
      >
        {busy ? (
          <>
            <span className="spinner" aria-hidden />
            Connecting
          </>
        ) : (
          <>
            <WalletIcon />
            Connect
          </>
        )}
      </button>
    );
  }

  const displayAddr = shortAddress(address, 4);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {!isOnCorrectNetwork && (
        <button
          type="button"
          className="btn btn-sm min-h-11 border border-[rgba(224,188,73,0.35)] bg-[var(--warning-bg)] text-[var(--gold)]"
          disabled={busy}
          onClick={() => void onSwitch()}
          aria-label={`Switch wallet network to ${network.shortName}`}
        >
          {busy ? "Switching…" : `Use ${network.shortName}`}
        </button>
      )}
      <div
        className="wallet-pill min-h-11"
        title={address ?? undefined}
        aria-label={`Connected wallet ${address ?? ""}`}
      >
        <span className="wallet-pill-avatar" aria-hidden>
          {address ? address.slice(2, 4).toUpperCase() : "??"}
        </span>
        {/* Always show a short address — compact on mobile, slightly longer on sm+ */}
        <span className="sm:hidden mono text-[0.7rem]">{displayAddr}</span>
        <span className="hidden sm:inline mono">{shortAddress(address, 4)}</span>
        {isOnCorrectNetwork && (
          <span
            className="live-dot"
            title="On correct network"
            aria-label="On correct network"
          />
        )}
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm min-h-11 min-w-11"
        onClick={disconnectWallet}
        aria-label="Disconnect wallet"
      >
        <span className="hidden sm:inline">Disconnect</span>
        <span className="sm:hidden" aria-hidden>
          Out
        </span>
      </button>
    </div>
  );
}
