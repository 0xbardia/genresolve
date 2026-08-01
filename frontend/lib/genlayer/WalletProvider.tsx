"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getDefaultNetworkId,
  getNetwork,
  type NetworkConfig,
  type NetworkId,
} from "@/lib/config/networks";
import {
  getAccounts,
  getCurrentChainId,
  getEthereumProvider,
  isInjectedWalletAvailable,
  isOnNetwork,
  requestAccounts,
  switchToNetwork,
} from "@/lib/genlayer/client";

const DISCONNECT_FLAG = "genresolve_wallet_disconnected";
const NETWORK_KEY = "genresolve_network";

export interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  hasWallet: boolean;
  isOnCorrectNetwork: boolean;
  networkId: NetworkId;
  network: NetworkConfig;
  contractAddress: string;
}

interface WalletContextValue extends WalletState {
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  setNetworkId: (id: NetworkId) => Promise<void>;
  ensureCorrectNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

function readStoredNetworkId(): NetworkId {
  if (typeof window === "undefined") return getDefaultNetworkId();
  const stored = localStorage.getItem(NETWORK_KEY) as NetworkId | null;
  if (stored === "studionet" || stored === "bradbury") return stored;
  return getDefaultNetworkId();
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [networkId, setNetworkIdState] = useState<NetworkId>(getDefaultNetworkId);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasWallet, setHasWallet] = useState(false);

  const network = useMemo(() => getNetwork(networkId), [networkId]);
  const isOnCorrectNetwork = isOnNetwork(chainId, network);
  const isConnected = !!address;
  const contractAddress = network.contractAddress;

  const refresh = useCallback(async () => {
    const installed = isInjectedWalletAvailable();
    setHasWallet(installed);
    if (!installed) {
      setAddress(null);
      setChainId(null);
      setIsLoading(false);
      return;
    }

    if (typeof window !== "undefined" && localStorage.getItem(DISCONNECT_FLAG) === "true") {
      setAddress(null);
      const cid = await getCurrentChainId();
      setChainId(cid);
      setIsLoading(false);
      return;
    }

    try {
      const accounts = await getAccounts();
      const cid = await getCurrentChainId();
      setAddress(accounts[0] || null);
      setChainId(cid);
    } catch (e) {
      console.error(e);
      setAddress(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setNetworkIdState(readStoredNetworkId());
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const provider = getEthereumProvider();
    if (!provider) return;

    const onAccounts = (...args: unknown[]) => {
      const accounts = (args[0] as string[]) || [];
      if (accounts.length > 0) {
        localStorage.removeItem(DISCONNECT_FLAG);
        setAddress(accounts[0]);
      } else {
        setAddress(null);
      }
    };

    const onChain = (...args: unknown[]) => {
      const id = args[0] as string;
      setChainId(id);
    };

    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener("accountsChanged", onAccounts);
      provider.removeListener("chainChanged", onChain);
    };
  }, []);

  const connectWallet = useCallback(async () => {
    const accounts = await requestAccounts();
    if (!accounts[0]) throw new Error("No account returned");
    localStorage.removeItem(DISCONNECT_FLAG);
    setAddress(accounts[0]);
    try {
      await switchToNetwork(network);
    } catch (e) {
      console.warn("Network switch after connect failed:", e);
    }
    const cid = await getCurrentChainId();
    setChainId(cid);
    return accounts[0];
  }, [network]);

  const disconnectWallet = useCallback(() => {
    localStorage.setItem(DISCONNECT_FLAG, "true");
    setAddress(null);
  }, []);

  const setNetworkId = useCallback(
    async (id: NetworkId) => {
      localStorage.setItem(NETWORK_KEY, id);
      setNetworkIdState(id);
      const next = getNetwork(id);
      if (address) {
        try {
          await switchToNetwork(next);
          const cid = await getCurrentChainId();
          setChainId(cid);
        } catch (e) {
          console.warn("Failed to switch wallet chain:", e);
        }
      }
    },
    [address]
  );

  const ensureCorrectNetwork = useCallback(async () => {
    await switchToNetwork(network);
    const cid = await getCurrentChainId();
    setChainId(cid);
  }, [network]);

  const value: WalletContextValue = {
    address,
    chainId,
    isConnected,
    isLoading,
    hasWallet,
    isOnCorrectNetwork,
    networkId,
    network,
    contractAddress,
    connectWallet,
    disconnectWallet,
    setNetworkId,
    ensureCorrectNetwork,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
