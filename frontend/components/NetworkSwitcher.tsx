"use client";

import { NETWORK_LIST, type NetworkId } from "@/lib/config/networks";
import { useWallet } from "@/lib/genlayer/WalletProvider";

export function NetworkSwitcher() {
  const { networkId, setNetworkId, isOnCorrectNetwork, isConnected } =
    useWallet();

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-1">
      <div className="network-switch" role="group" aria-label="Select network">
        {NETWORK_LIST.map((n) => {
          const active = n.id === networkId;
          return (
            <button
              key={n.id}
              type="button"
              className="network-option"
              data-active={active ? "true" : "false"}
              onClick={() => void setNetworkId(n.id as NetworkId)}
              aria-pressed={active}
            >
              <span className="net-dot" aria-hidden />
              {n.shortName}
            </button>
          );
        })}
      </div>
      {isConnected && !isOnCorrectNetwork && (
        <span className="text-[10px] font-medium text-[var(--gold)] tracking-wide px-0.5">
          Wallet on wrong chain
        </span>
      )}
    </div>
  );
}
