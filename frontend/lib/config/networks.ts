import { studionet, testnetBradbury } from "genlayer-js/chains";
import type { Chain } from "viem";

export type NetworkId = "studionet" | "bradbury";

export interface NetworkConfig {
  id: NetworkId;
  name: string;
  shortName: string;
  chainId: number;
  chainIdHex: string;
  rpcUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** genlayer-js chain object */
  chain: Chain;
  /** Argument for client.connect(...) */
  connectKey: "studionet" | "testnetBradbury";
  explorerUrl?: string;
  /**
   * Deployed GenResolve address for this network.
   * Resolved at call time via getNetwork() so Next can inline NEXT_PUBLIC_* vars.
   */
  contractAddress: string;
}

/**
 * Next.js only inlines NEXT_PUBLIC_* when accessed as static property paths:
 *   process.env.NEXT_PUBLIC_FOO   ✅ inlined into client bundle
 *   process.env[key]             ❌ left as runtime lookup → undefined in browser
 *
 * Always use direct property access below — never process.env[variable].
 */
function sanitizeAddress(raw: string | undefined): string {
  const value = (raw || "").trim();
  if (!value) return "";
  // Treat example placeholders from .env.example as unset
  if (/^0xYour/i.test(value) || value.includes("YourBradbury") || value.includes("YourStudionet")) {
    return "";
  }
  return value;
}

/** Static env reads — required for Next.js client-side inlining */
export function getStudionetContractAddress(): string {
  return sanitizeAddress(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STUDIONET);
}

export function getBradburyContractAddress(): string {
  return sanitizeAddress(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BRADBURY);
}

export function getContractAddressForNetwork(id: NetworkId): string {
  if (id === "bradbury") return getBradburyContractAddress();
  return getStudionetContractAddress();
}

const NETWORK_BASE: Record<
  NetworkId,
  Omit<NetworkConfig, "contractAddress">
> = {
  studionet: {
    id: "studionet",
    name: "GenLayer Studionet",
    shortName: "Studionet",
    chainId: 61999,
    chainIdHex: `0x${(61999).toString(16)}`,
    rpcUrl: "https://studio.genlayer.com/api",
    currency: { name: "GEN", symbol: "GEN", decimals: 18 },
    chain: studionet as Chain,
    connectKey: "studionet",
    explorerUrl: "https://studio.genlayer.com",
  },
  bradbury: {
    id: "bradbury",
    name: "GenLayer Bradbury Testnet",
    shortName: "Bradbury",
    chainId: 4221,
    chainIdHex: `0x${(4221).toString(16)}`,
    rpcUrl: "https://rpc-bradbury.genlayer.com",
    currency: { name: "GEN", symbol: "GEN", decimals: 18 },
    chain: testnetBradbury as Chain,
    connectKey: "testnetBradbury",
    explorerUrl:
      "https://zksync-os-testnet-genlayer.explorer.zksync.dev",
  },
};

/**
 * Full network map with addresses resolved via static env access.
 * Prefer getNetwork(id) so address is always current.
 */
export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  studionet: {
    ...NETWORK_BASE.studionet,
    get contractAddress() {
      return getStudionetContractAddress();
    },
  },
  bradbury: {
    ...NETWORK_BASE.bradbury,
    get contractAddress() {
      return getBradburyContractAddress();
    },
  },
};

export const NETWORK_LIST: NetworkConfig[] = [
  NETWORKS.studionet,
  NETWORKS.bradbury,
];

export function getDefaultNetworkId(): NetworkId {
  // Static access for Next inlining
  const raw = (
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK || "studionet"
  ).toLowerCase();
  if (raw === "bradbury" || raw === "testnetbradbury") return "bradbury";
  return "studionet";
}

export function getNetwork(id: NetworkId): NetworkConfig {
  const base = NETWORK_BASE[id];
  return {
    ...base,
    contractAddress: getContractAddressForNetwork(id),
  };
}

export function networkByChainId(chainId: number): NetworkConfig | undefined {
  const found = NETWORK_LIST.find((n) => n.chainId === chainId);
  return found ? getNetwork(found.id) : undefined;
}

/** Wallet_addEthereumChain payload for a network */
export function toWalletChainParams(network: NetworkConfig) {
  return {
    chainId: network.chainIdHex,
    chainName: network.name,
    nativeCurrency: network.currency,
    rpcUrls: [network.rpcUrl],
    blockExplorerUrls: network.explorerUrl ? [network.explorerUrl] : [],
  };
}
