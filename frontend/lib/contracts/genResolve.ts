import { TransactionStatus } from "genlayer-js/types";
import type { NetworkConfig } from "@/lib/config/networks";
import {
  createGenLayerClient,
  prepareClientForWrite,
} from "@/lib/genlayer/client";
import {
  normalizeClaim,
  type Claim,
  type TransactionReceipt,
} from "@/lib/contracts/types";

/**
 * Thin wrapper around the GenResolve Intelligent Contract via genlayer-js.
 * On-chain Python class may still be named TruthLedger (deployed ABI unchanged).
 */
export class GenResolveContract {
  private contractAddress: `0x${string}`;
  private network: NetworkConfig;
  private address: string | null;

  constructor(
    network: NetworkConfig,
    contractAddress: string,
    address?: string | null
  ) {
    this.network = network;
    this.contractAddress = contractAddress as `0x${string}`;
    this.address = address ?? null;
  }

  private readClient() {
    return createGenLayerClient(this.network, this.address);
  }

  private assertConfigured() {
    if (!this.contractAddress || this.contractAddress === "0x") {
      throw new Error(
        `Contract address not configured for ${this.network.shortName}. Set NEXT_PUBLIC_CONTRACT_ADDRESS_${this.network.id === "studionet" ? "STUDIONET" : "BRADBURY"} in .env.local`
      );
    }
  }

  async getClaimCount(): Promise<number> {
    this.assertConfigured();
    const client = this.readClient();
    const result = await client.readContract({
      address: this.contractAddress,
      functionName: "get_claim_count",
      args: [],
    });
    return Number(result ?? 0);
  }

  async getOwner(): Promise<string> {
    this.assertConfigured();
    const client = this.readClient();
    const result = await client.readContract({
      address: this.contractAddress,
      functionName: "get_owner",
      args: [],
    });
    return String(result ?? "");
  }

  async getClaim(claimId: number): Promise<Claim> {
    this.assertConfigured();
    const client = this.readClient();
    const result = await client.readContract({
      address: this.contractAddress,
      functionName: "get_claim",
      args: [claimId],
    });
    return normalizeClaim(result);
  }

  async getClaims(offset = 0, limit = 20): Promise<Claim[]> {
    this.assertConfigured();
    const client = this.readClient();
    const result = await client.readContract({
      address: this.contractAddress,
      functionName: "get_claims",
      args: [offset, limit],
    });
    if (!Array.isArray(result)) return [];
    return result.map(normalizeClaim);
  }

  async createClaim(
    claimText: string,
    evidence: string,
    stakeWei: bigint = BigInt(0)
  ): Promise<TransactionReceipt> {
    this.assertConfigured();
    if (!this.address) throw new Error("Connect a wallet to create a claim");

    const client = await prepareClientForWrite(this.network, this.address);
    const txHash = await client.writeContract({
      address: this.contractAddress,
      functionName: "create_claim",
      args: [claimText, evidence || ""],
      value: stakeWei,
    });

    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      status: TransactionStatus.ACCEPTED,
      retries: 36,
      interval: 5000,
    });

    return receipt as TransactionReceipt;
  }

  async judgeClaim(claimId: number): Promise<TransactionReceipt> {
    this.assertConfigured();
    if (!this.address) throw new Error("Connect a wallet to judge a claim");

    const client = await prepareClientForWrite(this.network, this.address);
    const txHash = await client.writeContract({
      address: this.contractAddress,
      functionName: "judge_claim",
      args: [claimId],
      value: BigInt(0),
    });

    // Judgment uses AI consensus — allow longer wait
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      status: TransactionStatus.ACCEPTED,
      retries: 60,
      interval: 5000,
    });

    return receipt as TransactionReceipt;
  }
}

/** @deprecated Use GenResolveContract — alias for gradual migration */
export const TruthLedgerContract = GenResolveContract;
