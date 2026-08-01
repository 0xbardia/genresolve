"use client";

import { createClient } from "genlayer-js";
import type { NetworkConfig } from "@/lib/config/networks";
import { toWalletChainParams } from "@/lib/config/networks";

export interface EthereumProvider {
  isMetaMask?: boolean;
  isRabby?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function getEthereumProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export function isInjectedWalletAvailable(): boolean {
  return !!getEthereumProvider();
}

export async function requestAccounts(): Promise<string[]> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("No wallet detected. Install MetaMask or Rabby.");

  try {
    const accounts = (await provider.request({
      method: "eth_requestAccounts",
    })) as string[];
    return accounts;
  } catch (error: unknown) {
    const e = error as { code?: number; message?: string };
    if (e.code === 4001) throw new Error("Connection request rejected");
    throw new Error(e.message || "Failed to connect wallet");
  }
}

export async function getAccounts(): Promise<string[]> {
  const provider = getEthereumProvider();
  if (!provider) return [];
  try {
    return (await provider.request({ method: "eth_accounts" })) as string[];
  } catch {
    return [];
  }
}

export async function getCurrentChainId(): Promise<string | null> {
  const provider = getEthereumProvider();
  if (!provider) return null;
  try {
    return (await provider.request({ method: "eth_chainId" })) as string;
  } catch {
    return null;
  }
}

export async function addNetwork(network: NetworkConfig): Promise<void> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("No wallet detected");

  try {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [toWalletChainParams(network)],
    });
  } catch (error: unknown) {
    const e = error as { code?: number; message?: string };
    if (e.code === 4001) throw new Error("User rejected adding the network");
    throw new Error(e.message || "Failed to add network");
  }
}

export async function switchToNetwork(network: NetworkConfig): Promise<void> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("No wallet detected");

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.chainIdHex }],
    });
  } catch (error: unknown) {
    const e = error as { code?: number; message?: string };
    if (e.code === 4902) {
      await addNetwork(network);
      return;
    }
    if (e.code === 4001) throw new Error("User rejected network switch");
    throw new Error(e.message || "Failed to switch network");
  }
}

export function isOnNetwork(
  chainIdHex: string | null,
  network: NetworkConfig
): boolean {
  if (!chainIdHex) return false;
  return parseInt(chainIdHex, 16) === network.chainId;
}

/**
 * Create a genlayer-js client for the selected network.
 * When `address` is set, writes are signed via window.ethereum.
 */
export function createGenLayerClient(
  network: NetworkConfig,
  address?: string | null
) {
  const config: {
    chain: NetworkConfig["chain"];
    endpoint?: string;
    account?: `0x${string}`;
  } = {
    chain: network.chain,
    endpoint: network.rpcUrl,
  };

  if (address) {
    config.account = address as `0x${string}`;
  }

  return createClient(config as Parameters<typeof createClient>[0]);
}

/**
 * Ensure wallet is on the target network, then call client.connect so
 * genlayer-js routes signing correctly.
 */
export async function prepareClientForWrite(
  network: NetworkConfig,
  address: string
) {
  await switchToNetwork(network);
  const client = createGenLayerClient(network, address);
  try {
    // genlayer-js: "studionet" | "testnetBradbury" | ...
    await (client as { connect?: (n: string) => Promise<void> }).connect?.(
      network.connectKey
    );
  } catch (err) {
    // Some SDK versions may not expose connect; continue if wallet is correct chain.
    console.warn("client.connect skipped or failed:", err);
  }
  return client;
}
